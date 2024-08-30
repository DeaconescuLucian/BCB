
import sqlite3 from 'sqlite3';
import { runQuery } from './db';
import { IToken } from '../solana/utils';


export async function createTableTokens(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS tokens(
        mint TEXT PRIMARY KEY,
        name TEXT,
        symbol TEXT,
        icon TEXT,
        decimals INTEGER NOT NULL,
        isNft INTEGER CHECK(isNft IN (0, 1)) NOT NULL DEFAULT 0 )
        `;
    await runQuery(db, sql);    
}

export function insertTokens(
    db: sqlite3.Database,
    tokens: IToken[],
    callback: (result: { error?: string; message?: string }) => void
  ): void {
    const insertStatement = db.prepare(
      `INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft) VALUES (?, ?, ?, ?, ?, ?)`
    );
  
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
  
      let hasError = false;
  
      tokens.forEach((token, index) => {
        db.get(`SELECT 1 FROM tokens WHERE mint = ?`, [token.mint], (err: Error | null, row: any) => {
          if (err) {
            console.error('Error checking for existing token:', err.message);
            callback({ error: err.message });
            hasError = true;
            return;
          }
  
          if (row) {
            console.log(`Token with mint ${token.mint} already exists. Skipping insert.`);
          } else {
            insertStatement.run(token.mint, token.name, token.symbol, token.icon, token.decimals, token.isNft ? 1 : 0, (err: Error | null) => {
              if (err) {
                console.error('Error inserting token:', err.message);
                hasError = true;
              }
            });
          }

          if (index === tokens.length - 1) {
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
                  callback({ message: 'Tokens inserted successfully.' });
                }
              });
            });
          }
        });
      });
    });
}

export function updateTokens(
  db: sqlite3.Database,
  tokens: IToken[],
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE tokens
      SET name = ?, symbol = ?, icon = ?, decimals = ?, isNft = ?
      WHERE mint = ?
    `);

    for (const token of tokens) {
      stmt.run(
        token.name,
        token.symbol,
        token.icon,
        token.decimals,
        token.isNft ? 1 : 0,
        token.mint,
        function (err: any) {
          if (err) {
            if (callback) {
              callback(err);
            }
            return;
          }
        }
      );
    }

    stmt.finalize(err => {
      if (err) {
        db.run('ROLLBACK');
        if (callback) {
          callback(err);
        }
      } else {
        db.run('COMMIT');
        if (callback) {
          callback(null);
        }
      }
    });
  });
}