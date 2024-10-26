import { registerHandler } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import { generateWallet } from '../solana/wallet';
import * as trackProcessDb from '../database/trackProcess';
import * as trackProcessPoolFiltersDb from '../database/trackProcessPoolFilters';
import * as trackProcessSettingsDb from '../database/trackProcessSettings';

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

const handleTrackProcess = (db: sqlite3.Database) => {
  CreateTrackProcessHandler(db);
};

export default handleTrackProcess;
