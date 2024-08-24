import { registerHandler } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import * as walletDb from '../database/wallets';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaBalance } from '../solana/utils';

const ImportWalletHandler = (db: sqlite3.Database, solanaConnection: Connection) => {
  registerHandler(CustomEvents.importWalletEvent, async (e: any, arg: any) => {
    let response: any;
    try {
      response = importKeypair(arg.secretKey);
      const solBalance = await getSolanaBalance(solanaConnection, response.data?.keyPair.publicKey as PublicKey);
      return new Promise((resolve) => {
        walletDb.insertWallet(db, { wallet: response.data, alias: arg.alias, balance: solBalance }, (result: any) => {
          resolve(result);
        });
      });
    } catch (error) {
      return new Promise((resolve) => {
        resolve(response);
      });
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
    if (!arg.balance) arg.balance = 0;
    return new Promise((resolve) => {
      walletDb.insertWallet(db, arg, (result: any) => {
        resolve(result);
      });
    });
  });
};

const GetWalletsHandler = (db: sqlite3.Database, solanaConnection: Connection) => {
  registerHandler(CustomEvents.getWalletsEvent, async () => {
    return new Promise((resolve, reject) => {
      walletDb.getAllWalletsWithTokens(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const wallets = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(wallets);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const handleWallet = async (db: sqlite3.Database, solanaConnection: Connection) => {
  ImportWalletHandler(db, solanaConnection);
  GenerateWalletHandler();
  SaveWalletHandler(db);
  GetWalletsHandler(db, solanaConnection);
};

export default handleWallet;
