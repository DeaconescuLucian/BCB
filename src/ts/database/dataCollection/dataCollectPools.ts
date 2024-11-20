import sqlite3 from 'sqlite3';
import { runQuery } from '../db';

export async function createTableDataCollectPools(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS dataCollectProcessPools (
                 dataCollectProcessId TEXT NOT NULL,
                 poolId TEXT NOT NULL,
                 baseMint TEXT NOT NULL,
                 quoteMint TEXT NOT NULL,
                 marketId TEXT,
                 trackedOn TEXT NOT NULL,
                 lpBurnOn TEXT,
                 FOREIGN KEY (dataCollectProcessId) REFERENCES dataCollectProcess(id),
                 PRIMARY KEY (dataCollectProcessId, poolId) )`;
  await runQuery(db, sql);
}

export async function insertDataCollectProcessPool(db: sqlite3.Database, dataCollectProcessPool: any) {
  const sql = `INSERT OR IGNORE INTO dataCollectProcessPools (dataCollectProcessId, poolId, trackedOn, baseMint, quoteMint, marketId, lpBurnOn) 
    VALUES ('${dataCollectProcessPool.dataCollectProcessId}', '${dataCollectProcessPool.poolId}', '${dataCollectProcessPool.trackedOn}', 
    '${dataCollectProcessPool.baseMint}', '${dataCollectProcessPool.quoteMint}', '${dataCollectProcessPool.marketId}', NULL)`;
  await runQuery(db, sql);
}

export async function setDataCollectPoolLpBurnOn(
  db: sqlite3.Database,
  lpBurnOn: string,
  dataCollectProcessId: string,
  poolId: string
) {
  const sql = `UPDATE dataCollectProcessPools SET lpBurnOn = '${lpBurnOn}' WHERE dataCollectProcessId = '${dataCollectProcessId}' AND poolId = '${poolId}'`;
  await runQuery(db, sql);
}
