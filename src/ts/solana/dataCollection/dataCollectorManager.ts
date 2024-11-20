import DataCollector from './dataCollector';
import sqlite3 from 'sqlite3';
import { sendToRenderer } from '../../ipcHandler';
import { CustomEvents } from '../../events';
import { BrowserWindow } from 'electron';
import { SequentialExecutor } from '../../sequentialExecutor';
import * as dbDataCollectPools from '../../database/dataCollection/dataCollectPools';
import * as dbDataCollectPoolPrices from '../../database/dataCollection/dataCollectPoolPrices';
import * as dbDataCollectPoolFilters from '../../database/dataCollection/dataCollectPoolFilters';

export interface IDataCollectorManager {
  dataCollectors: Map<string, DataCollector>;
  db: sqlite3.Database;
  window: BrowserWindow | null;
  viewedDataCollector: string;
  updateTimeout: NodeJS.Timeout | null;
  dcNoTrackPool: Map<string, any[]>;
  register(id: string, dataCollector: DataCollector, noTrackPools: any[]): void;
  remove(id: string): void;
  removeAll(): void;
  saveTrackedPool(pool: any, dataCollectorId: string, filters: any[]): Promise<void>;
  viewDataCollector(tp: string): void;
  updateDcNoTrackPools(dc: string, position: any): void;
  updateWindow(window: BrowserWindow | null): void;
}

export default class DataCollectorManager implements IDataCollectorManager {
  private static instance: DataCollectorManager;
  dataCollectors: Map<string, DataCollector>;
  db: sqlite3.Database;
  window: BrowserWindow | null;
  viewedDataCollector: string;
  updateTimeout: NodeJS.Timeout | null;
  dcNoTrackPool: Map<string, any[]>;
  private poolUpdateExecutor = new SequentialExecutor();

  private constructor(db: sqlite3.Database, window: BrowserWindow | null) {
    this.dataCollectors = new Map<string, DataCollector>();
    this.db = db;
    this.window = window;
    this.viewedDataCollector = '';
    this.dcNoTrackPool = new Map<string, any[]>();
    this.updateTimeout = setInterval(() => {
      this.sendUpdates();
    }, 3000);
  }

  public static getInstance(db?: sqlite3.Database, window?: BrowserWindow | null): DataCollectorManager {
    if (!DataCollectorManager.instance) {
      DataCollectorManager.instance = new DataCollectorManager(db!, window!);
    }
    return DataCollectorManager.instance;
  }

  updateWindow(window: BrowserWindow | null): void {
    this.window = window;
  }

  register(id: string, dataCollector: DataCollector, noTrackPools: any[]): void {
    try {
      this.dataCollectors.set(id, dataCollector);
      this.dcNoTrackPool.set(id, noTrackPools);
    } catch (error) {
      console.error(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.dataCollectors.get(id)?.stopProcess();
    this.dataCollectors.delete(id);
    return;
  }

  removeAll(): void {
    this.dataCollectors.forEach(async (dataCollector) => await dataCollector.stopProcess());
    this.dataCollectors.clear();
    if (this.updateTimeout) clearInterval(this.updateTimeout);
  }

  async saveTrackedPool(pool: any, dataCollectorId: string, filters: any[]): Promise<void> {
    console.log('Saving pool...');
    await dbDataCollectPools.insertDataCollectProcessPool(this.db, { ...pool, dataCollectProcessId: dataCollectorId });
    await dbDataCollectPoolFilters.insertPoolFilters(this.db, filters.map(f => {
      return {
        ...f,
        dataCollectProcessId: dataCollectorId,
        poolId: pool.poolId
      }
    }));
    return new Promise((resolve) => {
      resolve();
    });
  }

  async persistPoolCurrentPrice(dataCollectorId: string, poolId: string, price: number, date: Date): Promise<void> {
    await dbDataCollectPoolPrices.insertDataCollectProcessPoolPrice(this.db, {
      dataCollectProcessId: dataCollectorId,
      poolId,
      price,
      date: date.toISOString()
    }) 
    return new Promise((resolve) => {
      resolve();
    });
  }

  viewDataCollector(tp: string): void {
    this.viewedDataCollector = tp;
  }

  sendUpdates(): void {
    if (this.viewedDataCollector !== '' && this.dataCollectors.has(this.viewedDataCollector)) {
      const dc = this.dataCollectors.get(this.viewedDataCollector);
      const noTrackPools = this.dcNoTrackPool.get(this.viewedDataCollector);

      const newPools = [...(dc?.gatherPoolsUpdates() || []), ...(noTrackPools || [])];
      try {
        sendToRenderer(this.window, CustomEvents.updateDataCollectProcessEvent, {
          updateType: 'dataCollectorDataUpdate',
          pools: newPools,
        });
      } catch (error) {
        console.log('Error sending updates');
        console.log(error);
        console.log(newPools);
      }
    }
  }

  async updateDcNoTrackPools(dc: string, pool: any): Promise<void> {
    await this.poolUpdateExecutor.enqueue(async () => {
      let currArr = this.dcNoTrackPool.get(dc) || [];
      currArr.push(pool);
      this.dcNoTrackPool.set(dc, currArr);
    });
  }

  async cleanUp(): Promise<void> {
    console.log('Cleaning up database');
    try {
      //   await trackProcessPoolDb.cleanUpPools(this.db);
      //   await trackProcessPositionDb.updateClosePendingPositions(this.db);
      //   await trackProcessPositionDb.cleanUpOpenFailPositions(this.db);
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
