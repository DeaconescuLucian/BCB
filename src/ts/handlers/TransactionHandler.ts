import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { Connection, PublicKey } from '@solana/web3.js';
import { swap, getPoolKeys, unwrapSol, wrapSol } from '../solana/transactions';
import { getWalletSecret } from '../database/wallets';
import { getKeyPairFromSecret } from '../solana/wallet';
import * as transactionsDb from '../database/transactions';
import { BrowserWindow } from 'electron';
import * as connectionDb from '../database/connections';
import * as path from 'path';
import { fork } from 'child_process';
import { Base, WSOL } from '@raydium-io/raydium-sdk';
import { getRaydiumPoolsbyMints, BasePoolKeys } from '../solana/utils';
import { B } from '@raydium-io/raydium-sdk-v2/lib/api-8d4cc174';

let _poolKeys: any[] = [];

let CachedPoolKeys: BasePoolKeys[] = [];



type ITransactionResponse = {
  status?: string;
  message?: string;
  error?: string;
};

const SwapHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
  registerHandler(
    CustomEvents.swapEvent,
    async (
      e: any,
      arg: { params: { wallet: string; mintA: string; mintB: string ; amount: number }; fees: number; simulate: boolean }
    ) => {
      try{
      let response: any = null;
      const wallet = await getWalletSecret(db, arg.params.wallet);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          let mintA = new PublicKey(arg.params.mintA)
          let mintB = new PublicKey(arg.params.mintB)
          let wsol = new PublicKey(WSOL.mint)
          let isWsol = mintA.equals(wsol) || mintB.equals(wsol)
          let poolKeys:BasePoolKeys;
          if (isWsol) {
            const _ = CachedPoolKeys.find((e) => 
                (e.mintA === arg.params.mintA && e.mintB === arg.params.mintB ||
                 e.mintA === arg.params.mintB && e.mintB === arg.params.mintA));
        
            
            let msg = _ ? `Pool keys found in cache` : `Pool keys not found in cache`;
            console.log(msg)
            poolKeys = _ ?? await (async () => {
              const y = await getRaydiumPoolsbyMints(solanaConnection, arg.params.mintA, arg.params.mintB);
              CachedPoolKeys.push(y!);
              return y!;
          })();
          }
          // console.log(`passed pools:`)
          // console.log(poolKeys!)
          response = await swap(
            { wallet: keyPair, mintA: new PublicKey(arg.params.mintA), mintB: new PublicKey(arg.params.mintB), amount: arg.params.amount },
            { prioFee: arg.fees },
            solanaConnection,
            arg.simulate,
            poolKeys!
          );

          console.log(`we passed here`)

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
                if (response.confirmation){
                  response.confirmation.then((msg: any) => {
                    console.log('Transaction confirmed successfully');
                    let data = {
                      signature: transaction.signature,
                      status: msg.status,
                      date: transaction.date,
                      value: transaction.value,
                    }
                    transactionsDb.updateTransaction(db, data);
                    if (mainWindow?.isVisible()) {
                      sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, data);
                    }
                });
              }
              }
            }
        }
      }

      return {
        status: response.status,
        message: response.message,
        error: response.error,
      };
    }
    catch(e){
      console.log(e)
    }
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
  SwapHandler(solanaConnection, db, mainWindow);
  WrapHandler(solanaConnection, db, mainWindow);
  UnwrapHandler(solanaConnection, db, mainWindow);
};

export default handleTransaction;
