import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcess(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcess (
                 id TEXT PRIMARY KEY,
                 trackProcessTypeId INTEGER,
                 createdOn TEXT NOT NULL,
                 walletPublicKey TEXT NOT NULL,
                 walletSecretKey TEXT NOT NULL,
                 FOREIGN KEY (trackProcessTypeId) REFERENCES trackProcessType(id) )`;
  await runQuery(db, sql);
}

export async function insertTrackProcess(db: sqlite3.Database, trackProcess: any) {
  const sql = `INSERT OR IGNORE INTO trackProcess (id, trackProcessTypeId, createdOn, walletPublicKey, walletSecretKey) VALUES (${trackProcess.id}, ${trackProcess.trackProcessTypeId}, ${trackProcess.createdOn})`;
  await runQuery(db, sql);
}
