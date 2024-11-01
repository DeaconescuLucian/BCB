import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import Trade from './trade';
import { MinimalMarketLayoutV3, MinimalTokenAccountData } from './helpers';
import { TokenState } from './filters';
import * as raydium from '@raydium-io/raydium-sdk';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

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
  pools: Set<string>;
  tokenAccounts: Map<string, MinimalTokenAccountData>;
  trades: Trade[];
  tokens: TrackedToken[];
  settings: any;
  addToken(state: TokenState): void;
  startProcess(): void;
  stopProcess(): void;
  initialize(params: any): void;
  saveTokenAccount(mint: PublicKey, accountData: MinimalMarketLayoutV3): MinimalTokenAccountData;
}

export default class TrackProcess implements ITrackProcessInterface {
  constructor(id: string, wallet: Keypair, connection: Connection) {
    this.id = id;
    this.initialized = false;
    this.wallet = wallet;
    this.connection = connection;
    this.RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium.MAINNET_PROGRAM_ID.AmmV4;
    this.OPENBOOK_PROGRAM_ID = raydium.MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
    this.pools = new Set<string>();
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
  pools: Set<string>;
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
}
