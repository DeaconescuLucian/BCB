import sqlite3 from 'sqlite3';
import { createTableTransactions } from './transactions';

export function openConnection(): sqlite3.Database {
    const db = new sqlite3.Database('blockchain-busters.db', (err: Error | null) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });
    return db;
}

export function initDatabase(db: sqlite3.Database): void {
    db.serialize(() => {
        createTableTransactions(db);
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
