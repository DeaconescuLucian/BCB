import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { Connection, PublicKey } from '@solana/web3.js';
import { buy, getPoolKeys, unwrapSol, wrapSol } from '../solana/transactions';
import { getWalletSecret } from '../database/wallets';
import { generateWallet, getKeyPairFromSecret } from '../solana/wallet';
import { ChildProcess } from 'child_process';
import * as transactionsDb from '../database/transactions';
import { BrowserWindow } from 'electron';

let _poolKeys: any[] = [];

const BuyHandler = (solanaConnection: Connection, db: sqlite3.Database) => {
  registerHandler(
    CustomEvents.buyEvent,
    async (
      e: any,
      arg: { params: { wallet: string; mint: string; amount: number }; fees: number; simulate: boolean }
    ) => {
      let response: any = null;
      console.log(_poolKeys);
      const wallet = await getWalletSecret(db, arg.params.wallet);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          let poolKeys =
            _poolKeys.find((e) => (e.mint = arg.params.mint)) ||
            (await getPoolKeys(new PublicKey(arg.params.mint), solanaConnection));
          if (poolKeys) {
            if (!_poolKeys.find((e) => (e.mint = arg.params.mint)))
              _poolKeys.push({
                mint: arg.params.mint,
                poolKeys: poolKeys,
              });

            response = await buy(
              { poolKeys, wallet: keyPair, mint: new PublicKey(arg.params.mint), amount: arg.params.amount },
              { prioFee: arg.fees },
              solanaConnection,
              arg.simulate
            );

            if (response.status === 'success') {
            }
          }
        }
      }

      return new Promise((resolve) => {
        if (response) resolve(response);
        else {
          resolve(null);
        }
      });
    }
  );
};

function generateRandomNumber() {
  const randomNum = Math.random() * 10;
  const roundedNum = randomNum.toFixed(8);
  return parseFloat(roundedNum);
}

function getRandomStatus() {
  const statuses = ['success', 'fail', 'pending'];
  const randomIndex = Math.floor(Math.random() * statuses.length);
  return statuses[randomIndex];
}

const WrapHandler = (
  solanaConnection: Connection,
  db: sqlite3.Database,
  mainProcess: ChildProcess | null,
  mainWindow: BrowserWindow | null
) => {
  registerHandler(
    CustomEvents.wrapEvent,
    async (e: any, arg: { wallet: string; amount: number; simulate: boolean }) => {
      let response: any = null;
      const wallet = await getWalletSecret(db, arg.wallet);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          response = await wrapSol(keyPair, arg.amount, solanaConnection, arg.simulate);

          if (!arg.simulate) {
            if (response.status === 'success') {
              const transaction = {
                signature: response.signature,
                value: response.amount,
                date: new Date(),
                status: 'pending',
              };
              transactionsDb.insertTransaction(db, transaction);
              if (mainWindow?.isVisible()) {
                sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, transaction);
              }
              mainProcess?.send({
                type: 'confirm-transaction',
                data: { block: response.block, amount: transaction.value, signature: transaction.signature },
              });
            }
          }
        }
      }

      return new Promise((resolve) => {
        if (response) resolve(response);
        else {
          resolve(null);
        }
      });
    }
  );
};

const UnwrapHandler = (solanaConnection: Connection, db: sqlite3.Database) => {
  registerHandler(CustomEvents.unwrapEvent, async (e: any, arg: { wallet: string; simulate: boolean }) => {
    let response: any = null;
    const wallet = await getWalletSecret(db, arg.wallet);
    if (wallet) {
      const keyPair = getKeyPairFromSecret(wallet.secretKey);
      if (keyPair) response = await unwrapSol(keyPair, solanaConnection, arg.simulate);
    }

    return new Promise((resolve) => {
      if (response) resolve(response);
      else {
        resolve(null);
      }
    });
  });
};

const handleTransaction = (
  db: sqlite3.Database,
  solanaConnection: Connection,
  mainProcess: ChildProcess | null,
  mainWindow: BrowserWindow | null
) => {
  BuyHandler(solanaConnection, db);
  WrapHandler(solanaConnection, db, mainProcess, mainWindow);
  UnwrapHandler(solanaConnection, db);
};

export default handleTransaction;
