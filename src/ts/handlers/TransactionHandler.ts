import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { Connection, PublicKey } from '@solana/web3.js';
import { buy, getPoolKeys, unwrapSol, wrapSol } from '../solana/transactions';
import { getWalletSecret } from '../database/wallets';
import { getKeyPairFromSecret } from '../solana/wallet';
import * as transactionsDb from '../database/transactions';
import { BrowserWindow } from 'electron';
import * as connectionDb from '../database/connections';
import * as path from 'path';
import { fork } from 'child_process';

let _poolKeys: any[] = [];

const BuyHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
  registerHandler(
    CustomEvents.buyEvent,
    async (
      e: any,
      arg: { params: { wallet: string; mint: string; amount: number }; fees: number; simulate: boolean }
    ) => {
      let response: any = null;
      const wallet = await getWalletSecret(db, arg.params.wallet);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          let poolKeys =
            _poolKeys.find((e) => (e.mint === arg.params.mint))?.poolKeys ||
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
  
                connectionDb.getActiveConnection(db).then((r) => {
                  const confirmTransactionProcess = fork(
                    path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js')
                  );
                  confirmTransactionProcess?.once('message', (msg: any) => {
                    if (msg === 'ready') {
                      confirmTransactionProcess?.send({
                        type: 'start',
                        data: {
                          transactionData: {
                            block: response.block,
                            amount: transaction.value,
                            signature: transaction.signature,
                          },
                          connection: r,
                        },
                      });
                    }
                  });
                  confirmTransactionProcess?.on('message', (msg: any) => {
                    if (msg.type === 'transaction-confirmation-done') {
                      console.log('Transaction confirmed successfully');
                      transactionsDb.updateTransaction(db, msg.data);
                      if (mainWindow?.isVisible()) {
                        sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, msg.data);
                      }
                    }
                  });
                });
              }
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

const WrapHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
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

              connectionDb.getActiveConnection(db).then((r) => {
                const confirmTransactionProcess = fork(
                  path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js')
                );
                confirmTransactionProcess?.once('message', (msg: any) => {
                  if (msg === 'ready') {
                    confirmTransactionProcess?.send({
                      type: 'start',
                      data: {
                        transactionData: {
                          block: response.block,
                          amount: transaction.value,
                          signature: transaction.signature,
                        },
                        connection: r,
                      },
                    });
                  }
                });
                confirmTransactionProcess?.on('message', (msg: any) => {
                  if (msg.type === 'transaction-confirmation-done') {
                    console.log('Transaction confirmed successfully');
                    transactionsDb.updateTransaction(db, msg.data);
                    if (mainWindow?.isVisible()) {
                      sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, msg.data);
                    }
                  }
                });
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

const UnwrapHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
  registerHandler(CustomEvents.unwrapEvent, async (e: any, arg: { wallet: string; amount: number; simulate: boolean }) => {
    let response: any = null;
      const wallet = await getWalletSecret(db, arg.wallet);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          response = await unwrapSol(keyPair, solanaConnection, arg.amount, arg.simulate);

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

              connectionDb.getActiveConnection(db).then((r) => {
                const confirmTransactionProcess = fork(
                  path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js')
                );
                confirmTransactionProcess?.once('message', (msg: any) => {
                  if (msg === 'ready') {
                    confirmTransactionProcess?.send({
                      type: 'start',
                      data: {
                        transactionData: {
                          block: response.block,
                          amount: transaction.value,
                          signature: transaction.signature,
                        },
                        connection: r,
                      },
                    });
                  }
                });
                confirmTransactionProcess?.on('message', (msg: any) => {
                  if (msg.type === 'transaction-confirmation-done') {
                    console.log('Transaction confirmed successfully');
                    transactionsDb.updateTransaction(db, msg.data);
                    if (mainWindow?.isVisible()) {
                      sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, msg.data);
                    }
                  }
                });
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
  });
};

const handleTransaction = (db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null) => {
  BuyHandler(solanaConnection, db, mainWindow);
  WrapHandler(solanaConnection, db, mainWindow);
  UnwrapHandler(solanaConnection, db, mainWindow);
};

export default handleTransaction;
