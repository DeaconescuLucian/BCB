import { Context, KeyedAccountInfo, Logs, PublicKey } from '@solana/web3.js';
import DataCollector from './dataCollector';
import { checkIfTransactionIsLPBurn, checkPrice, getMinimalMarketV3, MinimalTokenAccountData } from '../helpers';
import { FilterList, TokenState } from '../filters';
import * as raydium from '@raydium-io/raydium-sdk';
import * as bs58 from 'bs58';
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  MarketStateV3,
  LiquidityStateV4,
} from '@raydium-io/raydium-sdk';
import DataCollectorManager from './dataCollectorManager';

export class NPTDataCollector extends DataCollector {
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
                //save lpBurn time
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

    console.log(`Subscribed to token ${key.toString()} for ${this.settings.trackDuration} seconds`);

    setTimeout(async () => {
      console.log(`Unsubscribing from token ${key.toString()}`);
      await this.unsubscribefromToken(sub);
    }, (this.settings.trackDuration || 500) * 1000);
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
    } catch (e) {
      console.log({ ...accountData, error: e }, `Failed to process market`);
    }
  }

  private startPriceUpdates(state: TokenState, poolId: string) {
    const updateInterval = setInterval(async () => {
      await this.updatePrice(state, poolId);
    }, 5000);
    this.priceUpdatesIntervals.set(poolId, updateInterval);
  }

  private async updatePrice(state: TokenState, poolId: string) {
    try {
      const currentPool = this.pools.get(poolId);
      const currentPriceUpdateCounter = currentPool?.priceUpdateCounter!;
      if (currentPriceUpdateCounter < 2160) {
        // 2160 = 3 ore(10800 secunde) / 5 secunde
        const newPrice = await checkPrice(
          state.poolState.baseVault,
          state.poolState.quoteVault,
          this.connection,
          false
        );
        this.pools.set(poolId, {
          ...currentPool!,
          priceUpdateCounter: currentPriceUpdateCounter + 1,
          currentPrice: newPrice,
        });
        let priceDate = currentPool?.trackedOn;
        priceDate!.setSeconds(priceDate!.getSeconds() + 5 * currentPriceUpdateCounter);
        DataCollectorManager.getInstance().persistPoolCurrentPrice(this.id, poolId, newPrice!, priceDate!);
      } else {
        clearInterval(this.priceUpdatesIntervals.get(poolId)!);
        this.priceUpdatesIntervals.delete(poolId);
        this.pools.delete(poolId);
        DataCollectorManager.getInstance().updateDcNoTrackPools(this.id, currentPool);
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  }

  async processRaydiumPool(id: PublicKey, poolState: LiquidityStateV4): Promise<void> {
    try {
      let state = new TokenState(poolState, (null as unknown) as FilterList, this.connection);
      state.poolId = id;
      state.init();
      let results: {
        poolFilterId: number;
        filterValue: any;
      }[] = [];

      console.log(`Checking filters for token`);
      results.push({
        poolFilterId: 3,
        filterValue: await state.checkMintable(),
      });
      results.push({
        poolFilterId: 4,
        filterValue: await state.checkFreezable(),
      });
      results.push({
        poolFilterId: 0,
        filterValue: await state.getSolanaPool(),
      });
      results.push({
        poolFilterId: 1,
        filterValue: await state.getPoolPercentage(),
      });

      await this.savePool(id.toString(), poolState, results);

      this.addToken(state);
      await state.initP;
      this.startPriceUpdates(state, id.toString());
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
          console.log(`Pool Detected Time: ${newrunTimestampReadable}`);
          console.log(`Pool Open Time: ${poolOpenTimeReadable}`);
          console.log(`New pool: ${key}`);
          this.processRaydiumPool(updatedAccountInfo.accountId, poolState);
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
    console.log('subscription created');

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
    this.onLogSubscriptions.forEach((log) => {
      this.connection.removeOnLogsListener(log);
    });
    this.onLogSubscriptions.clear();
    this.priceUpdatesIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.priceUpdatesIntervals.clear();
  }

  initialize(pools: any[]): void {
    try {
    } catch (error) {
      console.log(error);
    }
  }

  gatherPoolsUpdates() {
    let pools = [];
    for (const pool of this.pools.values()) {
      pools.push(pool);
    }
    return pools;
  }

  async savePool(poolId: string, poolState: LiquidityStateV4, filters: any[]) {
    const pool = {
      poolId: poolId,
      baseMint: poolState.baseMint.toString(),
      quoteMint: poolState.quoteMint.toString(),
      marketId: poolState.marketId.toString(),
      trackedOn: new Date(),
      priceUpdateCounter: 0,
      currentPrice: null,
    };

    this.pools.set(poolId, pool);
    return await DataCollectorManager.getInstance().saveTrackedPool(pool, this.id, filters);
  }
}
