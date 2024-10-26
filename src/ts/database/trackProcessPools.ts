import sqlite3 from 'sqlite3';
import { runQuery } from './db';


export async function createTableTrackProcessPools(db: sqlite3.Database) {
    const sql = `CREATE TABLE IF NOT EXISTS trackProcessPools (
                 trackProcessId TEXT NOT NULL,
                 poolId TEXT NOT NULL,
                 trackedOn TEXT NOT NULL,
                 shouldUntrackOn TEXT,
                 FOREIGN KEY (trackProcessId) REFERENCES trackProcess(id),
                 FOREIGN KEY (poolId) REFERENCES poolKeys(id),
                 PRIMARY KEY (trackProcessId, poolId) )`;
    await runQuery(db, sql);    
}

export async function insertTrackProcessPool(db: sqlite3.Database, trackProcessPool: any) {
    const sql = `INSERT OR IGNORE INTO trackProcessPools (trackProcessId, poolId, trackedOn, shouldUntrackOn) 
    VALUES ('${trackProcessPool.trackProcessId}', ${trackProcessPool.poolId}, ${trackProcessPool.trackedOn}, ${trackProcessPool.shouldUntrackOn})`;
    await runQuery(db, sql);
}