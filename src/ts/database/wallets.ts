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

export function getAllWalletsWithTokens(
  db: sqlite3.Database,
  callback: (err: Error | null, result?: { wallet: any; tokens: any[] }[]) => void
) {
  const query = `
        SELECT 
            wallets.publicKey AS walletPublicKey,
            wallets.secretKey AS walletSecretKey,
            wallets.alias AS walletAlias,
            wallets.balance AS walletBalance,
            walletTokens.publicKey AS tokenPublicKey,
            walletTokens.tokenSignature AS tokenSignature,
            walletTokens.tokenName AS tokenName,
            walletTokens.amount AS tokenAmount
        FROM wallets
        LEFT JOIN walletTokens ON wallets.publicKey = walletTokens.publicKey
    `;

  db.all(query, (err: Error | null, rows: any[]) => {
    if (err) {
      console.error('Error retrieving wallets:', err.message);
      callback(err);
      return;
    }

    const result: { wallet: any; tokens: any[] }[] = [];
    const walletMap = new Map<string, { wallet: any; tokens: any[] }>();

    rows.forEach((row) => {
      if (!walletMap.has(row.walletPublicKey)) {
        walletMap.set(row.walletPublicKey, {
          wallet: {
            publicKey: row.walletPublicKey,
            secretKey: row.walletSecretKey,
            alias: row.walletAlias,
            balance: row.walletBalance,
          },
          tokens: [],
        });
      }

      const walletEntry = walletMap.get(row.walletPublicKey)!;

      if (row.tokenPublicKey) {
        walletEntry.tokens.push({
          tokenSignature: row.tokenSignature,
          tokenName: row.tokenName,
          amount: row.tokenAmount,
        });
      }
    });

    result.push(...walletMap.values());
    console.log('Retrieved wallets.');
    callback(null, result);
  });
}

export function getWalletWithTokens(
  db: sqlite3.Database,
  publicKey: string,
  callback: (err: Error | null, result?: { wallet: any; tokens: any[] }) => void
) {
  const query = `
        SELECT 
            wallets.publicKey AS walletPublicKey,
            wallets.secretKey AS walletSecretKey,
            wallets.alias AS walletAlias,
            wallets.balance AS walletBalance,
            walletTokens.publicKey AS tokenPublicKey,
            walletTokens.tokenSignature AS tokenSignature,
            walletTokens.tokenName AS tokenName,
            walletTokens.amount AS tokenAmount
        FROM wallets
        LEFT JOIN walletTokens ON wallets.publicKey = walletTokens.publicKey
        WHERE wallets.publicKey = ?
    `;

  db.all(query, [publicKey], (err: Error | null, rows: any[]) => {
    if (err) {
      callback(err);
      return;
    }

    if (rows.length === 0) {
      // No wallet found with the given publicKey
      callback(null, undefined);
      return;
    }

    // Process results
    const walletData: { wallet: any; tokens: any[] } = {
      wallet: {
        publicKey: rows[0].walletPublicKey,
        secretKey: rows[0].walletSecretKey,
        alias: rows[0].walletAlias,
        balance: rows[0].walletBalance,
      },
      tokens: [],
    };

    rows.forEach((row) => {
      if (row.tokenPublicKey) {
        walletData.tokens.push({
          publicKey: row.tokenPublicKey,
          tokenSignature: row.tokenSignature,
          tokenName: row.tokenName,
          amount: row.tokenAmount,
        });
      }
    });

    callback(null, walletData);
  });
}

export function getWallets(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(`SELECT * FROM wallets`, (err: Error | null, rows: any[]) => {
      if (err) {
        console.error('Error retrieving wallets:', err.message);
        callback(err);
      } else {
        console.log('Retrieved wallets.');
        callback(null, rows);
      }
    });
  });
}

export function updateWalletBalance(
  db: sqlite3.Database,
  arg: { publicKey: string; balance: number },
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.all(`UPDATE wallets SET balance = ${arg.balance} WHERE publicKey = ${arg.publicKey}`, (err: Error | null) => {
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
