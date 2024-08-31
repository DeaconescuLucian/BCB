import sqlite3 from 'sqlite3';
import { runQuery } from './db';
import { ITokenAccount } from '../solana/utils';

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
  tokenAccs: ITokenAccount[],
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
        wta.accountAddress AS accountAddress,
        wta.mint AS mint,
        wta.amount AS amount,
        t.name AS name,
        t.symbol AS symbol,
        t.icon AS icon,
        t.decimals AS decimals,
        t.isNft AS isNft
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
        resolve([]);
      } else {
        resolve(rows);
      }
    });
  });
}

export function updateTokenAccountBalances(
  db: sqlite3.Database,
  tokenAccounts: { accountAddress: string; balance: number }[],
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE walletTokenAccounts
      SET amount = ?
      WHERE accountAddress = ?
    `);

    for (const account of tokenAccounts) {
      stmt.run(account.balance, account.accountAddress, function (err: Error | null) {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error updating token account balance:', err.message);
          if (callback) callback(err);
          return;
        }
      });
    }

    stmt.finalize((err) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Error finalizing statement:', err.message);
        if (callback) callback(err);
      } else {
        db.run('COMMIT');
        console.log('Updated token account balances.');
        if (callback) callback(null);
      }
    });
  });
}
