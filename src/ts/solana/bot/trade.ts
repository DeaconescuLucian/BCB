import { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createSignedTransaction, sendTransaction } from '../transactions';
import { checkPrice, createPoolKeys, getMinimalMarketV3 } from './helpers';
import BN from 'bn.js';
import * as raydium from '@raydium-io/raydium-sdk';
import { TokenState } from './filters';
import { ITrackProcessInterface } from './trackProcess';

export default class Trade {
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
  wallet: Keypair;
  trackProcess: ITrackProcessInterface;

  constructor(
    trackProcess: ITrackProcessInterface,
    state: TokenState,
    quoteAmount: number,
    targetPercentage: number,
    stopLossPercentage: number,
    wallet: Keypair,
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
    this.wallet = wallet;
    this.trackProcess = trackProcess;
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
      const newPrice = await checkPrice(
        this.state.poolState.baseVault,
        this.state.poolState.quoteVault,
        this.connection,
        false
      );
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
      console.log(`buying`);
      this.status = 'pending';
      const buyResult = await this.executeBuy();
      if (buyResult.success) {
        console.log(`Buy success`);
        this.status = 'open';
        this.openPrice = buyResult.price!;
        this.ownedTokenAmount = buyResult.amount!;
        console.log(`open price: ${this.openPrice}`);
        console.log(`owned token amount: ${this.ownedTokenAmount}`);
        this.currentPrice = this.openPrice;
        this.calculateTargetAndStopLossPrices();
        this.startPriceUpdates();
        this.trackProcess.trades.push(this);
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

  private async executeBuy(): Promise<{ success: boolean; amount?: number; price?: number }> {
    let poolState = this.state.poolState;
    let key = this.state.poolState.baseMint;
    let tokenAccount = this.trackProcess.tokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = this.trackProcess.saveTokenAccount(key, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, this.wallet!.publicKey, true);
    const quoteAmount = new BN(this.quoteAmount * LAMPORTS_PER_SOL);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);

    const { innerTransaction } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: quotetokenAccount,
          tokenAccountOut: tokenAccount.address,
          owner: this.wallet.publicKey,
        },
        amountIn: quoteAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version
    );

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      createAssociatedTokenAccountIdempotentInstruction(
        this.wallet.publicKey,
        tokenAccount.address,
        this.wallet!.publicKey,
        key
      ),
      ...innerTransaction.instructions,
    ];

    const block = await this.connection.getLatestBlockhash('finalized');
    const tx = await createSignedTransaction(instructions, this.connection, this.wallet, block.blockhash);
    const result = await sendTransaction(tx, block, this.connection, this.isSimulated);
    if (result.success) {
      if (this.isSimulated) {
        const amount = 0;
        const token_price = await checkPrice(poolState.baseVault, poolState.quoteVault, this.connection, false);
        console.log(`execute token price: ${token_price}`);
        const price = token_price ? token_price : 0;
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
        console.log(`sell success`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sell failed:', error);
      return false;
    }
  }

  clearUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private async executeSell(): Promise<{ success: boolean }> {
    if (this.isSimulated) {
      return { success: true };
    }
    let poolState = this.state.poolState;
    let key = this.state.poolState.baseMint;
    let tokenAccount = this.trackProcess.tokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = this.trackProcess.saveTokenAccount(poolState.baseMint, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, this.wallet!.publicKey, true);
    const tokenAmount = new BN(this.ownedTokenAmount!);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);

    const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: tokenAccount.address,
          tokenAccountOut: quotetokenAccount,
          owner: this.wallet!.publicKey,
        },
        amountIn: tokenAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version
    );

    let lastbk = (await this.connection.getLatestBlockhash('finalized')).blockhash;

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
      createAssociatedTokenAccountIdempotentInstruction(
        this.wallet.publicKey,
        quotetokenAccount,
        this.wallet.publicKey,
        quoteToken
      ),
      ...innerTransaction.instructions,
    ];

    const sell_tx = await createSignedTransaction(instructions, this.connection, this.wallet, lastbk);

    const result = await sendTransaction(sell_tx, lastbk, this.connection, this.isSimulated);
    //TODO
    return { success: result.success };
  }

  getPerformance() {
    let msg = `Percentage gain: ${(((this.currentPrice! - this.openPrice!) / this.openPrice!) * 100).toFixed(2)}%`;
    console.log(msg);
  }
}
