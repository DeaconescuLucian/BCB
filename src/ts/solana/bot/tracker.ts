import { Connection, KeyedAccountInfo, PublicKey, Commitment, Keypair, ConfirmedSignatureInfo, VersionedTransactionResponse, ConfirmedTransactionMeta, LogsCallback, Logs, Context, ComputeBudgetProgram, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotentInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, MarketStateV3, struct, publicKey, GetStructureSchema, LiquidityPoolKeys, LiquidityStateV4, Percent, SPL_MINT_LAYOUT  } from "@raydium-io/raydium-sdk";
import { checkIfTransactionIsLPBurn, createPoolKeys, getMinimalMarketV3 } from "./helpers";
import { createSignedTransaction, sendTransaction, simulateTransaction } from "../transactions";
import * as raydium from "@raydium-io/raydium-sdk"
import * as bs58 from 'bs58';
import BN from 'bn.js';
import { TokenState, FilterList, FilterValue, FilterKey } from "./filters";
import { MinimalTokenAccountData, MinimalMarketLayoutV3, checkPrice, checkSupply } from "./helpers";
import { sell } from "../transactions";
let INITIALIZED = false;
let wallet: Keypair;
let connection: Connection;
let tokenTracker: TokenTracker | null = null;
const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium.MAINNET_PROGRAM_ID.AmmV4;
const OPENBOOK_PROGRAM_ID = raydium.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
let existingLiquidityPools = new Set<string>();
let existingOpenBookMarkets = new Set<string>();
let existingTokenAccounts: Map<string, MinimalTokenAccountData> = new Map<string, MinimalTokenAccountData>();

type TrackedToken = {
  mint: PublicKey;
  state: TokenState;
};

type TrackerParameters = {
  trackduration: number;
  buyAmount: number;
}

function saveTokenAccount(mint: PublicKey, accountData: MinimalMarketLayoutV3) {
  const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);
  const tokenAccount = <MinimalTokenAccountData>{
    address: ata,
    mint: mint,
    market: <MinimalMarketLayoutV3>{
      bids: accountData.bids,
      asks: accountData.asks,
      eventQueue: accountData.eventQueue,
    },
  };
  existingTokenAccounts.set(mint.toString(), tokenAccount);
  return tokenAccount;
}

class TokenTracker {
  tokens: TrackedToken[] = [];
  trades: Trade[] = [];
  settings: TrackerParameters;
  connection: Connection;

  constructor(connection: Connection, settings: TrackerParameters) {
    this.connection = connection;
    this.settings = settings;
  }

  public async addToken(state:TokenState) {
    this.tokens.push({ mint: state.poolState.baseMint, state: state });
    this.subscribeToLpBurn(state);
  }

  public async createAndExecuteTrade(token: TrackedToken, targetPrice: number, stopLossPrice: number, sellPercentage: number = 100) {
    const trade = new Trade(token.state, targetPrice, stopLossPrice, sellPercentage);
    const buySuccess = await trade.buy();
    if (buySuccess) {
      this.trades.push(trade);
      console.log(`Trade opened for token ${token.mint.toString()}`);
    } else {
      console.log(`Failed to open trade for token ${token.mint.toString()}`);
    }
  }

  private async subscribeToLpBurn(state:TokenState) {
    const key = state.poolState.lpMint;
    await state.initP;
    const lpSupply = state.lpSupply!;
    console.log(lpSupply);
    const processedSignatures = new Set<string>();

    const sub = connection.onLogs(key, 
      async (logs:Logs, ctx: Context) =>{
          let retries = 5
          let delay = 200;
          if(!logs.err){
            const signature = logs.signature;
            if (processedSignatures.has(signature)) {
              return;
            }
            processedSignatures.add(signature);
            for(let i = 0; i <= retries; i++){
            try{
              console.log(logs.signature);
              let resp = await connection.getTransaction(logs.signature, {commitment:'confirmed', maxSupportedTransactionVersion:2})
              if(!resp) throw new Error;
              let meta = resp.meta;
              if(await checkIfTransactionIsLPBurn(meta, lpSupply)){
                console.log(`Detected LP Burn for token ${key.toString()}`);
                await this.unsubscribefromToken(sub);
                return;
              }
            }
            catch(e){
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
        }
      }
      }
      
        ,'processed');

    console.log(`Subscribed to token ${key.toString()} for ${this.settings.trackduration} seconds`);

    setTimeout(async () => {
      await this.unsubscribefromToken(sub);
    }, this.settings.trackduration * 1000);
  }

  private async unsubscribefromToken(sub:number) {
    try{
      connection.removeOnLogsListener(sub);
    }
    catch(e){
      //
    }
  }
}

class Trade {
  state: TokenState;
  token: PublicKey;
  status: 'pending' | 'open' | 'closed' | 'failed';
  openPrice: number | null;
  currentPrice: number | null;
  targetPercentage: number;
  stopLossPercentage: number;
  targetPrice: number | null;
  stopLossPrice: number | null;
  ownedTokenAmount: number | null;
  quoteAmount: number;
  sellPercentage: number;
  updateInterval: NodeJS.Timeout | null;
  connection: Connection;
  isSimulated: boolean;

  constructor(
    state: TokenState,
    quoteAmount: number,
    targetPercentage: number,
    stopLossPercentage: number,
    sellPercentage: number = 100,
    isSimulated: boolean = false
  ) {
    this.state = state;
    this.token = state.poolState.baseMint;
    this.status = 'pending';
    this.openPrice = null;
    this.currentPrice = null;
    this.targetPercentage = targetPercentage;
    this.stopLossPercentage = stopLossPercentage;
    this.targetPrice = null;
    this.stopLossPrice = null;
    this.ownedTokenAmount = null;
    this.quoteAmount = quoteAmount;
    this.sellPercentage = sellPercentage;
    this.updateInterval = null;
    this.connection = state.connection;
    this.isSimulated = isSimulated;
  }

  private calculateTargetAndStopLossPrices() {
    if (this.openPrice === null) {
      throw new Error('Open price is not set');
    }
    this.targetPrice = this.openPrice * (1 + this.targetPercentage / 100);
    this.stopLossPrice = this.openPrice * (1 - this.stopLossPercentage / 100);
  }

  private startPriceUpdates() {
    this.updateInterval = setInterval(async () => {
      await this.updatePrice();
      if (this.shouldSell()) {
        await this.sell();
      }
    }, 500);
  }

  private async updatePrice() {
    try {
      const newPrice = await checkPrice(this.state.poolState.baseVault, this.state.poolState.quoteVault, this.connection, false);
      console.log(`Price updated: ${newPrice}`);
      this.currentPrice = newPrice;
      this.getPerformance();
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  }

  private shouldSell(): boolean {
    if (this.currentPrice === null || this.targetPrice === null || this.stopLossPrice === null) return false;
    return this.currentPrice >= this.targetPrice || this.currentPrice <= this.stopLossPrice;
  }

  async buy(): Promise<boolean> {
    try {
      console.log(`buying`)
      this.status = 'pending';
      const buyResult = await this.executeBuy();
      if (buyResult.success) {
        console.log(`buy success`)
        this.status = 'open';
        this.openPrice = buyResult.price!;
        this.ownedTokenAmount = buyResult.amount!;
        console.log(`open price: ${this.openPrice}`)
        console.log(`owned token amount: ${this.ownedTokenAmount}`)
        this.currentPrice = this.openPrice;
        this.calculateTargetAndStopLossPrices();
        this.startPriceUpdates();
        return true;
      } else {
        this.status = 'failed';
        return false;
      }
    } catch (error) {
      console.error('Buy failed:', error);
      this.status = 'failed';
      return false;
    }
  }

  private async executeBuy(): Promise<{ success: boolean; amount?: number, price?:number }> {
    let poolState = this.state.poolState;
    let key = this.state.poolState.baseMint;
    let tokenAccount = existingTokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = saveTokenAccount(poolState.baseMint, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet!.publicKey, true);
    const quoteAmount = new BN(this.quoteAmount * LAMPORTS_PER_SOL);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);
    
    const { innerTransaction } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: quotetokenAccount,
          tokenAccountOut: tokenAccount.address,
          owner: wallet.publicKey,
        },
        amountIn: quoteAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version,
    );

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount.address, wallet!.publicKey, key),
      ...innerTransaction.instructions
    ];

    const block = await this.connection.getLatestBlockhash('finalized');
    const tx = await createSignedTransaction(instructions, this.connection, wallet);
    const result = await sendTransaction(tx, block, this.connection, this.isSimulated);
    
    if (result.success) {
      if (this.isSimulated) {
        const amount = 0;
        const token_price = await checkPrice(poolState.baseVault, poolState.quoteVault, this.connection, false);
        console.log(`execute token price: ${token_price}`)
        const price = token_price? token_price : 0;
        return { success: true, amount, price };
      } else {
        const amount = 0;
        //TODO
        return { success: true, amount, price: 0 };
      }
    } else {
      return { success: false };
    }
  }

  async sell(): Promise<boolean> {
    if (this.status !== 'open') return false;

    try {
      const sellResult = await this.executeSell();
      if (sellResult.success) {
        this.status = 'closed';
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
        }
        console.log(`sell success`)
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sell failed:', error);
      return false;
    }
  }

  private async executeSell(): Promise<{ success: boolean }> {
    if (this.isSimulated) {
      return { success: true };
    }
    let poolState = this.state.poolState;
    let key = this.state.poolState.baseMint;
    let tokenAccount = existingTokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = saveTokenAccount(poolState.baseMint, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet!.publicKey, true);
    const tokenAmount = new BN(this.ownedTokenAmount!);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);
  
    const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: tokenAccount.address,
          tokenAccountOut: quotetokenAccount,
          owner: wallet!.publicKey,
        },
        amountIn: tokenAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version
    );
  
    let lastbk = (await connection.getLatestBlockhash('finalized')).blockhash;
  
    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        quotetokenAccount,
        wallet.publicKey,
        quoteToken
      ),
      ...innerTransaction.instructions,
    ];
  
    const sell_tx = await createSignedTransaction(instructions, connection, wallet, lastbk);
    
    const result = await sendTransaction(sell_tx, lastbk, this.connection, this.isSimulated);
    //TODO
    return { success: result.success };
  }

  getPerformance(){
    let msg = `Percentage gain: ${(((this.currentPrice! - this.openPrice!) / this.openPrice!) * 100).toFixed(2)}%`
    console.log(msg)
  }
}


async function processOpenBookMarket(
    updatedAccountInfo: KeyedAccountInfo,
  ) {
    let accountData: MarketStateV3 | undefined;
    try {
      accountData = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);

      if (existingTokenAccounts.has(accountData.baseMint.toString())) {
        return;
      }
  
      saveTokenAccount(accountData.baseMint, accountData);
    } catch (e) {
      console.log({ ...accountData, error: e }, `Failed to process market`);
    }
}

async function processRaydiumPool(id: PublicKey, poolState: LiquidityStateV4, filters:FilterList) {
  try {
    let state = new TokenState(poolState, filters, connection);
    state.poolId = id;
    state.init();
    let results: Promise<boolean>[] = [];
    
    if (state.hasFilter('NOT_MINTABLE')) {
      results.push(state.checkMintable());
    }
    if (state.hasFilter('NOT_FREEZABLE')) {
      results.push(state.checkFreezable());
    }
    if (state.hasFilter('MINIMUM_SOLANA_POOL')) {
      results.push(state.checkMinimumSolanaPool(Number(filters.get('MINIMUM_SOLANA_POOL'))));
    }
    if (state.hasFilter('MAXIMUM_SOLANA_POOL')) {
      results.push(state.checkMaximumSolanaPool(Number(filters.get('MAXIMUM_SOLANA_POOL'))));
    }
    if (state.hasFilter('MINIMUM_POOL_PERCENTAGE')) {
      results.push(state.checkMinimumPoolPercentage(Number(filters.get('MINIMUM_POOL_PERCENTAGE'))));
    }

    let resultsArray = await Promise.all(results);
    console.log(`Checking filters for token`);

    if(resultsArray.includes(false)){
      console.log(`Skipping pool due to filters`);
      return;
    }
    else{
      console.log(`Adding token to tracker`);
      tokenTracker?.addToken(state);
    }

    await state.initP;
    console.log(`wait 10s`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    let trade = new Trade(state, 0.001, 100, 50, 100, true);
    trade.buy();

  }
  catch (e) {
        console.log({error: e}, `Failed to process pool`);
  }
}  

export async function startProcess(data:{connection:Connection, wallet:Keypair}) {
    if (INITIALIZED) {
        console.log('Tracker process already started');
        return;
    }
    console.log('Starting tracker process');
    INITIALIZED = true;
    connection = data.connection;
    wallet = data.wallet;

    const filters: FilterList = new Map<FilterKey, FilterValue>([
      ['NOT_MINTABLE', 1],
      ['NOT_FREEZABLE', 1],
      // ['MINIMUM_SOLANA_POOL', 1],
      // ['MAXIMUM_SOLANA_POOL', 1000],
      // ['MINIMUM_POOL_PERCENTAGE', 95],
    ]);

    let settings = {
      trackduration: 500,
      buyAmount: 0.5,
    }

    if (!tokenTracker){
      tokenTracker = new TokenTracker(connection, settings);
    }



    const runTimestamp = Math.floor(new Date().getTime() / 1000);

    const raydiumSubscriptionId = connection.onProgramAccountChange(
        RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        async (updatedAccountInfo) => {
        const key = updatedAccountInfo.accountId.toString();
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
        const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
        const existing = existingLiquidityPools.has(key);
        const newrunTimestamp = Math.floor(new Date().getTime() / 1000);
    
        const poolOpenTimeReadable = new Date(poolOpenTime * 1000).toLocaleString();
        const newrunTimestampReadable = new Date(newrunTimestamp * 1000).toLocaleString();
    
        if (poolOpenTime > runTimestamp  && !existing) {
            existingLiquidityPools.add(key);

            console.log(`Pool Detected Time: ${newrunTimestampReadable}`);
            console.log(`Pool Open Time: ${poolOpenTimeReadable}`);
            console.log(`New pool: ${key}`);
            processRaydiumPool(updatedAccountInfo.accountId, poolState, filters);
        }


        },
        {commitment:'processed',
            encoding: 'base64',
            filters:
        [
        { dataSize: raydium.LIQUIDITY_STATE_LAYOUT_V4.span },
        {
            memcmp: {
            offset: raydium.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
            bytes: raydium.Token.WSOL.mint.toBase58(),
            },
        },
        {
            memcmp: {
            offset: raydium.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
            bytes: OPENBOOK_PROGRAM_ID.toBase58(),
            },
        },
        {
            memcmp: {
            offset: raydium.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
            bytes: bs58.encode([6, 0, 0, 0, 0, 0, 0, 0]),
            },
        },
        ],}
    );
    
    const openBookSubscriptionId = connection.onProgramAccountChange(
        OPENBOOK_PROGRAM_ID,
        async (updatedAccountInfo) => {
        const key = updatedAccountInfo.accountId.toString();
        const existing = existingOpenBookMarkets.has(key);
        if (!existing) {
            existingOpenBookMarkets.add(key);
            const _ = processOpenBookMarket(updatedAccountInfo);
        }
        },
        {commitment:'processed',
            encoding: 'base64',
            filters:
        [
        { dataSize: raydium.MARKET_STATE_LAYOUT_V3.span },
        {
            memcmp: {
            offset: raydium.MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint'),
            bytes: raydium.Token.WSOL.mint.toBase58(),
            },
        },
        ],
        }
    );
    

};
    
