import sqlite3 from 'sqlite3';
import { runQuery } from '../db';


export async function createTablePoolFiltersLookup(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS dataCollectPoolFiltersLookup (
                 id INTEGER PRIMARY KEY,
                 name TEXT,
                 filterType TEXT)`;
    await runQuery(db, sql);    
}

export async function insertDataCollectPoolFiltersLookupValues(db: sqlite3.Database) {
    const sql = `INSERT OR IGNORE INTO dataCollectPoolFiltersLookup (id, name, filterType) VALUES 
                 (0, 'SOLANA_POOL', 'number'),
                 (1, 'POOL_PERCENTAGE', 'number'),
                 (2, 'POTATO_COUNT', 'number'),
                 (3, 'NOT_MINTABLE', 'bool'),
                 (4, 'NOT_FREEZABLE', 'bool');`;
    await runQuery(db, sql);    
}

export function getPoolFilters(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
    db.serialize(() => {
      db.all(
        `SELECT * FROM dataCollectPoolFiltersLookup`,
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