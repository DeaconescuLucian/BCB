import sqlite3 from 'sqlite3';
import { runQuery } from '../db';


export async function createTableTrackProcessSettingsLookup(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS trackProcessSettingsLookup (
                 id INTEGER PRIMARY KEY,
                 name TEXT,
                 settingType TEXT )`;
    await runQuery(db, sql);    
}

export async function insertTrackProcessSettingsLookupValues(db: sqlite3.Database) {
    const sql = `INSERT OR IGNORE INTO trackProcessSettingsLookup (id, name, settingType) VALUES 
                 (0, 'Budget', 'number'),
                 (1, 'Buy Amount Type', 'text'),
                 (2, 'Buy Amount Value', 'number'),
                 (3, 'Buy Amount Min Value', 'number'),
                 (4, 'Track Duration', 'number'),
                 (5, 'Target Percentage', 'number'),
                 (6, 'Stop Loss Percentage', 'number');`;
    await runQuery(db, sql);    
}