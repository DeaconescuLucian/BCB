import { Context, KeyedAccountInfo, Logs, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import TrackProcess from './trackProcess';
import { checkIfTransactionIsLPBurn, getMinimalMarketV3, MinimalTokenAccountData } from '../helpers';
import Trade from './trade';
import { closeEmptyTokenAccounts } from '../transactions';
import { FilterList, TokenState } from '../filters';
import * as raydium from '@raydium-io/raydium-sdk';
import * as bs58 from 'bs58';
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  MarketStateV3,
  LiquidityStateV4,
} from '@raydium-io/raydium-sdk';
import { getSolanaBalance, getWSOLBalance } from '../utils';
import TrackProcessManager from './trackProcessManager';

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
                console.log(`Opening position`);

                this.createTrade(state, state.tokenMint.toString(), false);

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
    this.tokens.push({ mint: state.tokenMint, state: state });
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

  async processRaydiumPool(id: PublicKey, state:TokenState, filters: FilterList, pump:boolean): Promise<void> {
    try {
      const poolState = state.poolState;
      let results: Promise<boolean>[] = [];

      //Insta-buy if pump.fun migration? True sim flag
      // if(pump){
      //   this.createTrade(state, state.tokenMint.toString(), true);
      //   return;
      // }

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
        console.log(`Skipping pool due to filters`);
        return;
      } else {
        console.log(`Adding token to tracker`);
        this.addToken(state);
        await state.initP;
        await this.savePool(id.toString(), poolState);
        for (const pool of this.pools.values()) {
          if (pool.poolId === id.toString()) {
            pool.tracked = true;
          }
        }
      }
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

    const sub = this.connection.onLogs(this.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
      async (logs: Logs, ctx: Context) => {
        if (!logs.err){
          for (let log of logs.logs){
            if (log.includes('initialize2: InitializeInstruction2')) {
              console.log(logs.signature);
              
              let pars;
              for (let i = 0; i < 20; i++) {
                  pars = await this.connection.getParsedTransaction(logs.signature, {commitment: 'confirmed', maxSupportedTransactionVersion: 2});
                  if (!pars) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    continue;
                  }
                  else break;
              }
              let pool;
              let market;
              let arr = pars?.transaction.message.instructions!
              let pump = false;

              arr.forEach((ix) => {
                if ('accounts' in ix && (ix as PartiallyDecodedInstruction).accounts.length !== 0) {
                  //console.log(ix.accounts);
                  pool = (ix as PartiallyDecodedInstruction).accounts[4];
                  market = (ix as PartiallyDecodedInstruction).accounts[17];
                  pump = (ix as PartiallyDecodedInstruction).accounts.some(
                    (account) => account.toString() === '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg'
                  );
                }
              });

              const m = getMinimalMarketV3(this.connection, market!, 'processed')

              let accinfo;
              if (pool){
                for (let i = 0; i < 20; i++) {
                  accinfo = await this.connection.getAccountInfo(pool, 'processed');
                  if (!accinfo) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    continue;
                  }
                  else break;
                }
              }
              
              const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accinfo!.data);
              const i = (poolState.baseMint.toString() === raydium.WSOL.mint) ? poolState.quoteMint : poolState.baseMint;
              this.saveTokenAccount(i, await m);

              this.pools.set(pool!, {
                poolId: pool!.toString(),
                baseMint: poolState.baseMint.toString(),
                quoteMint: poolState.quoteMint.toString(),
                tracked: false,
              });

              let state = new TokenState(poolState, this.settings.poolFilters, this.connection);
              state.poolId = pool!;
              state.init(pars?.meta!);
              
              this.processRaydiumPool(pool!, state, this.settings.poolFilters, pump);
              break;
          }
          }
        }
      }
      ,'processed');

    this.onLogSubscriptions.add(sub);
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
    this.trades.forEach((trade) => {
      trade.clearUpdateInterval();
    });
  }

  initialize(params: { pools: any[]; poolFilters: any[]; settings: any[]; positions: any[] }): void {
    const { pools, poolFilters, settings, positions } = params;
    try {
      this.mapSettings(settings);
      this.mapPoolFilters(poolFilters);
      positions.forEach(async (pos) => {
        const p = pools.find((p) => p.poolId === pos.poolId);
        if (p) {
          this.pools.set(p.poolId, {
            poolId: p.poolId,
            baseMint: p.baseMint,
            quoteMint: p.quoteMint,
            tracked: p.tracked,
          });
          this.markets.add(p.marketId);
          const poolAccountInfo = await this.connection.getAccountInfo(new PublicKey(p.poolId));
          const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(poolAccountInfo!.data);
          let state = new TokenState(poolState, ([] as unknown) as FilterList, this.connection);
          state.poolId = new PublicKey(p.poolId);
          const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
          this.saveTokenAccount(state.tokenMint, market);
          const trade = new Trade(
            this,
            state,
            state.tokenMint.toString(), 
            this.settings.buyAmountValue,
            this.settings.targetPercentage,
            this.settings.stopLossPercentage,
            this.wallet,
            100,
            false
          );
          trade.reopen(pos.amount, pos.startingPrice, pos.currentPrice, pos.openTime, pos.id);
          this.trades.push(trade);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async createTrade(state: TokenState, mint: string, simulate: boolean): Promise<void> {
    let trade;
    trade = new Trade(
      this,
      state,
      mint,
      this.settings.buyAmountValue,
      this.settings.targetPercentage,
      this.settings.stopLossPercentage,
      this.wallet,
      100,
      simulate
    );
    this.trades.push(trade);
    const newrunTimestamp = Math.floor(new Date().getTime() / 1000);
    const newrunTimestampReadable = new Date(newrunTimestamp * 1000).toLocaleString();
    console.log(`Trade Buy Initiated Time: ${newrunTimestampReadable}`);
    trade.buy();
    // const balance = await getWSOLBalance(this.connection, this.wallet.publicKey);
    // const solBalance = await getSolanaBalance(this.connection, this.wallet.publicKey);

    // if (solBalance > 0.0002) {
    //   if (this.settings.buyAmountType === 'Fixed') {
    //     if (balance >= this.settings.buyAmountValue) {
    //       trade = new Trade(
    //         this,
    //         state,
    //         mint,
    //         this.settings.buyAmountValue,
    //         this.settings.targetPercentage,
    //         this.settings.stopLossPercentage,
    //         this.wallet,
    //         100,
    //         simulate
    //       );
    //     } else {
    //       console.log('Insufficient  WSOL balance');
    //     }
    //   }
    //   if (this.settings.buyAmountType === 'Dynamic') {
    //     const amount = (this.settings.buyAmountValue / 100) * balance;
    //     if (amount >= this.settings.buyAmountMinValue) {
    //       if (balance >= amount)
    //         trade = new Trade(
    //           this,
    //           state,
    //           mint,
    //           amount,
    //           this.settings.targetPercentage,
    //           this.settings.stopLossPercentage,
    //           this.wallet,
    //           100,
    //           simulate
    //         );
    //       else console.log('Insufficient  WSOL balance');
    //     } else {
    //       if (balance >= this.settings.buyAmountMinValue)
    //         trade = new Trade(
    //           this,
    //           state,
    //           mint,
    //           this.settings.buyAmountMinValue,
    //           this.settings.targetPercentage,
    //           this.settings.stopLossPercentage,
    //           this.wallet,
    //           100,
    //           simulate
    //         );
    //       else console.log('Insufficient WSOL balance');
    //     }
    //   }
    //   if (trade) {
    //     this.trades.push(trade);
    //     trade.buy();
    //   }
    // } else {
    //   console.log('Insufficient SOL balance');
    // }
  }

  gatherTradesUpdates() {
    return this.trades.map((trade) => {
      return {
        mint: trade.mint,
        status: trade.status,
        startingPrice: trade.openPrice,
        openTime: trade.openTime,
        currentPrice: trade.currentPrice,
        exitPrice: trade.exitPrice,
        amount: trade.ownedTokenAmount,
        id: trade.positionId,
      };
    });
  }

  gatherPoolsUpdates() {
    let pools = [];
    for (const pool of this.pools.values()) {
      if (pool.tracked) pools.push(pool);
    }
    return pools;
  }

  async savePool(poolId: string, poolState: LiquidityStateV4) {
    const trackedPool = {
      trackProcessId: this.id,
      poolId: poolId,
      trackedOn: new Date().toISOString(),
      baseMint: poolState.baseMint.toString(),
      quoteMint: poolState.quoteMint.toString(),
      marketId: poolState.marketId.toString(),
    };
    return await TrackProcessManager.getInstance().saveTrackedPool(trackedPool);
  }

  async savePosition(poolId: string, positionId: string, mint: string, amount: number, signature: string) {
    const position = {
      trackProcessId: this.id,
      positionId,
      poolId,
      mint,
      status: 'open pending',
      amount,
      signature,
      type: 'NPT open',
      wallet: this.wallet,
    };
    return await TrackProcessManager.getInstance().savePosition(position, this.id);
  }

  async openPosition(positionId: string, amount: number, startingPrice: number, openTime: string, signature: string) {
    return await TrackProcessManager.getInstance().openPosition(
      positionId,
      amount,
      startingPrice,
      openTime,
      signature,
      this.id
    );
  }

  async updatePositionStatus(positionId: string, status: string, signature: string, amount?: number): Promise<void> {
    if (status === 'open fail' || status === 'close fail') {
      const positionToRemove = this.trades.find((t) => t.positionId === positionId);
      if (positionToRemove)
        TrackProcessManager.getInstance().updateTpNoTrackPositions(this.id, {
          id: positionToRemove.positionId,
          mint: positionToRemove.mint,
          amount: positionToRemove.ownedTokenAmount,
          startingPrice: positionToRemove.openPrice,
          currentPrice: positionToRemove.currentPrice,
          exitPrice: positionToRemove.exitPrice,
          status: positionToRemove.status,
          openTime: positionToRemove.openTime,
          poolId: positionToRemove.state.poolId,
        });
      this.trades = this.trades.filter((t) => t.positionId !== positionId);
    }
    return await TrackProcessManager.getInstance().updatePositionStatus(positionId, status, signature!, this.id, {
      signature,
      amount: amount,
      wallet: this.wallet,
      type: 'NPT close',
    });
  }

  async closePosition(positionId: string, exitPrice: number, closeTime: string, signature: string) {
    const positionToRemove = this.trades.find((t) => t.positionId === positionId);
    if (positionToRemove)
      TrackProcessManager.getInstance().updateTpNoTrackPositions(this.id, {
        id: positionToRemove.positionId,
        mint: positionToRemove.mint,
        amount: positionToRemove.ownedTokenAmount,
        startingPrice: positionToRemove.openPrice,
        currentPrice: positionToRemove.currentPrice,
        exitPrice: positionToRemove.exitPrice,
        status: positionToRemove.status,
        openTime: positionToRemove.openTime,
        poolId: positionToRemove.state.poolId,
      });
    this.trades = this.trades.filter((t) => t.positionId !== positionId);
    return await TrackProcessManager.getInstance().closePosition(positionId, exitPrice, closeTime, signature, this.id);
  }
}
