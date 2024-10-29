import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { generateWallet } from '../solana/wallet';
import * as trackProcessDb from '../database/trackProcess';
import * as trackProcessPoolFiltersDb from '../database/trackProcessPoolFilters';
import * as trackProcessSettingsDb from '../database/trackProcessSettings';
import { BrowserWindow } from 'electron';

function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const createNPTProcess = (
  db: sqlite3.Database,
  arg: any,
  guid: string,
  wallet: { publicKey: string; secretKey: string }
) => {
  return new Promise(async (resolve) => {
    await trackProcessDb.insertTrackProcess(db, {
      id: guid,
      trackProcessTypeId: arg.trackProcessTypeId,
      createdOn: arg.createdOn,
      walletPublicKey: wallet.publicKey,
      walletSecretKey: wallet.secretKey,
    });

    if (arg.poolFilters.length > 0) {
      await trackProcessPoolFiltersDb
        .insertPoolFilters(
          db,
          arg.poolFilters.map((f: any) => ({
            trackProcessId: guid,
            poolFilterId: f.id,
            filterValue: f.value?.toString() || null,
          }))
        )
        .then(async (r) => {
          await trackProcessSettingsDb.insertSettings(
            db,
            arg.settings.map((s: any) => ({
              trackProcessId: guid,
              settingId: s.id,
              settingValue: s.value?.toString() || null,
            }))
          );
          resolve('done');
        });
    } else {
      await trackProcessSettingsDb.insertSettings(
        db,
        arg.settings.map((s: any) => ({
          trackProcessId: guid,
          settingId: s.id,
          settingValue: s.value?.toString() || null,
        }))
      );
      resolve('done');
    }
  });
};

const CreateTrackProcessHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.createTrackProcessEvent, async (e: any, arg: any) => {
    const newGuid = generateGUID();
    const wallet = generateWallet();
    switch (arg.trackProcessTypeId) {
      case 0:
        return createNPTProcess(db, arg, newGuid, wallet);
      default:
        break;
    }
  });
};

const GetTrackProcessesHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getTrackProcessesEvent, async () => {
    return new Promise((resolve, reject) => {
      trackProcessDb.getNPTProcesses(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const trackProcesses = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(trackProcesses);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const GetTrackProcessDetailsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getTrackProcessDetailsEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      const poolFiltersPromise = new Promise((resolve, reject) => {
        trackProcessDb.getPoolFilters(db, arg, async (err, rows) => {
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

      const settingsPromise = new Promise((resolve, reject) => {
        trackProcessDb.getSettings(db, arg, async (err, rows) => {
          if (err) {
            reject(err);
          } else {
            try {
              const settings = await Promise.all(
                rows?.map(async (row: any) => {
                  return {
                    ...row,
                  };
                }) || []
              );
              resolve(settings);
            } catch (error) {
              reject(error);
            }
          }
        });
      });

      const poolsPromise = new Promise((resolve, reject) => {
        trackProcessDb.getTrackedPools(db, arg, async (err, rows) => {
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

      const transactionsPromise = new Promise((resolve, reject) => {
        trackProcessDb.getTransactions(db, arg, async (err, rows) => {
          if (err) {
            reject(err);
          } else {
            try {
              const transactions = await Promise.all(
                rows?.map(async (row: any) => {
                  return {
                    ...row,
                  };
                }) || []
              );
              resolve(transactions);
            } catch (error) {
              reject(error);
            }
          }
        });
      });

      const positionsPromise = new Promise((resolve, reject) => {
        trackProcessDb.getPositions(db, arg, async (err, rows) => {
          if (err) {
            reject(err);
          } else {
            try {
              const positions = await Promise.all(
                rows?.map(async (row: any) => {
                  return {
                    ...row,
                  };
                }) || []
              );
              resolve(positions);
            } catch (error) {
              reject(error);
            }
          }
        });
      });

      try {
        await Promise.all([
          poolFiltersPromise,
          settingsPromise,
          poolsPromise,
          transactionsPromise,
          positionsPromise,
        ]).then((values) => {
          const [poolFilters, settings, pools, transactions, positions] = values;
          resolve({
            poolFilters,
            settings,
            pools,
            transactions,
            positions,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

const StartTrackProcessHandler = (db: sqlite3.Database, window: BrowserWindow | null) => {
  registerHandler(CustomEvents.startTrackProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await trackProcessDb.startTrackProcess(db, arg).then(async (r) => {
          sendToRenderer(window, CustomEvents.updateTrackProcessEvent, {
            id: arg,
            updateType: 'start',
          });
          resolve('process started')
        });
      }
      catch (error) { 
        reject(error);
      }
    });

  });
};

const StopTrackProcessHandler = (db: sqlite3.Database, window: BrowserWindow | null) => {
  registerHandler(CustomEvents.stopTrackProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await trackProcessDb.stopTrackProcess(db, arg).then(async (r) => {
          sendToRenderer(window, CustomEvents.updateTrackProcessEvent, {
            id: arg,
            updateType: 'stop',
          });
          resolve('process stopped')
        });
      }
      catch (error) { 
        reject(error);
      }
    });

  });
};

const handleTrackProcess = (db: sqlite3.Database, window: BrowserWindow | null) => {
  CreateTrackProcessHandler(db);
  GetTrackProcessesHandler(db);
  GetTrackProcessDetailsHandler(db);
  StartTrackProcessHandler(db, window);
  StopTrackProcessHandler(db, window);
};

export default handleTrackProcess;
