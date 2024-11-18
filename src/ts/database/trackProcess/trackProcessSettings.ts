import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

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
  settings: any[]
): Promise<string> {
  return new Promise((resolve) => {
    const insertStatement = db.prepare(
      `INSERT OR IGNORE INTO trackProcessSettings (trackProcessId, settingId, settingValue) VALUES (?, ?, ?)`
    );
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err.message);
          return resolve('error');
        }
    
        let hasError = false;
    
        const promises = settings.map((s) => {
          return new Promise((resolve) => {
            insertStatement.run(s.trackProcessId, s.settingId, s.settingValue, (err: any) => {
              if (err) {
                console.error('Error inserting setting:', err.message);
                hasError = true;
              }
              resolve('mhm');
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

