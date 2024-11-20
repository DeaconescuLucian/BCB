import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import * as dataCollectProcessDb from '../database/dataCollection/dataCollectProcess';
import * as dataCollectPoolsDb from '../database/dataCollection/dataCollectPools';
import * as dataCollectPoolFiltersDb from '../database/dataCollection/dataCollectPoolFilters';
import { BrowserWindow } from 'electron';
import { Connection, PublicKey } from '@solana/web3.js';
import DataCollectorManager from '../solana/dataCollection/dataCollectorManager';
import { NPTDataCollector } from '../solana/dataCollection/NPTDataCollector';
import DataCollector from '../solana/dataCollection/dataCollector';

const GetDataCollectProcessesHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getDataCollectProcessesEvent, async () => {
    return new Promise((resolve, reject) => {
      dataCollectProcessDb.getNPTProcesses(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const dataCollectProcesses = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(dataCollectProcesses);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const gatherNPTProcessData = (db: sqlite3.Database, trackProcessId: string): Promise<any[] | any> => {
  return new Promise(async (resolve, reject) => {
    const poolsPromise = new Promise((resolve, reject) => {
      dataCollectProcessDb.getDataCollectProcessPools(db, trackProcessId, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const pools = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(pools);
          } catch (error) {
            reject(error);
          }
        }
      });
    });

    const poolFiltersPromise = new Promise((resolve, reject) => {
      dataCollectProcessDb.getDataCollectProcessPoolFilters(db, trackProcessId, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const poolFilters = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(poolFilters);
          } catch (error) {
            reject(error);
          }
        }
      });
    });

    return Promise.all([poolsPromise, poolFiltersPromise]).then((values) => {
      try {
        resolve(values);
      } catch (error) {
        reject({ error: error });
      }
    });
  });
};

const GetDataCollectProcessDetailsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getDataCollectProcessDetailsEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      const values = await gatherNPTProcessData(db, arg);
      if (values.error) {
        reject(values.error);
      } else {
        let [pools, poolFilters] = values;
        pools = pools.map((pool: any) => {
          return {
            ...pool,
            poolFilters: poolFilters.filter((filter: any) => filter.poolId === pool.poolId),
          };
        });

        resolve({
          pools,
          poolFilters,
        });
      }
    });
  });
};

const StartDataCollectProcessHandler = (
  db: sqlite3.Database,
  window: BrowserWindow | null,
  connection: Connection,
  dcm: DataCollectorManager
) => {
  registerHandler(CustomEvents.startDataCollectProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const values = await gatherNPTProcessData(db, arg);
        if (values.error) {
          reject(values.error);
        } else {
          let [pools, poolFilters] = values;
          pools = pools.map((pool: any) => {
            return {
              ...pool,
              poolFilters: poolFilters.filter((filter: any) => filter.poolId === pool.poolId),
            };
          });
          const dataCollector = new DataCollector(arg, connection);
          dataCollector.initialize(pools);
          dataCollector.startProcess();
          dcm.register(
            arg,
            dataCollector,
            pools,
          );
          await dataCollectProcessDb.startDataCollectProcess(db, arg).then(async (r) => {
            sendToRenderer(window, CustomEvents.updateDataCollectProcessEvent, {
              id: arg,
              updateType: 'start',
            });
            resolve('process started');
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

const StopDataCollectProcessHandler = (db: sqlite3.Database, window: BrowserWindow | null, dcm: DataCollectorManager) => {
  registerHandler(CustomEvents.stopDataCollectProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await dataCollectProcessDb.stopDataCollectProcess(db, arg).then(async (r) => {
          await dcm.remove(arg);
          sendToRenderer(window, CustomEvents.updateDataCollectProcessEvent, {
            id: arg,
            updateType: 'stop',
          });
          resolve('process stopped');
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

const ViewDataCollectProcessHandler = (dcm: DataCollectorManager) => {
  registerHandler(CustomEvents.viewDataCollectProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      dcm.viewDataCollector(arg);
      resolve('view');
    });
  });
};

const handleDataCollectProcess = (db: sqlite3.Database, window: BrowserWindow | null, connection: Connection) => {
  const dcm = DataCollectorManager.getInstance();
  GetDataCollectProcessesHandler(db);
  GetDataCollectProcessDetailsHandler(db);
  StartDataCollectProcessHandler(db, window, connection, dcm);
  StopDataCollectProcessHandler(db, window, dcm);
  ViewDataCollectProcessHandler(dcm);
};

export default handleDataCollectProcess;
