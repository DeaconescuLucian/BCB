import { registerHandler } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';
import { CustomEvents } from '../events';
import sqlite3  from 'sqlite3';
import * as walletDb from "../database/wallets";
import { Connection } from '@solana/web3.js';

const ImportWalletHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.importWalletEvent, async (e: any, arg: any) => {
    try {
      const response = importKeypair(arg.secretKey);
      return new Promise((resolve) => {
        walletDb.insertWallet(db, {wallet: response.data, alias: arg.alias}, (result: any) => {
          resolve(result);
        });
      });
    } catch (error) {
      console.error('Error in ImportWalletHandler:', error);
      return 'error';
    }
  });
};

const GenerateWalletHandler = () => {
  registerHandler(CustomEvents.generateWalletEvent, async () => {
    try {
      const response = generateWallet();
      return new Promise((resolve) => {
        resolve(response);
      });
    } catch (error) {
      console.error('Error in GenerateWalletHandler:', error);
      return 'error';
    }
  });
};

const SaveWalletHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.saveWalletEvent, async (e: any, arg: any) => {
    return new Promise((resolve) => {
      walletDb.insertWallet(db, arg, (result: any) => {
        resolve(result);
      });
    });
  });
};

const GetWalletsHandler = (db: sqlite3.Database, solanaConnection: Connection) => {
  registerHandler(CustomEvents.getWalletsEvent, async () => {
    return new Promise((resolve) => {
      walletDb.getWallets(db, (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
  });
};

const handleWallet = (db: sqlite3.Database, solanaConnection: Connection) => {
  ImportWalletHandler(db);
  GenerateWalletHandler();
  SaveWalletHandler(db);
  GetWalletsHandler(db, solanaConnection);
}

export default handleWallet;
