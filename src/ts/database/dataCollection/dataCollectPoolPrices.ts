import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

export async function createTableDataCollectPoolPrices(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS dataCollectPoolPrices (
                 dataCollectProcessId TEXT NOT NULL,
                 poolId TEXT NOT NULL,
                 price REAL NOT NULL, 
                 date TEXT NOT NULL,
                 FOREIGN KEY (dataCollectProcessId, poolId) REFERENCES dataCollectPools(dataCollectProcessId, poolId),
                 PRIMARY KEY (dataCollectProcessId, poolId) )`;
  await runQuery(db, sql);
}

export async function insertDataCollectProcessPoolPrice(db: sqlite3.Database, dataCollectProcessPoolPrice: any) {
  const sql = `INSERT OR IGNORE INTO dataCollectProcessPoolPrices (dataCollectProcessId, poolId, price, "date") 
    VALUES ('${dataCollectProcessPoolPrice.dataCollectProcessId}', '${dataCollectProcessPoolPrice.poolId}', ${dataCollectProcessPoolPrice.price}, 
    '${dataCollectProcessPoolPrice.date}')`;
  await runQuery(db, sql);
}