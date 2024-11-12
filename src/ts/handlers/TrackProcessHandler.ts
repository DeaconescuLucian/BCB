import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { generateWallet, getKeyPairFromSecret } from '../solana/wallet';
import * as trackProcessDb from '../database/trackProcess';
import * as trackProcessPoolFiltersDb from '../database/trackProcessPoolFilters';
import * as trackProcessSettingsDb from '../database/trackProcessSettings';
import { BrowserWindow } from 'electron';
import { Connection, PublicKey } from '@solana/web3.js';
import TrackProcessManager from '../solana/bot/trackProcessManager';
import { NPTTrackProcess } from '../solana/bot/NPTTrackProcess';
import { getWalletSecret } from '../database/wallets';
import { simpleTransfer, wrapSol } from '../solana/transactions';
import { generateGUID } from '../generalUtils';

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

const CreateTrackProcessHandler = (db: sqlite3.Database, connection: Connection) => {
  registerHandler(CustomEvents.createTrackProcessEvent, async (e: any, arg: any) => {
    const newGuid = generateGUID();
    const wallet = generateWallet();
    const parentWallet = await getWalletSecret(db, arg.parentWallet);
    const keyPair = getKeyPairFromSecret(parentWallet.secretKey);
    const response = await simpleTransfer(
      { walletA: keyPair!, walletB: new PublicKey(wallet.publicKey), amount: Number(arg.budget) },
      { prioFee: 0.00001 },
      connection,
      false
    );

    console.log(`GENERATED WALLET SECRET KEY: ${wallet.secretKey}`);
    const msg = await response.confirmation;
    if (msg.status === 'success') {
      const wltKeyPair = getKeyPairFromSecret(wallet.secretKey);
      const response = await wrapSol(
        wltKeyPair!,
        Number((Number(arg.budget) * 0.9 - 0.04).toFixed(9)),
        connection,
        false
      );
      await response.confirmation?.then(async (wrapMsg: any) => {
        if (wrapMsg.status === 'success') {
          switch (arg.trackProcessTypeId) {
            case 0:
              return createNPTProcess(db, arg, newGuid, wallet);
            default:
              break;
          }
        } else {
          return new Promise(async (resolve, reject) => {
            reject('fail');
          });
        }
      });
    } else {
      return new Promise(async (resolve, reject) => {
        reject('fail');
      });
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
            resolve(trackProcesses.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()));
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
    const poolFiltersPromise = new Promise((resolve, reject) => {
      trackProcessDb.getPoolFilters(db, trackProcessId, async (err, rows) => {
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
      trackProcessDb.getSettings(db, trackProcessId, async (err, rows) => {
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
      trackProcessDb.getTrackedPools(db, trackProcessId, async (err, rows) => {
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
      trackProcessDb.getTransactions(db, trackProcessId, async (err, rows) => {
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
      trackProcessDb.getPositions(db, trackProcessId, async (err, rows) => {
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

    const trackProcessDataPromise = new Promise((resolve, reject) => {
      trackProcessDb.getTrackProcessShallowData(db, trackProcessId, async (err, rows) => {
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

    return Promise.all([
      poolFiltersPromise,
      settingsPromise,
      poolsPromise,
      transactionsPromise,
      positionsPromise,
      trackProcessDataPromise,
    ]).then((values) => {
      try {
        resolve(values);
      } catch (error) {
        reject({ error: error });
      }
    });
  });
};

const GetTrackProcessDetailsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getTrackProcessDetailsEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      const values = await gatherNPTProcessData(db, arg);
      if (values.error) {
        reject(values.error);
      } else {
        const [poolFilters, settings, pools, transactions, positions, _] = values;
        resolve({
          poolFilters,
          settings,
          pools,
          transactions,
          positions: positions.sort((a:any, b:any) => {
            if (a.openTime === null && b.openTime !== null) {
              return -1;
            }
            if (a.openTime !== null && b.openTime === null) {
              return 1;
            }
            if (a.openTime !== null && b.openTime !== null) {
              return b.openTime.localeCompare(a.openTime);
            }
            return 0;
          }),
        });
      }
    });
  });
};

const StartTrackProcessHandler = (
  db: sqlite3.Database,
  window: BrowserWindow | null,
  connection: Connection,
  tpm: TrackProcessManager
) => {
  registerHandler(CustomEvents.startTrackProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const values = await gatherNPTProcessData(db, arg);
        if (values.error) {
          reject(values.error);
        } else {
          const [poolFilters, settings, pools, transactions, positions, trackProcessData] = values;
          const trackProcess = new NPTTrackProcess(
            arg,
            getKeyPairFromSecret(trackProcessData[0].walletSecretKey)!,
            connection
          );
          trackProcess.initialize({
            poolFilters,
            pools,
            settings,
            positions: positions.filter((e: any) => e.status === 'open'),
          });
          trackProcess.startProcess();
          tpm.register(arg, trackProcess, positions.filter((e: any) => e.status !== 'open'), transactions);
          await trackProcessDb.startTrackProcess(db, arg).then(async (r) => {
            sendToRenderer(window, CustomEvents.updateTrackProcessEvent, {
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

const StopTrackProcessHandler = (db: sqlite3.Database, window: BrowserWindow | null, tpm: TrackProcessManager) => {
  registerHandler(CustomEvents.stopTrackProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await trackProcessDb.stopTrackProcess(db, arg).then(async (r) => {
          await tpm.remove(arg);
          sendToRenderer(window, CustomEvents.updateTrackProcessEvent, {
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

const ViewTrackProcessHandler = (tpm: TrackProcessManager) => {
  registerHandler(CustomEvents.viewTrackProcessEvent, async (e: any, arg: string) => {
    return new Promise(async (resolve, reject) => {
      tpm.viewTrackProcess(arg);
      resolve('view');
    });
  });
};

const handleTrackProcess = (
  db: sqlite3.Database,
  window: BrowserWindow | null,
  connection: Connection,
  tpm: TrackProcessManager
) => {
  CreateTrackProcessHandler(db, connection);
  GetTrackProcessesHandler(db);
  GetTrackProcessDetailsHandler(db);
  StartTrackProcessHandler(db, window, connection, tpm);
  StopTrackProcessHandler(db, window, tpm);
  ViewTrackProcessHandler(tpm);
};

export default handleTrackProcess;
