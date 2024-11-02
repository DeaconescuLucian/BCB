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
          COUNT(DISTINCT tpp.poolId) AS poolNo, 
          COUNT(DISTINCT tpposO.positionId) AS openPositionNo, 
          COUNT(DISTINCT tpposC.positionId) AS closedPositionNo,
          tp.walletPublicKey AS wallet, 
          tp.isActive AS isActive,
          tp.lastStartOn AS lastStartOn,
          tpt.name AS processType,
          tp.createdOn AS createdOn,
          (COALESCE(SUM(tpposC.amount * tpposC.exitPrice) - SUM(tpposC.amount * tpposC.startingPrice), 0) 
          + COALESCE(SUM(tpposO.amount * tpposO.currentPrice) - SUM(tpposO.amount * tpposO.startingPrice), 0) / IIF(COUNT(DISTINCT tpp.poolId) = 0, 1, COUNT(DISTINCT tpp.poolId))) AS profit,
          (((COALESCE(SUM(tpposC.amount * tpposC.exitPrice) - SUM(tpposC.amount * tpposC.startingPrice), 0) 
          + COALESCE(SUM(tpposO.amount * tpposO.currentPrice) - SUM(tpposO.amount * tpposO.startingPrice), 0))
          / COALESCE(COALESCE(SUM(tpposC.amount * tpposC.startingPrice), 0) + COALESCE(SUM(tpposO.amount * tpposO.startingPrice), 0), 1) + 1) * 100  ) AS profitPercentage
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

export function getTrackedPools(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          pk.poolId AS poolId,
          pk.baseMint AS baseMint,
          pk.quoteMint AS quoteMint,
          pk.marketId as marketId
       FROM trackProcess tp
          RIGHT  JOIN trackProcessPools tpp ON tp.id = tpp.trackProcessId
          RIGHT  JOIN poolKeys pk ON tpp.poolId = pk.poolId
       WHERE tp.id = '${tpId}'
       ORDER BY tpp.trackedOn DESC
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving pools:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track pools.');
          callback(null, rows);
        }
      }
    );
  });
}

export function getPoolFilters(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          pfl.name AS name,
          pfl.filterType AS type,
          tppf.filterValue AS value
       FROM trackProcess tp
          RIGHT  JOIN trackProcessPoolFilters tppf ON tp.id = tppf.trackProcessId
          RIGHT  JOIN poolFiltersLookup pfl ON pfl.id = tppf.poolFilterId
       WHERE tp.id = '${tpId}'
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving pool filters:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track pool filters.');
          callback(null, rows);
        }
      }
    );
  });
}

export function getSettings(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          tpsl.name AS name,
          tpsl.settingType AS type,
          tps.settingValue AS value
       FROM trackProcess tp
          RIGHT  JOIN trackProcessSettings tps ON tp.id = tps.trackProcessId
          RIGHT  JOIN trackProcessSettingsLookup tpsl ON tpsl.id = tps.settingId
       WHERE tp.id = '${tpId}'
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving pool settings:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track pool settings.');
          callback(null, rows);
        }
      }
    );
  });
}

export function getTransactions(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          t.signature AS signature,
          t.value AS value,
          t.status AS status,
          t.wallet AS "from",
          t.type AS type,
          t.date AS time
       FROM trackProcess tp
          RIGHT JOIN trackProcessTransactions tpt ON tp.id = tpt.trackProcessId
          RIGHT JOIN transactions t ON t.signature = tpt.transactionSignature
       WHERE tp.id = '${tpId}'
       ORDER BY t.date DESC
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving pool transactions:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track pool transactions.');
          callback(null, rows);
        }
      }
    );
  });
}

export function getPositions(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          tpp.mint AS mint,
          tpp.amount AS amount,
          tpp.startingPrice AS startingPrice,
          tpp.currentPrice AS currentPrice,
          tpp.exitPrice AS exitPrice,
          tpp.status AS status
       FROM trackProcess tp
          RIGHT JOIN trackProcessPositions tpp ON tp.id = tpp.trackProcessId
       WHERE tp.id = '${tpId}'
       ORDER BY tpp.openTime DESC
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving positions:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track positions.');
          callback(null, rows);
        }
      }
    );
  });
}

export async function startTrackProcess(db: sqlite3.Database, trackProcess: any) {
  const sql = `UPDATE trackProcess SET isActive = 1 WHERE id = '${trackProcess}'`;
  await runQuery(db, sql);
}

export async function stopTrackProcess(db: sqlite3.Database, trackProcess: any) {
  const sql = `UPDATE trackProcess SET isActive = 0 WHERE id = '${trackProcess}'`;
  await runQuery(db, sql);
}

export function getTrackProcessShallowData(
  db: sqlite3.Database,
  tpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT * FROM trackProcess WHERE id = '${tpId}'
      `,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving track process data:', err.message);
          callback(err);
        } else {
          console.log('Retrieved track process data.');
          callback(null, rows);
        }
      }
    );
  });
}
