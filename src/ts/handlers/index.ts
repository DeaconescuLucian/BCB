import handleWallet from './WalletHandler'
import handleConnection from './ConnectionHandler';
import handleToken from './TokenHandler';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';
import handleTransaction from './TransactionHandler';
import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

export function setupHandlers(db: sqlite3.Database, solanaConnection: Connection, mainProcess: ChildProcess | null, mainWindow: BrowserWindow | null): void
{
    handleWallet(db, solanaConnection);
    handleConnection(db, solanaConnection, mainProcess, mainWindow);
    handleToken(db, solanaConnection);
    handleTransaction(db, solanaConnection, mainProcess, mainWindow);
}