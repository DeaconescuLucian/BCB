import { BrowserWindow } from 'electron'
import handleWallet from './WalletHandler'
import handleConnection from './ConnectionHandler';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';

export function setupHandlers(db: sqlite3.Database, solanaConnection: Connection): void
{
    handleWallet(db, solanaConnection);
    handleConnection(db, solanaConnection);
}