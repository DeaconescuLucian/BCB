import { BrowserWindow } from 'electron'
import handleWallet from './WalletHandler'
import sqlite3 from 'sqlite3';

export function setupHandlers(mainWindow: BrowserWindow | null, db: sqlite3.Database): void
{
    handleWallet(db);
}