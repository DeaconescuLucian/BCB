import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTablWalletTokens(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS walletTokens (
        publicKey TEXT PRIMARY KEY,
        tokenSignature TEXT,
        tokenName TEXT,
        amount REAL NOT NULL,
        FOREIGN KEY (publicKey) REFERENCES wallets(publicKey) ON DELETE CASCADE ON UPDATE CASCADE)`;
  await runQuery(db, sql);
}

export function insertWalletTokens(
  db: sqlite3.Database,
  tokens: { publicKey: string; tokenSignature: string; tokenName: string; amount: number }[],
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(
    `INSERT INTO walletTokens (publicKey, tokenSignature, tokenName, amount) VALUES (?, ?, ?, ?)`
  );

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    tokens.forEach((token) => {
      insertStatement.run(token.publicKey, token.tokenSignature, token.tokenName, token.amount, (err: Error | null) => {
        if (err) {
          console.error('Error inserting token:', err.message);
        }
      });
    });

    db.run('COMMIT', (err: Error | null) => {
      if (err) {
        console.error('Error committing transaction:', err.message);
        callback({ error: err.message });
      } else {
        console.log('Transaction committed successfully.');
        callback({ message: 'Tokens inserted successfully.' });
      }
    });
  });

  insertStatement.finalize();
}

export function getWalletTokens(
  db: sqlite3.Database,
  publicKey: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(`SELECT * FROM walletTokens WHERE publicKey = ${publicKey}`, (err: Error | null, rows: any[]) => {
      if (err) {
        console.error('Error retrieving walletTokens:', err.message);
        callback(err);
      } else {
        console.log('Retrieved wallet tokens.');
        callback(null, rows);
      }
    });
  });
}
