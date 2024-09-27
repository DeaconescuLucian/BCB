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
        isNft INTEGER CHECK(isNft IN (0, 1)) NOT NULL DEFAULT 0,
        favouriteIndex INTEGER )
        `;
  await runQuery(db, sql);
}

export function insertTokens(
  db: sqlite3.Database,
  tokens: IToken[],
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(
    `INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES (?, ?, ?, ?, ?, ?, NULL)`
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
          insertStatement.run(
            token.mint,
            token.name,
            token.symbol,
            token.icon,
            token.decimals,
            token.isNft ? 1 : 0,
            (err: Error | null) => {
              if (err) {
                console.error('Error inserting token:', err.message);
                hasError = true;
              }
            }
          );
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

export function updateTokens(db: sqlite3.Database, tokens: IToken[], callback?: (err: Error | null) => void): void {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE tokens
      SET name = ?, symbol = ?, icon = ?, decimals = ?, isNft = ?
      WHERE mint = ?
    `);

    for (const token of tokens) {
      stmt.run(token.name, token.symbol, token.icon, token.decimals, token.isNft ? 1 : 0, token.mint, function(
        err: any
      ) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }
      });
    }

    stmt.finalize((err) => {
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

export function getTokens(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(
      `SELECT mint as address, name as name, symbol as symbol, icon as logoURI, favouriteIndex FROM tokens WHERE isNft = 0`,
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

export function getWSOL(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(
      `SELECT mint as address, name as name, symbol as symbol, icon as logoURI FROM tokens WHERE mint = 'So11111111111111111111111111111111111111112'`,
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

export function insertWSOL(db: sqlite3.Database): Promise<void> {
  const insertStatement = db.prepare(
    `INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES ('So11111111111111111111111111111111111111112', 'Wrapped SOL', 'WSOL', 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', 9, 0, 1)`
  );

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Start the transaction
      db.run('BEGIN TRANSACTION');

      let hasError = false;

      // Check if the connection already exists
      db.get(
        `SELECT 1 FROM tokens WHERE mint = ?`,
        ['So11111111111111111111111111111111111111112'],
        (err: Error | null, row: any) => {
          if (err) {
            console.error('Error checking for existing WSOL:', err.message);
            hasError = true;
          } else if (row) {
            console.log(`Token ${'WSOL'} already exists. Skipping insert.`);
            hasError = true;
          } else {
            // Insert the new connection
            insertStatement.run((err: Error | null) => {
              if (err) {
                console.error('Error inserting WSOL:', err.message);
                hasError = true;
              }
            });
          }

          // Finalize the statement
          insertStatement.finalize((err: Error | null) => {
            if (err) {
              console.error('Error finalizing statement:', err.message);
              hasError = true;
            }

            if (hasError) {
              // Rollback the transaction if there was an error
              db.run('ROLLBACK', (err: Error | null) => {
                if (err) {
                  console.error('Error rolling back transaction:', err.message);
                }
                resolve();
              });
            } else {
              // Commit the transaction if there were no errors
              db.run('COMMIT', (err: Error | null) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                } else {
                  console.log('Transaction committed successfully.');
                }
                resolve();
              });
            }
          });
        }
      );
    });
  });
}

export function insertUSDC(db: sqlite3.Database): Promise<void> {
  const insertStatement = db.prepare(
    `INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES ('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USD Coin', 'USDC', 'https://img-v1.raydium.io/icon/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png', 6, 0, 1)`
  );

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Start the transaction
      db.run('BEGIN TRANSACTION');

      let hasError = false;

      // Check if the connection already exists
      db.get(
        `SELECT 1 FROM tokens WHERE mint = ?`,
        ['So11111111111111111111111111111111111111112'],
        (err: Error | null, row: any) => {
          if (err) {
            console.error('Error checking for existing USDC:', err.message);
            hasError = true;
          } else if (row) {
            console.log(`Token ${'USDC'} already exists. Skipping insert.`);
            hasError = true;
          } else {
            // Insert the new connection
            insertStatement.run((err: Error | null) => {
              if (err) {
                console.error('Error inserting USDC:', err.message);
                hasError = true;
              }
            });
          }

          // Finalize the statement
          insertStatement.finalize((err: Error | null) => {
            if (err) {
              console.error('Error finalizing statement:', err.message);
              hasError = true;
            }

            if (hasError) {
              // Rollback the transaction if there was an error
              db.run('ROLLBACK', (err: Error | null) => {
                if (err) {
                  console.error('Error rolling back transaction:', err.message);
                }
                resolve();
              });
            } else {
              // Commit the transaction if there were no errors
              db.run('COMMIT', (err: Error | null) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                } else {
                  console.log('Transaction committed successfully.');
                }
                resolve();
              });
            }
          });
        }
      );
    });
  });
}

export function addTokenToFavourites(db: sqlite3.Database, token: IToken): Promise<void> {
  let error: any = null;
  const insertStatement = db.prepare(
    `INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES (?, ?, ?, ?, ?, ?, (SELECT MAX(favouriteIndex) FROM tokens) + 1)`
  );
  const stmt = db.prepare(`
    UPDATE tokens
    SET favouriteIndex = (SELECT MAX(favouriteIndex) FROM tokens) + 1
    WHERE mint = ?
  `);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Start the transaction
      db.run('BEGIN TRANSACTION');

      // Check if the connection already exists
      db.get(`SELECT 1 FROM tokens WHERE mint = ?`, [token.mint], (err: Error | null, row: any) => {
        if (err) {
          console.error('Error checking for existing mint:', err.message);
          error = err;
        } else if (row) {
          stmt.run(token.mint, function(err: any) {
            if (err) {
              error = err;
              return;
            }
          });

          stmt.finalize((err) => {
            if (err) {
              db.run('ROLLBACK');
              error = err;
            } else {
              db.run('COMMIT');
            }
          });

          resolve(error);
        } else {
          insertStatement.run(
            token.mint,
            token.name,
            token.symbol,
            token.icon,
            token.decimals,
            token.isNft ? 1 : 0,
            (err: Error | null) => {
              if (err) {
                console.error('Error inserting WSOL:', err.message);
                error = err;
              }
            }
          );

          insertStatement.finalize((err: Error | null) => {
            if (err) {
              db.run('ROLLBACK');
              error = err;
            } else {
              db.run('COMMIT');
            }
          });
          resolve(error);
        }
      });
      resolve(error);
    });
  });
}

export async function removeTokenFomFavourites(db: sqlite3.Database, tokenMint: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let error = null;
      const stmt = db.prepare(`
        UPDATE tokens
        SET favouriteIndex = NULL
        WHERE mint = ?
      `);

      stmt.run(tokenMint, function(err: any) {
        if (err) {
          error = err;
          return;
        }
      });

      stmt.finalize((err) => {
        if (err) {
          db.run('ROLLBACK');
          error = err;
        } else {
          db.run('COMMIT');
        }
      });

      resolve(error);
    });
  });
}
