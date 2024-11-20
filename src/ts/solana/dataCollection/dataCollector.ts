import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { MinimalMarketLayoutV3, MinimalTokenAccountData } from '../helpers';
import { FilterKey, FilterList, FilterValue, TokenState } from '../filters';
import * as raydium from '@raydium-io/raydium-sdk';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { LiquidityStateV4 } from '@raydium-io/raydium-sdk';

export type TrackedToken = {
  mint: PublicKey;
  state: TokenState;
};

export interface IDataCollectorInterface {
  id: string;
  initialized: boolean;
  connection: Connection;
  RAYDIUM_LIQUIDITY_PROGRAM_ID_V4: PublicKey;
  OPENBOOK_PROGRAM_ID: PublicKey;
  markets: Set<string>;
  pools: Map<string, {poolId: string, baseMint: string, quoteMint: string, marketId: string, trackedOn: Date, priceUpdateCounter: number, currentPrice: number | null}>;
  tokenAccounts: Map<string, MinimalTokenAccountData>;
  tokens: TrackedToken[];
  settings: any;
  priceUpdatesIntervals: Map<string, NodeJS.Timeout>;
  addToken(state: TokenState): void;
  startProcess(): void;
  stopProcess(): void;
  initialize(pools: any[]): void;
  savePool(poolId: string, poolState: LiquidityStateV4, filters: any[]): Promise<void>;
  gatherPoolsUpdates(): any[];
}

export default class DataCollector implements IDataCollectorInterface {
  constructor(id: string, connection: Connection) {
    this.id = id;
    this.initialized = false;
    this.connection = connection;
    this.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium.MAINNET_PROGRAM_ID.AmmV4;
    this.OPENBOOK_PROGRAM_ID = raydium.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
    this.pools = new Map<string, {poolId: string, baseMint: string, quoteMint: string, marketId: string,  trackedOn: Date, priceUpdateCounter: number, currentPrice: number | null}>();
    this.markets = new Set<string>();
    this.tokenAccounts = new Map<string, MinimalTokenAccountData>();
    this.tokens = [];
    this.priceUpdatesIntervals = new Map<string, NodeJS.Timeout>();
  }
  id: string;
  initialized: boolean;
  connection: Connection;
  RAYDIUM_LIQUIDITY_PROGRAM_ID_V4: PublicKey;
  OPENBOOK_PROGRAM_ID: PublicKey;
  markets: Set<string>;
  pools: Map<string, {poolId: string, baseMint: string, quoteMint: string, marketId: string, trackedOn: Date, priceUpdateCounter: number, currentPrice: number | null}>;
  tokenAccounts: Map<string, MinimalTokenAccountData>;
  tokens: TrackedToken[];
  settings: any;
  priceUpdatesIntervals: Map<string, NodeJS.Timeout>;

  addToken(state: TokenState): void {
    throw new Error('Method not implemented.');
  }
  startProcess(): void {
    throw new Error('Method not implemented.');
  }
  async stopProcess(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  initialize(pools: any[]): void {
    throw new Error('Method not implemented.');
  }
  async savePool(poolId: string, poolState: LiquidityStateV4, filters: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  gatherPoolsUpdates(): any[] {
    throw new Error('Method not implemented.');
  }

}
