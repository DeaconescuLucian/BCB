import { Connection, Context, KeyedAccountInfo, Keypair, Logs, PublicKey } from '@solana/web3.js';
import TrackProcess, { TrackedToken } from './trackProcess';
import { checkIfTransactionIsLPBurn, getMinimalMarketV3, MinimalTokenAccountData } from './helpers';
import Trade from './trade';
import { FilterKey, FilterList, FilterValue, TokenState } from './filters';
import * as raydium from '@raydium-io/raydium-sdk';
import * as bs58 from 'bs58';
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  MarketStateV3,
  LiquidityStateV4,
} from '@raydium-io/raydium-sdk';

export class NPTTrackProcess extends TrackProcess {
  raydiumSubscriptionId: number | null = null;
  openBookSubscriptionId: number | null = null;
  onLogSubscriptions: Set<number> = new Set();

  async subscribeToLpBurn(state: TokenState) {
    const key = state.poolState.lpMint;
    await state.initP;
    const lpSupply = state.lpSupply!;
    const processedSignatures = new Set<string>();

    const sub = this.connection.onLogs(
      key,
      async (logs: Logs, ctx: Context) => {
        let retries = 5;
        let delay = 200;
        if (!logs.err) {
          const signature = logs.signature;
          if (processedSignatures.has(signature)) {
            return;
          }
          processedSignatures.add(signature);
          for (let i = 0; i <= retries; i++) {
            try {
              console.log(logs.signature);
              let resp = await this.connection.getTransaction(logs.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 2,
              });
              if (!resp) throw new Error();
              let meta = resp.meta;
              if (await checkIfTransactionIsLPBurn(meta, lpSupply)) {
                console.log(`Detected LP Burn for token ${key.toString()}`);
                await this.unsubscribefromToken(sub);
                return;
              }
            } catch (e) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
          }
        }
      },
      'processed'
    );
    this.onLogSubscriptions.add(sub);

    console.log(`Subscribed to token ${key.toString()} for ${this.settings?.trackduration} seconds`);

    setTimeout(async () => {
      await this.unsubscribefromToken(sub);
    }, (this.settings?.trackduration || 500) * 1000);
  }

  async unsubscribefromToken(sub: number) {
    try {
      this.onLogSubscriptions.delete(sub);
      this.connection.removeOnLogsListener(sub);
    } catch (e) {
      //
    }
  }

  async addToken(state: TokenState): Promise<void> {
    this.tokens.push({ mint: state.poolState.baseMint, state: state });
    this.subscribeToLpBurn(state);
  }

  async processOpenBookMarket(updatedAccountInfo: KeyedAccountInfo): Promise<void> {
    let accountData: MarketStateV3 | undefined;
    try {
      accountData = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);

      if (this.tokenAccounts.has(accountData.baseMint.toString())) {
        return;
      }

      this.saveTokenAccount(accountData.baseMint, accountData);
    } catch (e) {
      console.log({ ...accountData, error: e }, `Failed to process market`);
    }
  }

  async processRaydiumPool(id: PublicKey, poolState: LiquidityStateV4, filters: FilterList): Promise<void> {
    try {
      let state = new TokenState(poolState, filters, this.connection);
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

      if (resultsArray.includes(false)) {
        this.pools.delete(id.toString());
        console.log(`Skipping pool due to filters`);
        return;
      } else {
        console.log(`Adding token to tracker`);
        this.addToken(state);
      }

      await state.initP;
      console.log(`wait 10s`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      let trade = new Trade(this, state, 0.001, 100, 50, this.wallet, 100, true);
      trade.buy();
    } catch (e) {
      console.log({ error: e }, `Failed to process pool`);
    }
  }

  startProcess(): void {
    if (this.initialized) {
      console.log('Tracker process already started');
      return;
    }
    console.log('Starting tracker process');
    this.initialized = true;

    const filters: FilterList = new Map<FilterKey, FilterValue>([
      ['NOT_MINTABLE', 1],
      ['NOT_FREEZABLE', 1],
      // ['MINIMUM_SOLANA_POOL', 1],
      // ['MAXIMUM_SOLANA_POOL', 1000],
      // ['MINIMUM_POOL_PERCENTAGE', 95],
    ]);

    const runTimestamp = Math.floor(new Date().getTime() / 1000);

    this.raydiumSubscriptionId = this.connection.onProgramAccountChange(
      this.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
      async (updatedAccountInfo: KeyedAccountInfo) => {
        const key = updatedAccountInfo.accountId.toString();
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
        const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
        const existing = this.pools.has(key);
        const newrunTimestamp = Math.floor(new Date().getTime() / 1000);

        const poolOpenTimeReadable = new Date(poolOpenTime * 1000).toLocaleString();
        const newrunTimestampReadable = new Date(newrunTimestamp * 1000).toLocaleString();

        if (poolOpenTime > runTimestamp && !existing) {
          this.pools.add(key);
          console.log(key)

          console.log(`Pool Detected Time: ${newrunTimestampReadable}`);
          console.log(`Pool Open Time: ${poolOpenTimeReadable}`);
          console.log(`New pool: ${key}`);
          this.processRaydiumPool(updatedAccountInfo.accountId, poolState, filters);
        }
      },
      {
        commitment: 'processed',
        encoding: 'base64',
        filters: [
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
              bytes: this.OPENBOOK_PROGRAM_ID.toBase58(),
            },
          },
          {
            memcmp: {
              offset: raydium.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
              bytes: bs58.encode([6, 0, 0, 0, 0, 0, 0, 0]),
            },
          },
        ],
      }
    );
    console.log("subscription created");

    this.openBookSubscriptionId = this.connection.onProgramAccountChange(
      this.OPENBOOK_PROGRAM_ID,
      async (updatedAccountInfo) => {
        const key = updatedAccountInfo.accountId.toString();
        const existing = this.markets.has(key);
        if (!existing) {
          this.markets.add(key);
          const _ = this.processOpenBookMarket(updatedAccountInfo);
        }
      },
      {
        commitment: 'processed',
        encoding: 'base64',
        filters: [
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
  }

  async stopProcess(): Promise<void> {
    if (this.raydiumSubscriptionId !== null)
      await this.connection.removeProgramAccountChangeListener(this.raydiumSubscriptionId);
    if (this.openBookSubscriptionId !== null)
      await this.connection.removeProgramAccountChangeListener(this.openBookSubscriptionId);
    this.onLogSubscriptions.forEach(log => {
      this.connection.removeOnLogsListener(log);
    })
    this.onLogSubscriptions.clear();
    this.trades.forEach(trade => {
      trade.clearUpdateInterval();
    });
  }

  initialize(params: { pools: any[]; poolFilters: any[]; settings: any[]; positions: any[] }): void {
    const { pools, poolFilters, settings, positions } = params;
    try {
      pools.forEach(async (p) => {
        this.pools.add(p.poolId);
        this.markets.add(p.marketId);

        //create Token state
        const poolAccountInfo = await this.connection.getAccountInfo(p.poolId);
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(poolAccountInfo!.data);
        let state = new TokenState(poolState, ([] as unknown) as FilterList, this.connection);
        state.poolId = p.poolId;
        const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
        this.saveTokenAccount(poolState.baseMint, market);
        //let trade = new Trade(this, state, 0.001, 100, 50, this.wallet, 100, true);
      });
    } catch (error) {
      console.log(error)
    }
  }
}
