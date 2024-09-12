import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableWallets(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS wallets (
        publicKey TEXT PRIMARY KEY,
        secretKey TEXT NOT NULL,
        alias TEXT UNIQUE CHECK(length(alias) >= 3 AND length(alias) <= 20),
        balance REAL NOT NULL)`;
  await runQuery(db, sql);
}

export function insertWallet(
  db: sqlite3.Database,
  w: any,
  callback: (result: { error?: string; message?: string }) => void
): void {
  db.serialize(() => {
    db.run(
      `INSERT INTO wallets (publicKey, secretKey, alias, balance) VALUES (?, ?, ?, ?)`,
      [w.wallet.publicKey, w.wallet.secretKey, w.alias, w.balance],
      (err: Error | null) => {
        if (err) {
          console.error('Error inserting wallet:', err.message);
          callback({ error: err.message });
        } else {
          console.log('Wallet inserted successfully.');
          console.log(w);
          callback({ message: 'Wallet successfully saved' });
        }
      }
    );
  });
}

export function getWallets(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(
      `SELECT w.publicKey, w.alias, w.balance, COUNT(ta.accountAddress) AS tokenAccounts
       FROM wallets w
       LEFT JOIN walletTokenAccounts ta ON w.publicKey = ta.publicKey
       GROUP BY w.publicKey`, 
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving wallets:', err.message);
          callback(err);
        } else {
          console.log('Retrieved wallets.');
          callback(null, rows);
        }
      }
    );
  });
}

export function updateWalletBalance(
  db: sqlite3.Database,
  arg: { publicKey: string; balance: number },
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.all(`UPDATE wallets SET balance = ? WHERE publicKey = ?`, [arg.balance, arg.publicKey], (err: Error | null) => {
      if (err) {
        console.error('Error updating wallet:', err.message);
        if (callback) callback(err);
      } else {
        console.log('Updated wallet balance.');
        if (callback) callback(null);
      }
    });
  });
}

export function deleteWallet(
  db: sqlite3.Database,
  publicKey: string,
  callback?: (result: { error?: string; message?: string }) => void
): void {
  db.serialize(() => {
    db.run(`DELETE FROM wallets WHERE publicKey = ?`, [publicKey], (err: Error | null) => {
      if (err) {
        console.error('Error deleting wallet:', err.message);
        if(callback)
          callback({ error: err.message });
      } else {
        console.log('Wallet inserted successfully.');
        if(callback)
          callback({ message: 'Wallet successfully deleted' });
      }
    });
  });
}

export async function getWalletSecret(
  db: sqlite3.Database,
  publicKey: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT secretKey FROM wallets WHERE publicKey = ?`,
      [publicKey],
      (err: Error | null, row: any) => {
        if (err) {
          console.error('Error retrieving wallet:', err.message);
          reject(err);
        } else {
          if (row) {
            console.log('Retrieved wallet.');
          } else {
            console.log('No wallet found with the given publicKey.');
          }
          resolve(row);
        }
      }
    );
  });
}
