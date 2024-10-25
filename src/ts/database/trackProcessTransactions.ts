import sqlite3 from 'sqlite3';
import { runQuery } from './db';


export async function createTableTrackProcessTransactions(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS trackProcessTransactions (
                 trackProcessId TEXT NOT NULL,
                 transactionSignature TEXT NOT NULL,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id),
                 FOREIGN KEY (transactionSignature) REFERENCES transactions(signature),
                 PRIMARY KEY (trackProcessId, transactionSignature) )`;
    await runQuery(db, sql);    
}

export async function insertTrackProcessTransaction(db: sqlite3.Database, trackProcessTransaction: any) {
    const sql = `INSERT OR IGNORE INTO trackProcessTransactions (trackProcessId, transactionSignature) VALUES (${trackProcessTransaction.trackProcessId}, ${trackProcessTransaction.transactionSignature})`;
    await runQuery(db, sql);
}