import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

export async function createTableTrackProcessTypeSettings(db: sqlite3.Database) {
  const sql = ` CREATE TABLE IF NOT EXISTS trackProcessTypeSettings (
                trackProcessTypeId INTEGER,
                settingId INTEGER,
                FOREIGN KEY (trackProcessTypeId) REFERENCES trackProcessType(id),
                FOREIGN KEY (settingId) REFERENCES trackProcessSettingsLookup(id),
                PRIMARY KEY (trackProcessTypeId, settingId) )`;
  await runQuery(db, sql);
}

export async function insertTrackProcessTypeSettings(db: sqlite3.Database) {
  const sql = `  INSERT OR IGNORE INTO trackProcessTypeSettings (trackProcessTypeId, settingId) VALUES 
                 (0, 0),
                 (0, 1),
                 (0, 2),
                 (0, 3),
                 (0, 4);`;
  await runQuery(db, sql);
}
