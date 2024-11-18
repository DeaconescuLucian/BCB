import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

export async function createDataCollectProcess(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS dataCollectProcess (
                 id TEXT PRIMARY KEY,
                 dataCollectProcessTypeId INTEGER,
                 isActive INTEGER CHECK(isActive IN (0, 1)) NOT NULL DEFAULT 0,
                 FOREIGN KEY (dataCollectProcessTypeId) REFERENCES trackProcessType(id) )`;
  await runQuery(db, sql);
}