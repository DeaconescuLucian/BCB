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

export async function insertDataCollectProcesses(db: sqlite3.Database) {
  const sql = `INSERT OR IGNORE INTO dataCollectProcess (id, dataCollectProcessTypeId, isActive) VALUES 
               ('7c226b6b-a05a-409f-9af5-d0f5a4d510ba', 0, 0);`;
  await runQuery(db, sql);    
}

export function getNPTProcesses(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
  db.serialize(() => {
    db.all(
      `SELECT tp.id AS id,
          COUNT(DISTINCT dcpp.poolId) AS poolNo,
          dcp.isActive AS isActive,
          tpt.name AS processType
      FROM dataCollectProcess dcp
        LEFT JOIN trackProcessType tpt ON dcp.dataCollectProcessTypeId = tpt.id
        LEFT JOIN dataCollectProcessPools dcpp ON dcp.id = dcpp.dataCollectProcessId
      WHERE dcp.dataCollectProcessTypeId = 0
      GROUP BY dcp.id;`,
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error retrieving data collect processes:', err.message);
          callback(err);
        } else {
          console.log('Retrieved data collect processes.');
          callback(null, rows);
        }
      }
    );
  });
}

export function getDataCollectProcessPools(
  db: sqlite3.Database,
  dcId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          dcpp.poolId AS poolId,
          dcpp.baseMint AS baseMint,
          dcpp.quoteMint AS quoteMint,
          dcpp.marketId as marketId
       FROM dataCollectProcessPools dcpp
       WHERE dcpp.dataCollectProcessId = '${dcId}'
       ORDER BY dcpp.trackedOn DESC
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

export function getDataCollectProcessPoolFilters(
  db: sqlite3.Database,
  dcpId: string,
  callback: (err: Error | null, rows?: any[]) => void
): void {
  db.serialize(() => {
    db.all(
      `SELECT 
          dcpp.poolId AS poolId,
          dcpfl.name AS name,
          dcpfl.filterType AS type,
          dccpf.filterValue AS value
       FROM dataCollectProcessPools dcpp
          RIGHT JOIN dataCollectProcessPoolFilters dccpf ON dcpp.dataCollectProcessId = dccpf.dataCollectProcessId AND dcpp.poolId = dccpf.poolId
          RIGHT JOIN dataCollectPoolFiltersLookup dcpfl ON dcpfl.id = dccpf.poolFilterId
       WHERE dcpp.dataCollectProcessId = '${dcpId}'
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

export async function startDataCollectProcess(db: sqlite3.Database, dataCollectProcess: any) {
  const sql = `UPDATE dataCollectProcess SET isActive = 1 WHERE id = '${dataCollectProcess}'`;
  await runQuery(db, sql);
}

export async function stopDataCollectProcess(db: sqlite3.Database, dataCollectProcess: any) {
  const sql = `UPDATE dataCollectProcess SET isActive = 0 WHERE id = '${dataCollectProcess}'`;
  await runQuery(db, sql);
}