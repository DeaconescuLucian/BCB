import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import { setupHandlers } from '../handlers';
import sqlite3 from 'sqlite3';
import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

export function updateSolanaConnection(dbConnection: sqlite3.Database, connection: Connection, mainProcess: ChildProcess | null, mainWindow: BrowserWindow | null,  newConnection: string) {
  if (newConnection.startsWith('http')) connection = new Connection(newConnection);
  else connection = new Connection(clusterApiUrl(newConnection as Cluster), 'confirmed');

  setupHandlers(dbConnection, connection, mainProcess, mainWindow);
}

export async function testConnection(connectionString: string) {
  try {
    let connection;
    if (connectionString.startsWith('http')) connection = new Connection(connectionString);
    else connection = new Connection(clusterApiUrl(connectionString as Cluster), 'confirmed');
    const latestBlockhash = await connection.getLatestBlockhash();
    
    return true;
  } catch (error) {
    return false;
  }
}
