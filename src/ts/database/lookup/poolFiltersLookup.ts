import sqlite3 from 'sqlite3';
import { runQuery } from '../db';


export async function createTablePoolFiltersLookup(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS poolFiltersLookup (
                 id INTEGER PRIMARY KEY,
                 name TEXT,
                 filterType TEXT)`;
    await runQuery(db, sql);    
}

export async function insertTrackProcessSettingsLookupValues(db: sqlite3.Database) {
    const sql = `INSERT OR IGNORE INTO poolFiltersLookup (id, name, filterType) VALUES 
                 (0, 'MINIMUM_SOLANA_POOL', 'number'),
                 (1, 'MAXIMUM_SOLANA_POOL', 'number'),
                 (2, 'MINIMUM_POOL_PERCENTAGE', 'number'),
                 (3, 'MINIMUM_POTATO_COUNT', 'number'),
                 (4, 'NOT_MINTABLE', 'bool'),
                 (5, 'NOT_FREEZABLE', 'bool');`;
    await runQuery(db, sql);    
}

export function getPoolFilters(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
    db.serialize(() => {
      db.all(
        `SELECT * FROM poolFiltersLookup`,
        (err: Error | null, rows: any[]) => {
          if (err) {
            console.error('Error retrieving poolFilters:', err.message);
            callback(err);
          } else {
            console.log('Retrieved poolFilters.');
            callback(null, rows);
          }
        }
      );
    });
  }