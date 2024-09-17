import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableConnections(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS connections(
        connection TEXT PRIMARY KEY,
        isActive INTEGER CHECK(isActive IN (0, 1)) NOT NULL DEFAULT 0 )
        `;
  await runQuery(db, sql);
}

export function insertConnection(
  db: sqlite3.Database,
  connection: string,
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(`INSERT INTO connections (connection, isActive) VALUES (?, ?)`);

  db.serialize(() => {
    // Start the transaction
    db.run('BEGIN TRANSACTION');

    let hasError = false;

    // Check if the connection already exists
    db.get(`SELECT 1 FROM connections WHERE connection = ?`, [connection], (err: Error | null, row: any) => {
      if (err) {
        console.error('Error checking for existing connection:', err.message);
        hasError = true;
      } else if (row) {
        console.log(`Connection ${connection} already exists. Skipping insert.`);
        hasError = true;
      } else {
        // Insert the new connection
        insertStatement.run(connection, 0, (err: Error | null) => {
          if (err) {
            console.error('Error inserting connection:', err.message);
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
              callback({ error: err.message });
            } else {
              callback({ error: 'Failed to insert connection.' });
            }
          });
        } else {
          // Commit the transaction if there were no errors
          db.run('COMMIT', (err: Error | null) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              callback({ error: err.message });
            } else {
              console.log('Transaction committed successfully.');
              callback({ message: 'Connection inserted successfully.' });
            }
          });
        }
      });
    });
  });
}

export function deleteConnection(
  db: sqlite3.Database,
  connection: string,
  callback?: (result: { error?: string; message?: string }) => void
): void {
  db.serialize(() => {
    db.run(`DELETE FROM connections WHERE connection = ?`, [connection], (err: Error | null) => {
      if (err) {
        console.error('Error deleting connection:', err.message);
        if (callback) callback({ error: err.message });
      } else {
        console.log('Connection deleted successfully.');
        if (callback) callback({ message: 'Connection successfully deleted' });
      }
    });
  });
}

export function getConnections(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(`SELECT * FROM connections`, (err: Error | null, rows: any[]) => {
      if (err) {
        console.error('Error retrieving connections:', err.message);
        callback(err);
      } else {
        console.log('Retrieved connections.');
        callback(null, rows);
      }
    });
  });
}

export function updateActiveConnection(
  db: sqlite3.Database,
  arg: string,
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err: Error | null) => {
      if (err) {
        console.error('Error beginning transaction:', err.message);
        if (callback) callback(err);
        return;
      }

      db.run(`UPDATE connections SET isActive = 0 WHERE isActive = 1`, (err: Error | null) => {
        if (err) {
          console.error('Error updating isActive to 0:', err.message);
          db.run('ROLLBACK', () => {
            if (callback) callback(err);
          });
          return;
        }

        db.run(`UPDATE connections SET isActive = 1 WHERE connection = ?`, arg, (err: Error | null) => {
          if (err) {
            console.error('Error updating isActive to 1:', err.message);
            db.run('ROLLBACK', () => {
              if (callback) callback(err);
            });
            return;
          }

          db.run('COMMIT', (err: Error | null) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              if (callback) callback(err);
            } else {
              console.log('Transaction committed successfully.');
              if (callback) callback(null);
            }
          });
        });
      });
    });
  });
}

export async function getActiveConnection(db: sqlite3.Database): Promise<string | null> {
  const sql = `SELECT connection FROM connections WHERE isActive = 1 LIMIT 1`;

  return new Promise((resolve, reject) => {
    db.get(sql, [], (err, row: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.connection : null);
      }
    });
  });
}

export function insertDefaultConnection(
  db: sqlite3.Database,
  connection: string
): Promise<void> {
  const insertStatement = db.prepare(`INSERT INTO connections (connection, isActive) VALUES (?, 1)`);
  
  return new Promise((resolve, reject) => { 
    db.serialize(() => {
      // Start the transaction
      db.run('BEGIN TRANSACTION');
  
      let hasError = false;
  
      // Check if the connection already exists
      db.get(`SELECT 1 FROM connections WHERE connection = ?`, [connection], (err: Error | null, row: any) => {
        if (err) {
          console.error('Error checking for existing connection:', err.message);
          hasError = true;
        } else if (row) {
          console.log(`Connection ${connection} already exists. Skipping insert.`);
          hasError = true;
        } else {
          // Insert the new connection
          insertStatement.run(connection, (err: Error | null) => {
            if (err) {
              console.error('Error inserting connection:', err.message);
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
      });
    });
  })
}

export function deactivateConnection(
  db: sqlite3.Database,
  callback?: (err: Error | null) => void
): void {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err: Error | null) => {
      if (err) {
        console.error('Error beginning transaction:', err.message);
        if (callback) callback(err);
        return;
      }

      db.run(`UPDATE connections SET isActive = 0 WHERE isActive = 1`, (err: Error | null) => {
        if (err) {
          console.error('Error updating isActive to 0:', err.message);
          db.run('ROLLBACK', () => {
            if (callback) callback(err);
          });
          return;
        }

        db.run(`UPDATE connections SET isActive = 1 WHERE connection = 'mainnet-beta'`, (err: Error | null) => {
          if (err) {
            console.error('Error updating isActive to 1:', err.message);
            db.run('ROLLBACK', () => {
              if (callback) callback(err);
            });
            return;
          }

          db.run('COMMIT', (err: Error | null) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              if (callback) callback(err);
            } else {
              console.log('Transaction committed successfully.');
              if (callback) callback(null);
            }
          });
        });
      });
    });
  });
}

