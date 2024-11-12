import { app, BrowserWindow, Tray, Menu } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as remoteMain from '@electron/remote/main';
import * as electronReload from 'electron-reload';
import { fork, ChildProcess, execSync } from 'child_process';
import { registerHandler, sendToRenderer } from './ipcHandler';
import { setupHandlers } from './handlers';
import { ProcessType, ScriptConfig, verifyUniqueEvents, CustomEvents } from './events';
import sqlite3 from 'sqlite3';
import * as db from './database/db';
import * as transactionsDb from './database/transactions';
import { createConnection } from './solana/utils';
import { Connection } from '@solana/web3.js';
import * as connectionDb from './database/connections';
import TrackProcessManager from './solana/bot/trackProcessManager';

if (!verifyUniqueEvents(ProcessType)) {
  execSync('yarn run close-web-app');
  process.exit(1);
}

electronReload.default(__dirname, {});

let mainWindow: BrowserWindow | null;
let tray: Tray;
let dbConnection: sqlite3.Database;
let solanaConnection: Connection;
let tpm: TrackProcessManager;

remoteMain.initialize();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    minWidth: 1280,
    minHeight: 787,
    width: 1280,
    height: 787,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.setMenuBarVisibility(false);
  remoteMain.enable(mainWindow.webContents);
  mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow?.on('ready-to-show', () => {
    mainWindow?.show();
  });
  mainWindow?.on('show', async () => {
    try {
      const rows = await mainWindow?.webContents.executeJavaScript(`window.electron.invoke('get-latest-transactions')`);
      sendToRenderer(mainWindow, ProcessType.TRANSACTION.updateEvent, rows.data);
    } catch (error) {
      console.log('Error retrieving transaction history:', error);
    }
  });
}

function createTray(): void {
  const iconPath = path.join(__dirname, 'solana.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: async () => {
        if (mainWindow === null) {
          createWindow();
          try {
            tpm.updateWindow(mainWindow);
            const result = await connectionDb.getActiveConnection(dbConnection);
            if (result) solanaConnection = createConnection(result);
            setupHandlers(dbConnection, solanaConnection, mainWindow, tpm);
          } catch (error) {
            console.log(error);
          }
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Quit',
      click: async () => {
        await tpm.removeAll();
        execSync('yarn run close-web-app');
        db.closeConnection(dbConnection);
        process.exit(1);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Blockchain Busters');
}

function registerHandlers() {
  setupHandlers(dbConnection, solanaConnection, mainWindow, tpm);

  registerHandler(CustomEvents.getLatestTransactionsEvent, async () => {
    return new Promise((resolve, reject) => {
      transactionsDb.getLatestTransactions(dbConnection, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });
}

app.on('ready', async () => {
  createTray();
  createWindow();
  dbConnection = db.openConnection();
  try {
    await db.initDatabase(dbConnection);
    console.log('Database initialized successfully.');
    const result = await connectionDb.getActiveConnection(dbConnection);
    if (result) solanaConnection = createConnection(result);
    tpm = TrackProcessManager.getInstance(dbConnection, mainWindow);
    tpm.cleanUp();
    registerHandlers();
  } catch (err) {
    console.error('Error initializing database:', err);
    db.closeConnection(dbConnection);
    return;
  }
});

app.on('window-all-closed', (event: any) => {
  if (process.platform !== 'darwin') {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.hide();
    }
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
