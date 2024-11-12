import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcessPositions(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcessPositions (
                 positionId TEXT PRIMARY KEY,
                 trackProcessId TEXT NOT NULL,
                 poolId TEXT NOT NULL,
                 mint TEXT NOT NULL,
                 amount REAL,
                 startingPrice REAL,
                 currentPrice REAL,
                 exitPrice REAL,
                 status TEXT CHECK(status IN ('open pending', 'open', 'open fail', 'close pending', 'closed', 'close fail')),
                 openTime TEXT,
                 closeTime TEXT,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id))`;
  await runQuery(db, sql);
}

export async function insertPosition(db: sqlite3.Database, position: any) {
  const sql = `INSERT OR IGNORE INTO trackProcessPositions (trackProcessId, positionId, poolId, mint, amount, startingPrice, currentPrice, exitPrice, status, 
  openTime, closeTime) 
    VALUES ('${position.trackProcessId}', '${position.positionId}', '${position.poolId}', '${position.mint}', NULL, NULL, NULL, 
    NULL, 'open pending', NULL, NULL)`;
  await runQuery(db, sql);
}

export async function UpdatePositionCurrentPrice(db: sqlite3.Database, positionId: string, currentPrice: number) {
  const sql = `UPDATE trackProcessPositions SET currentPrice = ${currentPrice} WHERE positionId = '${positionId}'`;
  await runQuery(db, sql);
}

export async function OpenPosition(db: sqlite3.Database, positionId: string, amount: number, startingPrice: number, openTime: string) {
  const sql = `UPDATE trackProcessPositions SET status = 'open' , amount = ${amount} , startingPrice = ${startingPrice} , openTime = '${openTime}' WHERE positionId = '${positionId}'`;
  await runQuery(db, sql);
}

export async function UpdatePositionStatus(db: sqlite3.Database, positionId: string, status: string) {
  const sql = `UPDATE trackProcessPositions SET status = '${status}'  WHERE positionId = '${positionId}'`;
  await runQuery(db, sql);
}

export async function UpdatePositionAmount(db: sqlite3.Database, positionId: string, amount: number) {
  const sql = `UPDATE trackProcessPositions SET amount = ${amount}  WHERE positionId = '${positionId}'`;
  await runQuery(db, sql);
}

export async function ClosePosition(db: sqlite3.Database, positionId: string, exitPrice: number, closeTime: string) {
  const sql = `UPDATE trackProcessPositions SET status = 'closed' , exitPrice = ${exitPrice} , closeTime = '${closeTime}' WHERE positionId = '${positionId}'`;
  await runQuery(db, sql);
}

export async function cleanUpOpenFailPositions(db: sqlite3.Database) {
  const sql = `DELETE 
                FROM trackProcessPositions
              WHERE status = 'open fail'`;
  await runQuery(db, sql); 
}

export async function updateClosePendingPositions(db: sqlite3.Database) {
  const sql = `UPDATE trackProcessPositions SET status = 'open' WHERE status = 'close pending'`;
  await runQuery(db, sql); 
}

