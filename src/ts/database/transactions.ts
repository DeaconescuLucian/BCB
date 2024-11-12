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

export async function insertTransaction(db: sqlite3.Database, t: any): Promise<void> {
    const sql = `INSERT INTO transactions (signature, wallet, value, "date", status, type) 
                 VALUES ('${t.signature}', '${t.wallet}', ${t.value}, '${t.date.toISOString()}', '${t.status}', '${t.type}')`;

    try {
        await runQuery(db, sql);
        console.log('Transaction inserted successfully.');
    } catch (err: any) {
        console.error('Error inserting transaction:', err.message);
        throw err;
    }
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

export async function updateTransaction(db: sqlite3.Database, t: any): Promise<void> {
    const sql = `UPDATE transactions SET "date" = '${t.date.toISOString()}', status = '${t.status}' WHERE signature = '${t.signature}'`;

    try {
        await runQuery(db, sql);
        console.log('Transaction updated successfully.');
    } catch (err: any) {
        console.error('Error updating transaction:', err.message);
        throw err;
    }
}