import { registerHandler } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';
import * as connectionDb from '../database/connections';
import { updateSolanaConnection, testConnection } from '../solana/connection';
import { BrowserWindow } from 'electron';

const CreateConnectionHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.createConnectionEvent, async (e: any, arg: any) => {
    const valabileConnection = await testConnection(arg);
    return new Promise((resolve) => {
      if (valabileConnection)
        connectionDb.insertConnection(db, arg, (result: any) => {
          resolve(result);
        });
      else resolve({ error: 'Invalid connection string;' });
    });
  });
};

const GetConnectionsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getConnectionsEvent, async () => {
    return new Promise((resolve, reject) => {
      connectionDb.getConnections(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const connections = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(connections);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const UpdateActiveConnectionHandler = (db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null) => {
  registerHandler(CustomEvents.updateActiveConnectionEvent, async (e: any, arg: any) => {
    return new Promise((resolve) => {
      connectionDb.updateActiveConnection(db, arg, (result: any) => {
        if (!result) {
          try {
            updateSolanaConnection(db, solanaConnection, mainWindow, arg);
          } catch (error) {
            console.log(error);
          }
        }
        resolve(result);
      });
    });
  });
};

const DeleteConnectionHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.deleteConnectionEvent, async (e: any, arg: string) => {
    return new Promise((resolve) => {
      connectionDb.deleteConnection(db, arg, (result: any) => {
        resolve(result);
      });
    });
  });
};

const handleConnection = (db: sqlite3.Database, solanaConnection: Connection, mainWindow: BrowserWindow | null) => {
  CreateConnectionHandler(db);
  GetConnectionsHandler(db);
  UpdateActiveConnectionHandler(db, solanaConnection, mainWindow);
  DeleteConnectionHandler(db);
};

export default handleConnection;
