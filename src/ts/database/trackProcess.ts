import sqlite3 from 'sqlite3';
import { runQuery } from './db';

export async function createTableTrackProcess(db: sqlite3.Database) {
  const sql = `CREATE TABLE IF NOT EXISTS trackProcess (
                 id TEXT PRIMARY KEY,
                 trackProcessTypeId INTEGER,
                 createdOn TEXT NOT NULL,
                 walletPublicKey TEXT NOT NULL,
                 walletSecretKey TEXT NOT NULL,
                 isActive INTEGER CHECK(isActive IN (0, 1)) NOT NULL DEFAULT 0,
                 lastStartOn TEXT,
                 FOREIGN KEY (trackProcessTypeId) REFERENCES trackProcessType(id) )`;
  await runQuery(db, sql);
}

export async function insertTrackProcess(db: sqlite3.Database, trackProcess: any) {
  const sql = `INSERT OR IGNORE INTO trackProcess (id, trackProcessTypeId, createdOn, walletPublicKey, walletSecretKey, isActive, lastStartOn) VALUES 
  ('${trackProcess.id}', ${trackProcess.trackProcessTypeId}, '${trackProcess.createdOn}', '${trackProcess.walletPublicKey}', '${trackProcess.walletSecretKey}', 0, NULL)`;
  await runQuery(db, sql);
}

export function getNPTProcesses(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(
      `SELECT tp.id AS id, 
          COUNT(tpp.poolId) AS poolNo, 
          COUNT(tpposO.positionId) AS openPositionNo, 
          COUNT(tpposC.positionId) AS closedPositionNo,
          tp.walletPublicKey AS wallet, 
          tp.isActive AS isActive,
          tp.lastStartOn AS lastStartOn,
          tpt.name AS processType,
          COALESCE(SUM(tpposC.amount * tpposC.exitPrice) - SUM(tpposC.amount * tpposC.startingPrice), 0) 
          + COALESCE(SUM(tpposO.amount * tpposO.currentPrice) - SUM(tpposO.amount * tpposO.startingPrice), 0) AS profit,
          ((COALESCE(SUM(tpposC.amount * tpposC.exitPrice) - SUM(tpposC.amount * tpposC.startingPrice), 0) 
          + COALESCE(SUM(tpposO.amount * tpposO.currentPrice) - SUM(tpposO.amount * tpposO.startingPrice), 0))
          / COALESCE(COALESCE(SUM(tpposC.amount * tpposC.startingPrice), 0) + COALESCE(SUM(tpposO.amount * tpposO.startingPrice), 0), 1) + 1) * 100 AS profitPercentage
      FROM trackProcess tp
          LEFT JOIN trackProcessType tpt ON tp.trackProcessTypeId = tpt.id
          LEFT JOIN trackProcessPools tpp ON tp.id = tpp.trackProcessId
          LEFT JOIN trackProcessPositions tpposO ON tp.id = tpposO.trackProcessId
                                                AND tpposO.status = 'open'
          LEFT JOIN trackProcessPositions tpposC ON tp.id = tpposC.trackProcessId
                                                AND tpposC.status = 'closed'
      GROUP BY tp.id;`, 
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving track processes:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track processes.');
          callback(null, rows);
        }
      }
    );
  });
}
