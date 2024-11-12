import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcessPools(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcessPools (
                 trackProcessId TEXT NOT NULL,
                 poolId TEXT NOT NULL,
                 baseMint TEXT NOT NULL,
                 quoteMint TEXT NOT NULL,
                 marketId TEXT,
                 trackedOn TEXT NOT NULL,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id),
                 PRIMARY KEY (trackProcessId, poolId) )`;
  await runQuery(db, sql);
}

export async function insertTrackProcessPool(db: sqlite3.Database, trackProcessPool: any) {
  const sql = `INSERT OR IGNORE INTO trackProcessPools (trackProcessId, poolId, trackedOn, baseMint, quoteMint, marketId) 
    VALUES ('${trackProcessPool.trackProcessId}', '${trackProcessPool.poolId}', '${trackProcessPool.trackedOn}', 
    '${trackProcessPool.baseMint}', '${trackProcessPool.quoteMint}', '${trackProcessPool.marketId}')`;
  await runQuery(db, sql);
}

export async function RemovePool(db: sqlite3.Database, trackProcessId: string, poolId: string) {
  const sql = `DELETE FROM trackProcessPools WHERE trackProcessId = '${trackProcessId}' AND poolId = '${poolId}'`;
  await runQuery(db, sql);
}

export async function cleanUpPools(db: sqlite3.Database) {
  const sql = `DELETE FROM trackProcessPools
               WHERE poolId IN 
               (
                  SELECT pools.poolId
                  FROM trackProcessPools pools
                    LEFT JOIN trackProcessPositions pos ON pools.poolId = pos.poolId 
                                                      AND pools.trackProcessId = pos.trackProcessId
                  WHERE pos.status IN ('open pending', 'open fail', 'close fail', 'closed') OR pos.status IS NULL );`;
  await runQuery(db, sql);
}
