import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcessSettings(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcessSettings (
                 trackProcessId TEXT NOT NULL,
                 settingId INTEGER NOT NULL,
                 settingValue TEXT,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id),
                 FOREIGN KEY (settingId) REFERENCES trackProcessSettingsLookup(id),
                 PRIMARY KEY (trackProcessId, settingId) )`;
  await runQuery(db, sql);
}

export function insertSettings(
  db: sqlite3.Database,
  settings: any[],
  callback: (result: { error?: string; message?: string }) => void
): void {
  const insertStatement = db.prepare(
    `INSERT OR IGNORE INTO trackProcessSettings (trackProcessId, settingId, settingValue) VALUES (?, ?, ?)`
  );

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    let hasError = false;

    settings.forEach((s, index) => {
      insertStatement.run(s.trackProcessId, s.settingId, s.settingValue, (err: Error | null) => {
        if (err) {
          console.error('Error inserting setting:', err.message);
          hasError = true;
        }
      });

      if (index === settings.length - 1) {
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
              callback({ message: 'Settings inserted successfully.' });
            }
          });
        });
      }
    });
  });
}
