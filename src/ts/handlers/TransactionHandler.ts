import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { Connection, PublicKey, TransactionResponse } from '@solana/web3.js';
import { unwrapSol, wrapSol, swapWithRaydiumAPI, TransactionResult } from '../solana/transactions';
import { getWalletSecret } from '../database/wallets';
import { getKeyPairFromSecret } from '../solana/wallet';
import * as transactionsDb from '../database/transactions';
import { BrowserWindow } from 'electron';
import { BasePoolKeys, getTokensPrice } from '../solana/utils';

let _poolKeys: any[] = [];

let CachedPoolKeys: BasePoolKeys[] = [];

const SwapHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
  registerHandler(
    CustomEvents.swapEvent,
    async (
      e: any,
      arg: { params: { wallet: string; mintA: string; mintB: string; amount: number }; fees: number; slippage: number; simulate: boolean }
    ) => {
      try {
        let response: TransactionResult | null = null;
        const wallet = await getWalletSecret(db, arg.params.wallet);
        if (wallet) {
          const keyPair = getKeyPairFromSecret(wallet.secretKey);
          if (keyPair) {
            response = await swapWithRaydiumAPI(solanaConnection, arg.params.wallet, arg.params.mintA, arg.params.mintB, arg.simulate, arg.params.amount, keyPair, arg.fees, arg.slippage);
            const prices = await getTokensPrice([arg.params.mintA, 'So11111111111111111111111111111111111111112']);
            const solanaAmount = arg.params.amount * (prices[arg.params.mintA] / prices['So11111111111111111111111111111111111111112']);
            if (!arg.simulate) {
              if (response.success) {
                const transaction = {
                  signature: response.signature,
                  wallet: arg.params.wallet,
                  value: solanaAmount,
                  date: new Date(),
                  status: 'pending',
                };
                transactionsDb.insertTransaction(db, transaction);
                if (mainWindow?.isVisible()) {
                  sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, transaction);
                }
                if (response.confirmation) {
                  response.confirmation.then((msg: any) => {
                    console.log('Transaction confirmed successfully');
                    let data = {
                      signature: transaction.signature,
                      wallet: arg.params.wallet,
                      status: msg.status,
                      date: transaction.date,
                      value: solanaAmount,
                    };
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
          status: response?.success ? 'success' : 'fail',
          message: response?.success ? 'Transaction successful' : 'Transaction failed',
          error: response?.error ? response.error : null,
        };
      } catch (e) {
        console.log(e);
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
                wallet: arg.wallet,
                value: response.amount,
                date: new Date(),
                status: 'pending',
              };
              transactionsDb.insertTransaction(db, transaction);
              if (mainWindow?.isVisible()) {
                sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, transaction);
              }
              if (response.confirmation) {
                response.confirmation.then((msg: any) => {
                  console.log('Transaction confirmed successfully');
                  let data = {
                    signature: transaction.signature,
                    wallet: arg.wallet,
                    status: msg.status,
                    date: transaction.date,
                    value: transaction.value,
                  };
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
  registerHandler(
    CustomEvents.unwrapEvent,
    async (e: any, arg: { wallet: string; amount: number; simulate: boolean }) => {
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
                wallet: arg.wallet,
                value: response.amount,
                date: new Date(),
                status: 'pending',
              };
              transactionsDb.insertTransaction(db, transaction);
              if (mainWindow?.isVisible()) {
                sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, transaction);
              }
              if (response.confirmation) {
                response.confirmation.then((msg: any) => {
                  console.log('Transaction confirmed successfully');
                  let data = {
                    signature: transaction.signature,
                    wallet: arg.wallet,
                    status: msg.status,
                    date: transaction.date,
                    value: transaction.value,
                  };
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

      return new Promise((resolve) => {
        if (response) resolve(response);
        else {
          resolve(null);
        }
      });
    }
  );
};

const handleTransaction = (db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null) => {
  SwapHandler(solanaConnection, db, mainWindow);
  WrapHandler(solanaConnection, db, mainWindow);
  UnwrapHandler(solanaConnection, db, mainWindow);
};

export default handleTransaction;
