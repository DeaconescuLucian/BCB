import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcessPositions(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcessPositions (
                 positionId TEXT PRIMARY KEY,
                 trackProcessId TEXT NOT NULL,
                 mint TEXT NOT NULL,
                 amount REAL NOT NULL,
                 startingPrice REAL NOT NULL,
                 currentPrice REAL NOT NULL,
                 exitPrice REAL,
                 status TEXT CHECK(status IN ('open', 'closed')),
                 openTime TEXT NOT NULL,
                 closeTime TEXT,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id))`;
  await runQuery(db, sql);
}

export async function insertTrackProcessPosition(db: sqlite3.Database, position: any) {
  const sql = `INSERT OR IGNORE INTO trackProcessPositions (trackProcessId, positionId, mint, amount, startingPrice, currentPrice, exitPrice, status, 
  openTime, closeTime) 
    VALUES (${position.trackProcessId}, ${position.positionId}, ${position.mint}, ${position.amount}, ${position.startingPrice}, ${position.currentPrice}, 
    ${position.exitPrice}, ${position.status}, ${position.openTime}, ${position.closeTime})`;
  await runQuery(db, sql);
}
