import handleWallet from './WalletHandler'
import handleConnection from './ConnectionHandler';
import handleToken from './TokenHandler';
import handlePoolFilter from './PoolFilterHandler';
import handleTrackProcess from './TrackProcessHandler';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';
import handleTransaction from './TransactionHandler';
import { BrowserWindow } from 'electron';
import TrackProcessManager from '../solana/bot/trackProcessManager';

export function setupHandlers(db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null, tpm: TrackProcessManager): void
{
    handleWallet(db, solanaConnection);
    handleConnection(db, solanaConnection, mainWindow, tpm);
    handleToken(db, solanaConnection);
    handleTransaction(db, solanaConnection, mainWindow);
    handlePoolFilter(db);
    handleTrackProcess(db, mainWindow, solanaConnection, tpm);
}