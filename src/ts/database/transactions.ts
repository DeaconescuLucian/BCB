import sqlite3 from 'sqlite3';
import { runQuery } from './db';


export async function createTableTransactions(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS transactions (
        signature TEXT PRIMARY KEY,
        wallet TEXT NOT NULL,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('success', 'fail', 'pending')),
        type TEXT )`;
    await runQuery(db, sql);    
}

export function insertTransaction(db: sqlite3.Database, t: any): void {
    db.serialize(() => {
        db.run(`INSERT INTO transactions (signature, wallet, value, "date", status, type) VALUES (?, ?, ?, ?, ?, ?)`,
            [t.signature, t.wallet, t.value, t.date.toISOString(), t.status, t.type], (err: Error | null) => {
                if (err) {
                    console.error('Error inserting transaction:', err.message);
                } else {
                    console.log('Transaction inserted successfully.');
                }
            });
    });
}

export function getLatestTransactions(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
    db.serialize(() => {
        db.all(
            `SELECT * FROM transactions ORDER BY date DESC LIMIT 100`,
            (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error('Error retrieving transactions:', err.message);
                    callback(err);
                } else {
                    console.log('Retrieved latest 100 transactions.');
                    callback(null, rows);
                }
            }
        );
    });
}

export function updateTransaction(db: sqlite3.Database, t: any): void {
    db.serialize(() => {
        db.run(`UPDATE transactions SET "date" = ? , status = ? WHERE signature = ?`,
            [t.date.toISOString(), t.status, t.signature], (err: Error | null) => {
                if (err) {
                    console.error('Error updating transaction:', err.message);
                } else {
                    console.log('Transaction updated successfully.');
                }
            });
    });
}