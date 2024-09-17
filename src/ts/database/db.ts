import sqlite3 from 'sqlite3';
import { createTableTransactions } from './transactions';
import { createTableWallets } from './wallets';
import { createTableWalletTokenAccounts } from './walletTokenAccounts';
import { createTableTokens, insertWSOL } from './tokens';
import { createTableConnections, insertDefaultConnection } from './connections';

export function runQuery(db: sqlite3.Database, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, (err: Error | null) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function openConnection(): sqlite3.Database {
    const db = new sqlite3.Database('blockchain-busters.db', (err: Error | null) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });
    db.run('PRAGMA foreign_keys = ON');
    return db;
}

export async function initDatabase(db: sqlite3.Database): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                await createTableTransactions(db);
                await createTableWallets(db);
                await createTableTokens(db);
                await createTableWalletTokenAccounts(db);
                await createTableConnections(db);
                await insertDefaultConnection(db, 'mainnet-beta');
                await insertWSOL(db);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}

export function closeConnection(db: sqlite3.Database): void {
    db.close((err: Error | null) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}
