import { BrowserWindow } from 'electron'
import handleWallet from './WalletHandler'
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';

export function setupHandlers(mainWindow: BrowserWindow | null, db: sqlite3.Database, solanaConnection: Connection): void
{
    handleWallet(db, solanaConnection);
}