import TrackProcess from './trackProcess';
import * as trackProcessPoolDb from '../../database/trackProcess/trackProcessPools';
import * as trackProcessPositionDb from '../../database/trackProcess/trackProcessPositions';
import * as transactionsDb from '../../database/transactions';
import * as trackProcessTransactionsDb from '../../database/trackProcess/trackProcessTransactions';
import sqlite3 from 'sqlite3';
import { sendToRenderer } from '../../ipcHandler';
import { BrowserWindow } from 'electron';
import { calculateProfitPCT } from '../../generalUtils';
import { SequentialExecutor } from '../../sequentialExecutor';
import { CustomEvents } from '../../events';
export interface ITrackProcessManager {
  trackProcesses: Map<string, TrackProcess>;
  db: sqlite3.Database;
  window: BrowserWindow | null;
  viewedTrackProcess: string;
  updateTimeout: NodeJS.Timeout | null;
  tpNoTrackPosition: Map<string, any[]>;
  tpTransactions: Map<string, any[]>;
  register(id: string, trackProcess: TrackProcess, noTrackPositions: any[], transactions: any[]): void;
  remove(id: string): void;
  removeAll(): void;
  removePosition(trackProcessId: string, positionId: string): void;
  removePool(trackProcessId: string, poolId: string): void;
  saveTrackedPool(trackProcessId: string, pool: any): Promise<void>;
  viewTrackProcess(tp: string): void;
  updateTpNoTrackPositions(tp: string, position: any): void;
  updateWindow(window: BrowserWindow | null): void;
}

export default class TrackProcessManager implements ITrackProcessManager {
  private static instance: TrackProcessManager;
  trackProcesses: Map<string, TrackProcess>;
  db: sqlite3.Database;
  window: BrowserWindow | null;
  viewedTrackProcess: string;
  updateTimeout: NodeJS.Timeout | null;
  tpNoTrackPosition: Map<string, any[]>;
  tpTransactions: Map<string, any[]>;
  private transactionUpdateExecutor = new SequentialExecutor();
  private noTrackPositionUpdateExecutor = new SequentialExecutor();

  private constructor(db: sqlite3.Database, window: BrowserWindow | null) {
    this.trackProcesses = new Map<string, TrackProcess>();
    this.db = db;
    this.window = window;
    this.viewedTrackProcess = '';
    this.tpNoTrackPosition = new Map<string, any[]>();
    this.tpTransactions = new Map<string, any[]>();
    this.updateTimeout = setInterval(() => {
      this.sendUpdates();
    }, 3000);
  }

  public static getInstance(db?: sqlite3.Database, window?: BrowserWindow | null): TrackProcessManager {
    if (!TrackProcessManager.instance) {
      TrackProcessManager.instance = new TrackProcessManager(db!, window!);
    }
    return TrackProcessManager.instance;
  }

  updateWindow(window: BrowserWindow | null): void {
    this.window = window;
  }

  register(id: string, trackProcess: TrackProcess, noTrackPositions: any[], transactions: any[]): void {
    try {
      this.trackProcesses.set(id, trackProcess);
      this.tpNoTrackPosition.set(id, noTrackPositions);
      this.tpTransactions.set(id, transactions);
    } catch (error) {
      console.error(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.trackProcesses.get(id)?.stopProcess();
    this.trackProcesses.delete(id);
    return;
  }

  removeAll(): void {
    this.trackProcesses.forEach(async (trackProcess) => await trackProcess.stopProcess());
    this.trackProcesses.clear();
    if (this.updateTimeout) clearInterval(this.updateTimeout);
  }

  removePosition(trackProcessId: string, positionId: string): void {
    throw new Error('Method not implemented.');
  }

  async removePool(trackProcessId: string, poolId: string): Promise<void> {
    console.log('Removing pool');
    await trackProcessPoolDb.RemovePool(this.db, trackProcessId, poolId);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async saveTrackedPool(pool: any): Promise<void> {
    console.log('Saving pool...');
    await trackProcessPoolDb.insertTrackProcessPool(this.db, pool);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async savePosition(position: any, trackProcessId: string): Promise<void> {
    await this.updateTpTransactions(
      trackProcessId,
      {
        signature: position.signature,
        wallet: position.wallet.publicKey.toString(),
        value: position.amount,
        date: new Date(),
        status: 'pending',
        type: position.type,
      },
      true
    );
    await trackProcessPositionDb.insertPosition(this.db, position);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async persistPositionCurrentPrice(positionId: string, currentPrice: number): Promise<void> {
    await trackProcessPositionDb.UpdatePositionCurrentPrice(this.db, positionId, currentPrice);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async updatePositionStatus(
    positionId: string,
    status: string,
    signature: string,
    trackProcessId: string,
    position?: any
  ): Promise<void> {
    if (status === 'close pending') {
      await this.updateTpTransactions(
        trackProcessId,
        {
          signature: position.signature,
          wallet: position.wallet.publicKey.toString(),
          value: position.amount,
          date: new Date(),
          status: 'pending',
          type: position.type,
        },
        true
      );
    } else if (status === 'open fail' || status === 'close fail' || status === 'open') {
      await this.updateTpTransactions(
        trackProcessId,
        {
          signature,
          status: 'fail',
          date: new Date(),
        },
        false
      );
    }

    await trackProcessPositionDb.UpdatePositionStatus(this.db, positionId, status);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async updatePositionAmount(positionId: string, amount: number): Promise<void> {
    await trackProcessPositionDb.UpdatePositionAmount(this.db, positionId, amount);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async openPosition(
    positionId: string,
    amount: number,
    startingPrice: number,
    openTime: string,
    signature: string,
    trackProcessId: string
  ): Promise<void> {
    await this.updateTpTransactions(
      trackProcessId,
      {
        signature,
        status: 'success',
        date: new Date(),
      },
      false
    );
    await trackProcessPositionDb.OpenPosition(this.db, positionId, amount, startingPrice, openTime);
    return new Promise((resolve) => {
      resolve();
    });
  }

  async closePosition(
    positionId: string,
    exitPrice: number,
    closeTime: string,
    signature: string,
    trackProcessId: string
  ): Promise<void> {
    console.log('Closing position');
    await trackProcessPositionDb.ClosePosition(this.db, positionId, exitPrice, closeTime);
    await this.updateTpTransactions(
      trackProcessId,
      {
        signature,
        status: 'success',
        date: new Date(),
      },
      false
    );
    return new Promise((resolve) => {
      resolve();
    });
  }

  viewTrackProcess(tp: string): void {
    this.viewedTrackProcess = tp;
  }

  sendUpdates(): void {
    if (this.viewedTrackProcess !== '' && this.trackProcesses.has(this.viewedTrackProcess)) {
      const tp = this.trackProcesses.get(this.viewedTrackProcess);
      const noTrackPositions = this.tpNoTrackPosition.get(this.viewedTrackProcess);
      const transactions = (this.tpTransactions.get(this.viewedTrackProcess) || []).sort((a, b) => {
        if (a.time === undefined && b.time !== undefined) {
          return -1;
        }
        if (a.time !== undefined && b.time === undefined) {
          return 1;
        }
        if (a.time !== undefined && b.time !== undefined) {
          return b.time.localeCompare(a.time);
        }
        return 0;
      });

      const newPositions = [...(tp?.gatherTradesUpdates() || []), ...(noTrackPositions || [])].sort((a, b) => {
        if (a.openTime === undefined && b.openTime !== undefined) {
          return -1;
        }
        if (a.openTime !== undefined && b.openTime === undefined) {
          return 1;
        }
        if (a.openTime !== undefined && b.openTime !== undefined) {
          return b.openTime.localeCompare(a.openTime);
        }
        return 0;
      });

      const newPools = tp?.gatherPoolsUpdates() || [];

      const profit = calculateProfitPCT(newPositions);
      try {
        if (this.window)
          sendToRenderer(this.window, CustomEvents.updateTrackProcessEvent, {
            updateType: 'processDataUpdate',
            positions: newPositions,
            pools: newPools,
            transactions: transactions,
            totalPct: profit.totalPct,
            netProfit: profit.netProfit,
          });
      } catch (error) {
        console.log('Error sending updates');
        console.log(error);
      }
    }
  }

  async updateTpNoTrackPositions(tp: string, position: any): Promise<void> {
    await this.noTrackPositionUpdateExecutor.enqueue(async () => {
      await this.removePool(tp, position.poolId);
      let currArr = this.tpNoTrackPosition.get(tp) || [];
      currArr.push(position);
      this.tpNoTrackPosition.set(tp, currArr);
    });
  }

  async updateTpTransactions(tp: string, transaction: any, isNew: boolean): Promise<void> {
    await this.transactionUpdateExecutor.enqueue(async () => {
      let currArr = this.tpTransactions.get(tp) || [];
      if (isNew) {
        currArr.push({
          ...transaction,
          from: transaction.wallet,
          time: transaction.date.toISOString(),
          date: transaction.date.toISOString(),
          wallet: transaction.wallet,
        });
        console.log('ADDING TRACK PROCESS TRANSACTION');
        await transactionsDb.insertTransaction(this.db, transaction);
        await trackProcessTransactionsDb.insertTrackProcessTransaction(this.db, {
          trackProcessId: tp,
          transactionSignature: transaction.signature,
        });
      } else {
        console.log('UPDATING TRACK PROCESS TRANSACTION');
        await transactionsDb.updateTransaction(this.db, transaction);
        currArr = currArr.map((tx) => {
          if (tx.signature === transaction.signature)
            return {
              ...tx,
              status: transaction.status,
              time: tx.date,
              from: tx.wallet,
              date: tx.date,
              wallet: tx.from,
            };
          else return tx;
        });
      }
      try {
        if (this.window)
          sendToRenderer(
            this.window,
            CustomEvents.transactionUpdateEvent,
            currArr.find((tx) => tx.signature === transaction.signature)
          );
      } catch {
        //nada
      }

      this.tpTransactions.set(tp, currArr);
      return new Promise((resolve) => {
        resolve();
      });
    });
  }

  async cleanUp(): Promise<void> {
    console.log('Cleaning up database');
    try {
      await trackProcessPoolDb.cleanUpPools(this.db);
      await trackProcessPositionDb.updateClosePendingPositions(this.db);
      await trackProcessPositionDb.cleanUpOpenFailPositions(this.db);
      await trackProcessPositionDb.cleanUpOpenPendingPositions(this.db);
      return new Promise((resolve) => {
        resolve();
      });
    } catch (error) {
      console.log('Error occured while cleaning up database.');
      console.log(error);
      return new Promise((resolve) => {
        resolve();
      });
    }
  }
}
