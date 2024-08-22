import { registerHandler } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';
import { CustomEvents } from '../events';
import sqlite3  from 'sqlite3';
import * as walletDb from "../database/wallets";

const ImportWalletHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.importWalletEvent, async (e: any, arg: string) => {
    try {
      const response = importKeypair(arg);
      return new Promise((resolve) => {
        walletDb.insertWallet(db, response.data, (result: any) => {
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

const handleWallet = (db: sqlite3.Database) => {
  ImportWalletHandler(db);
  GenerateWalletHandler();
  SaveWalletHandler(db);
}

export default handleWallet;
