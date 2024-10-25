import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcessPoolFilters(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcessPoolFilters (
                 trackProcessId TEXT NOT NULL,
                 poolFilterId INTEGER NOT NULL,
                 filterValue TEXT,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id),
                 FOREIGN KEY (poolFilterId) REFERENCES poolFiltersLookup(id),
                 PRIMARY KEY (trackProcessId, poolFilterId) )`;
  await runQuery(db, sql);
}

export function insertPoolFilters(
  db: sqlite3.Database,
  filters: any[],
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(
    `INSERT OR IGNORE INTO trackProcessPoolFilters (trackProcessId, poolFilterId, filterValue) VALUES (?, ?, ?)`
  );

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    let hasError = false;

    filters.forEach((f, index) => {
      insertStatement.run(f.trackProcessId, f.poolFilterId, f.filterValue, (err: Error | null) => {
        if (err) {
          console.error('Error inserting pool filter:', err.message);
          hasError = true;
        }
      });

      if (index === filters.length - 1) {
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
              callback({ message: 'Pool filters inserted successfully.' });
            }
          });
        });
      }
    });
  });
}
