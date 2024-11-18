import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

export async function createTableDataCollectProcessPoolFilters(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS dataCollectProcessPoolFilters (
                 dataCollectProcessId TEXT NOT NULL,
                 poolFilterId INTEGER NOT NULL,
                 filterValue TEXT,
                 FOREIGN KEY (dataCollectProcessId) REFERENCES dataCollectProcess(id),
                 FOREIGN KEY (poolFilterId) REFERENCES poolFiltersLookup(id),
                 PRIMARY KEY (dataCollectProcessId, poolFilterId) )`;
  await runQuery(db, sql);
}

export function insertPoolFilters(
  db: sqlite3.Database,
  filters: any[]
): Promise<string> {
  return new Promise(async (resolve) => {
    const insertStatement = db.prepare(
      `INSERT OR IGNORE INTO dataCollectProcessPoolFilters (dataCollectProcessId, poolFilterId, filterValue) VALUES (?, ?, ?)`
    );
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err.message);
          return resolve('error');
        }
    
        let hasError = false;
    
        const promises = filters.map((f) => {
          return new Promise((resolve) => {
            insertStatement.run(f.trackProcessId, f.poolFilterId, f.filterValue, (err: any) => {
              if (err) {
                console.error('Error inserting pool filter:', err.message);
                hasError = true;
                resolve('ceva eroare'); 
              } else {
                resolve('da');
              }
            });
          });
        });
    
        Promise.all(promises).then(() => {
          if (hasError) {
            db.run('ROLLBACK', (err) => {
              if (err) {
                console.error('Error rolling back transaction:', err.message);
              }
              insertStatement.finalize();
              resolve('error');
            });
          } else {
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK', () => {
                  insertStatement.finalize();
                  resolve('error');
                });
              } else {
                console.log('Transaction committed successfully.');
                insertStatement.finalize();
                resolve('done');
              }
            });
          }
        });
      });
    });
  });
}