import sqlite3 from 'sqlite3';
import { runQuery } from '../db';


export async function createTableTrackProcessType(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS trackProcessType (
                 id INTEGER PRIMARY KEY,
                 name TEXT )`;
    await runQuery(db, sql);    
}

export async function insertTrackProcessTypes(db: sqlite3.Database) {
    const sql = `INSERT OR IGNORE INTO trackProcessType (id, name) VALUES (0, 'NPT ( New Pools Track )')`;
    await runQuery(db, sql);    
}