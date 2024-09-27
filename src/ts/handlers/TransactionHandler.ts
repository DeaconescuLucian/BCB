import { registerHandler, sendToRenderer } from '../ipcHandler';
import { CustomEvents, ProcessType } from '../events';
import sqlite3 from 'sqlite3';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  unwrapSol,
  wrapSol,
  swapWithRaydiumAPI,
  simpleTransfer,
  simpleTokenTransfer,
  swapWithJupiterAPI,
} from '../solana/transactions';
import { getWalletSecret } from '../database/wallets';
import { getKeyPairFromSecret } from '../solana/wallet';
import * as transactionsDb from '../database/transactions';
import { BrowserWindow } from 'electron';
import { getTokensPrice } from '../solana/utils';

const saveTransactionHelper = (
  simulate: boolean,
  transaction: any,
  response: any,
  window: BrowserWindow | null,
  db: sqlite3.Database
) => {
  if (!simulate) {
    if (response.status === 'success') {
      transactionsDb.insertTransaction(db, transaction);
      if (window?.isVisible()) {
        sendToRenderer(window, ProcessType.TRANSACTION.updateEvent, transaction);
      }
      if (response.confirmation) {
        response.confirmation.then((msg: any) => {
          console.log('Transaction confirmed successfully');
          let data = {
            signature: transaction.signature,
            wallet: transaction.wallet,
            status: msg.status,
            date: transaction.date,
            value: transaction.value,
            type: transaction.type,
          };
          transactionsDb.updateTransaction(db, data);
          if (window?.isVisible()) {
            sendToRenderer(window, ProcessType.TRANSACTION.updateEvent, data);
          }
        });
      }
    }
  }
};

const SwapHandler = (solanaConnection: Connection, db: sqlite3.Database, mainWindow: BrowserWindow | null) => {
  registerHandler(
    CustomEvents.swapEvent,
    async (
      e: any,
      arg: {
        params: { wallet: string; mintA: string; mintB: string; amount: number };
        fees: number;
        slippage: number;
        simulate: boolean;
        swapAPI: string;
      }
    ) => {
      try {
        let response: any = null;
        const wallet = await getWalletSecret(db, arg.params.wallet);
        if (wallet) {
          const keyPair = getKeyPairFromSecret(wallet.secretKey);
          if (keyPair) {
            if (arg.swapAPI === 'jupiter')
              response = await swapWithJupiterAPI(
                solanaConnection,
                arg.params.wallet,
                arg.params.mintA,
                arg.params.mintB,
                arg.simulate,
                arg.params.amount,
                keyPair,
                arg.fees,
                arg.slippage
              );
            else
            {
              response = await swapWithRaydiumAPI(
                solanaConnection,
                arg.params.wallet,
                arg.params.mintA,
                arg.params.mintB,
                arg.simulate,
                arg.params.amount,
                keyPair,
                arg.fees,
                arg.slippage
              );
            }
            const prices = await getTokensPrice([arg.params.mintA, 'So11111111111111111111111111111111111111112']);
            const solanaAmount =
              arg.params.amount * (prices[arg.params.mintA] / prices['So11111111111111111111111111111111111111112']);
            const transaction = {
              signature: response.signature,
              wallet: arg.params.wallet,
              value: solanaAmount,
              date: new Date(),
              status: 'pending',
              type: 'swap',
            };
            saveTransactionHelper(arg.simulate, transaction, response, mainWindow, db);
          }
        }

        return {
          status: response.status,
          message: response?.message,
          error: response?.error,
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
          const transaction = {
            signature: response.signature,
            wallet: arg.wallet,
            value: Number(response.amount),
            date: new Date(),
            status: 'pending',
            type: 'wrap',
          };
          saveTransactionHelper(arg.simulate, transaction, response, mainWindow, db);
        }
      }

      return {
        status: response?.status,
        message: response?.message,
        error: response?.error,
      };
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
          const transaction = {
            signature: response.signature,
            wallet: arg.wallet,
            value: Number(response.amount),
            date: new Date(),
            status: 'pending',
            type: 'unwrap',
          };
          saveTransactionHelper(arg.simulate, transaction, response, mainWindow, db);
        }
      }

      return {
        status: response?.status,
        message: response?.message,
        error: response?.error,
      };
    }
  );
};

const SimpleTransferHandler = (
  solanaConnection: Connection,
  db: sqlite3.Database,
  mainWindow: BrowserWindow | null
) => {
  registerHandler(
    CustomEvents.simpleTransferEvent,
    async (e: any, arg: { walletA: string; walletB: string; amount: number; fee: number; simulate: boolean }) => {
      let response: any = null;
      const wallet = await getWalletSecret(db, arg.walletA);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          response = await simpleTransfer(
            { walletA: keyPair, walletB: new PublicKey(arg.walletB), amount: arg.amount },
            { prioFee: arg.fee },
            solanaConnection,
            arg.simulate
          );
          const transaction = {
            signature: response.signature,
            wallet: arg.walletA,
            value: Number(response.amount),
            date: new Date(),
            status: 'pending',
            type: 'transfer',
          };
          saveTransactionHelper(arg.simulate, transaction, response, mainWindow, db);
        }
      }

      return {
        status: response?.status,
        message: response?.message,
        error: response?.error,
      };
    }
  );
};

const SimpleTokenTransferHandler = (
  solanaConnection: Connection,
  db: sqlite3.Database,
  mainWindow: BrowserWindow | null
) => {
  registerHandler(
    CustomEvents.tokenTransferEvent,
    async (
      e: any,
      arg: { walletA: string; walletB: string; mint: string; amount: number; fee: number; simulate: boolean }
    ) => {
      let response: any = null;
      const wallet = await getWalletSecret(db, arg.walletA);
      if (wallet) {
        const keyPair = getKeyPairFromSecret(wallet.secretKey);
        if (keyPair) {
          response = await simpleTokenTransfer(
            {
              walletA: keyPair,
              walletB: new PublicKey(arg.walletB),
              mint: new PublicKey(arg.mint),
              amount: arg.amount,
            },
            { prioFee: arg.fee },
            solanaConnection,
            arg.simulate
          );
          const prices = await getTokensPrice([arg.mint, 'So11111111111111111111111111111111111111112']);
          const solanaAmount = arg.amount * (prices[arg.mint] / prices['So11111111111111111111111111111111111111112']);

          const transaction = {
            signature: response.signature,
            wallet: arg.walletA,
            value: solanaAmount,
            date: new Date(),
            status: 'pending',
            type: 'token transfer',
          };
          saveTransactionHelper(arg.simulate, transaction, response, mainWindow, db);
        }
      }

      return {
        status: response?.status,
        message: response?.message,
        error: response?.error,
      };
    }
  );
};

const handleTransaction = (db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null) => {
  SwapHandler(solanaConnection, db, mainWindow);
  WrapHandler(solanaConnection, db, mainWindow);
  UnwrapHandler(solanaConnection, db, mainWindow);
  SimpleTransferHandler(solanaConnection, db, mainWindow);
  SimpleTokenTransferHandler(solanaConnection, db, mainWindow);
};

export default handleTransaction;
