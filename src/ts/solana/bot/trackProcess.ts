import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import Trade from './trade';
import { MinimalMarketLayoutV3, MinimalTokenAccountData } from './helpers';
import { FilterKey, FilterList, FilterValue, TokenState } from './filters';
import * as raydium from '@raydium-io/raydium-sdk';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { LiquidityStateV4 } from '@raydium-io/raydium-sdk';

export type TrackedToken = {
  mint: PublicKey;
  state: TokenState;
};

export interface ITrackProcessInterface {
  id: string;
  initialized: boolean;
  wallet: Keypair;
  connection: Connection;
  RAYDIUM_LIQUIDITY_PROGRAM_ID_V4: PublicKey;
  OPENBOOK_PROGRAM_ID: PublicKey;
  markets: Set<string>;
  pools: Map<string, {poolId: string, baseMint: string, quoteMint: string}>;
  tokenAccounts: Map<string, MinimalTokenAccountData>;
  trades: Trade[];
  tokens: TrackedToken[];
  settings: any;
  addToken(state: TokenState): void;
  startProcess(): void;
  stopProcess(): void;
  initialize(params: any): void;
  saveTokenAccount(mint: PublicKey, accountData: MinimalMarketLayoutV3): MinimalTokenAccountData;
  mapSettings(settings: any[]): void;
  mapPoolFilters(poolFilters: any[]): void;
  createTrade(state: TokenState, mint: string, simulate: boolean): Promise<void>;
  savePool(poolId: string, poolState: LiquidityStateV4): Promise<void>;
  savePosition(poolId: string, positionId: string, mint: string, amount: number, signature: string): Promise<void>;
  openPosition(positionId: string, amount: number, startingPrice: number,  openTime: string, signature: string): Promise<void>;
  updatePositionStatus(positionId: string, status: string, signature?: string, amount?: number): Promise<void>;
  closePosition(positionId: string, exitPrice: number, closeTime: string, signature: string): Promise<void>;
  gatherTradesUpdates(): any[];
  gatherPoolsUpdates(): any[];
}

export default class TrackProcess implements ITrackProcessInterface {
  constructor(id: string, wallet: Keypair, connection: Connection) {
    this.id = id;
    this.initialized = false;
    this.wallet = wallet;
    this.connection = connection;
    this.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium.MAINNET_PROGRAM_ID.AmmV4;
    this.OPENBOOK_PROGRAM_ID = raydium.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
    this.pools = new Map<string, {poolId: string, baseMint: string, quoteMint: string}>();
    this.markets = new Set<string>();
    this.tokenAccounts = new Map<string, MinimalTokenAccountData>();
    this.trades = [];
    this.tokens = [];
  }
  id: string;
  initialized: boolean;
  wallet: Keypair;
  connection: Connection;
  RAYDIUM_LIQUIDITY_PROGRAM_ID_V4: PublicKey;
  OPENBOOK_PROGRAM_ID: PublicKey;
  markets: Set<string>;
  pools: Map<string, {poolId: string, baseMint: string, quoteMint: string}>;
  tokenAccounts: Map<string, MinimalTokenAccountData>;
  trades: Trade[];
  tokens: TrackedToken[];
  settings: any;

  addToken(state: TokenState): void {
    throw new Error('Method not implemented.');
  }
  startProcess(): void {
    throw new Error('Method not implemented.');
  }
  async stopProcess(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  initialize(params: any): void {
    throw new Error('Method not implemented.');
  }
  async createTrade(state: TokenState, mint: string, simulate: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async savePool(poolId: string, poolState: LiquidityStateV4): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async savePosition(poolId: string, positionId: string, mint: string, amount: number, signature: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async openPosition(positionId: string, amount: number, startingPrice: number,  openTime: string, signature: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updatePositionStatus(positionId: string, status: string, signature?: string, amount?: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async closePosition(positionId: string, exitPrice: number, closeTime: string, signature: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  saveTokenAccount(mint: PublicKey, accountData: MinimalMarketLayoutV3) {
    const ata = getAssociatedTokenAddressSync(mint, this.wallet.publicKey);
    const tokenAccount = <MinimalTokenAccountData>{
      address: ata,
      mint: mint,
      market: <MinimalMarketLayoutV3>{
        bids: accountData.bids,
        asks: accountData.asks,
        eventQueue: accountData.eventQueue,
      },
    };
    this.tokenAccounts.set(mint.toString(), tokenAccount);
    return tokenAccount;
  }

  mapSettings(settings: any[]) {
    this.settings = {};
    settings.forEach((s) => {
      switch (s.name) {
        case 'Budget':
          this.settings.budget = s.value;
          break;
        case 'Buy Amount Type':
          this.settings.buyAmountType = s.value;
          break;
        case 'Buy Amount Value':
          this.settings.buyAmountValue = Number(s.value);
          break;
        case 'Buy Amount Min Value':
          this.settings.buyAmountMinValue = s.value !== null ? Number(s.value) : null;
          break;
        case 'Track Duration':
          this.settings.trackDuration = Number(s.value);
          break;
        case 'Target Percentage':
          this.settings.targetPercentage = Number(s.value);
          break;
        case 'Stop Loss Percentage':
          this.settings.stopLossPercentage = Number(s.value);
          break;
      }
    });
  }

  mapPoolFilters(poolFilters: any[]) {
    this.settings.poolFilters = new Map<FilterKey, FilterValue>(
      poolFilters.filter((f: any) => f.value !== null).map((f:any) => {
        if(f.type === 'number')
        {
          return [f.name, Number(f.value)]
        }
        else {
          return [f.name, f.value === 'true' ? 1 : 0]
        }
      })
    );
  }

  gatherTradesUpdates(): any[] {
    throw new Error('Method not implemented.');
  }
  gatherPoolsUpdates(): any[] {
    throw new Error('Method not implemented.');
  }

}
