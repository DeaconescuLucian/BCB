import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableWalletTokenAccounts(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS walletTokenAccounts (
        accountAddress TEXT PRIMARY KEY,
        publicKey TEXT,
        mint TEXT,
        amount REAL NOT NULL,
        FOREIGN KEY (publicKey) REFERENCES wallets(publicKey) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (mint) REFERENCES tokens(mint) ON DELETE CASCADE ON UPDATE CASCADE
    )`;
  await runQuery(db, sql);
}

export function insertWalletTokenAccounts(
  db: sqlite3.Database,
  tokenAccs: { publicKey: string; accountAddress: string; mint: string; amount: number }[],
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(
    `INSERT INTO walletTokenAccounts (publicKey, accountAddress, mint, amount) VALUES (?, ?, ?, ?)`
  );

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let hasError = false;

    tokenAccs.forEach((tokenAcc, index) => {
      db.get(`SELECT 1 FROM walletTokenAccounts WHERE accountAddress = ?`, [tokenAcc.accountAddress], (err: Error | null, row: any) => {
        if (err) {
          console.error('Error checking for existing token account:', err.message);
          callback({ error: err.message });
          hasError = true;
          return;
        }

        if (row) {
          console.log(`Token account ${tokenAcc.accountAddress} already exists. Skipping insert.`);
        } else {
          insertStatement.run(tokenAcc.publicKey, tokenAcc.accountAddress, tokenAcc.mint, tokenAcc.amount, (err: Error | null) => {
            if (err) {
              console.error('Error inserting token account:', err.message);
              hasError = true;
            }
          });
        }

        if (index === tokenAccs.length - 1) {
          insertStatement.finalize((err: Error | null) => {
            if (err) {
              console.error('Error finalizing statement:', err.message);
              hasError = true;
            }

            db.run('COMMIT', (err: Error | null) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                callback({ error: err.message });
              } else if (!hasError) {
                console.log('Transaction committed successfully.');
                callback({ message: 'Accounts inserted successfully.' });
              }
            });
          });
        }
      });
    });
  });
}

export async function getWalletTokenAccounts(
  db: sqlite3.Database,
  publicKey: string
): Promise<
  {
    accountAddress: string;
    mint: string;
    amount: number;
    name: string;
    symbol: string;
    decimals: number;
    isNft: boolean;
  }[]
> {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        wta.accountAddress,
        wta.mint,
        wta.amount,
        t.name,
        t.symbol,
        t.decimals,
        t.isNft
      FROM 
        walletTokenAccounts wta
      JOIN 
        tokens t
      ON 
        wta.mint = t.mint
      WHERE 
        wta.publicKey = ?;
    `;

    db.all(sql, [publicKey], (err, rows: any) => {
      if (err) {
        console.error('Error retrieving wallet token accounts:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
