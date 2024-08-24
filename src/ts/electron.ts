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

if (!verifyUniqueEvents(ProcessType)) {
  execSync('yarn run close-web-app');
  process.exit(1);
}

electronReload.default(__dirname, {});

let mainWindow: BrowserWindow | null;
let tray: Tray;
let dbConnection: sqlite3.Database;
let solanaConnection: Connection;

remoteMain.initialize();

type ProcessObject = {
  process: ChildProcess | null;
  pid: number | undefined;
  type: string | undefined;
};

let mainBackgroundProcess: ChildProcess | null = null;
let secondaryBackgroundProcesses: ProcessObject[] = [];

async function startBackgroundProcess(
  backgroundProcess: ChildProcess | null,
  processType: ScriptConfig,
  pid?: number
): Promise<{ message: string; pid: number | undefined }> {
  console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');

  if (backgroundProcess) {
    if (backgroundProcess.connected) {
      console.log('Background process is already running');
      return { message: 'Process already started!', pid: pid };
    } else {
      console.log('Cleaning up disconnected background process');
      backgroundProcess = null;
    }
  }

  return new Promise((resolve, reject) => {
    console.log('Starting background process...');
    if (processType !== ProcessType.MAIN) {
      if (
        (pid && secondaryBackgroundProcesses.find((e) => e.pid === pid)) ||
        (secondaryBackgroundProcesses.find((e) => e.type === 'transaction') && processType.type === 'transaction') ||
        (secondaryBackgroundProcesses.find((e) => e.type === 'wallet') && processType.type === 'wallet')
      ) {
        console.log(`Process ${pid} already started!`);
        resolve({ message: `Process ${pid} already started!`, pid: pid });
      } else {
        backgroundProcess = fork(path.join(`${__dirname}/background-processes`, processType.file));
        secondaryBackgroundProcesses.push({
          process: backgroundProcess,
          pid: backgroundProcess?.pid,
          type: processType.type,
        });
        registerHandler(processType.stopEvent, async () => {
          await stopBackgroundProcess(backgroundProcess);
        });
      }
    } else {
      backgroundProcess = fork(path.join(`${__dirname}/background-processes`, processType.file));
    }

    const timeout = setTimeout(() => {
      console.log('Timeout reached, resolving without confirmation');
      resolve({ message: 'Process started but no confirmation received', pid: undefined });
    }, 5000);

    backgroundProcess?.once('message', (message) => {
      if (message === 'ready') {
        console.log('Background process is ready, sending start command');
        if (!pid) {
          backgroundProcess?.send({ type: 'init'});
          backgroundProcess?.send('start');
        }
        clearTimeout(timeout);
        resolve({ message: `Started process ${pid ?? backgroundProcess?.pid}.`, pid: pid ?? backgroundProcess?.pid });
      }
    });

    backgroundProcess?.on('error', (error) => {
      console.error('Background process error:', error);
      clearTimeout(timeout);
      backgroundProcess = null;
      reject(error);
    });

    backgroundProcess?.on('exit', (code, signal) => {
      console.log(`Background process exited with code ${code} and signal ${signal}`);
      backgroundProcess = null;
    });

    backgroundProcess?.on('message', (message) => {
      if (message !== 'ready') {
        if (processType.type === 'transaction') {
          transactionsDb.insertTransaction(dbConnection, message);
        }
        if (mainWindow?.isVisible()) {
          sendToRenderer(mainWindow, processType.updateEvent, message);
        }
      }
    });
  });
}

async function stopBackgroundProcess(backgroundProcess: ChildProcess | null): Promise<string> {
  console.log('Entering stopBackgroundProcess function');
  console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');
  const pid = backgroundProcess?.pid;

  if (!backgroundProcess) {
    console.log('No process running');
    return 'No process running';
  }

  return new Promise((resolve) => {
    console.log('Stopping background process...');
    backgroundProcess?.send('stop');

    const forceKillTimeout = setTimeout(() => {
      if (backgroundProcess && !backgroundProcess.killed) {
        console.log('Force killing background process');
        backgroundProcess.kill();
        backgroundProcess = null;
        resolve('Forcefully stopped process');
      }
      secondaryBackgroundProcesses = secondaryBackgroundProcesses.filter((e) => e.pid === pid);
    }, 1000);

    backgroundProcess?.once('exit', () => {
      console.log('Background process exited');
      clearTimeout(forceKillTimeout);
      backgroundProcess = null;
      resolve('Stopped process');
    });
    resolve(`Stopped process ${pid}`);
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    minWidth: 1156,
    minHeight: 680,
    width: 1156,
    height: 680,
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
      click: () => {
        if (mainWindow === null) {
          createWindow();
          setupHandlers(mainWindow, dbConnection, solanaConnection);
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        execSync('yarn run close-web-app');
        secondaryBackgroundProcesses.forEach((pr) => {
          pr.process?.kill();
          console.log(`Process ${pr.pid} stopped.`);
        });
        if (mainBackgroundProcess) {
          mainBackgroundProcess.kill();
          console.log('Main process stopped.');
        }
        db.closeConnection(dbConnection);
        process.exit(1);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Blockchain Busters');
}

function registerHandlers() {
  registerHandler('start-background-process', async () => {
    try {
      const result = await startBackgroundProcess(mainBackgroundProcess, ProcessType.MAIN);
      return result;
    } catch (error) {
      console.error('Error in startBackgroundProcess:', error);
      return 'error';
    }
  });

  setupHandlers(mainWindow, dbConnection, solanaConnection);

  registerHandler(ProcessType.MAIN.stopEvent, async () => {
    return await stopBackgroundProcess(mainBackgroundProcess);
  });

  registerHandler(ProcessType.WALLET.startEvent, async (e: any, arg: number) => {
    return await startBackgroundProcess(null, ProcessType.WALLET, arg);
  });

  registerHandler(ProcessType.TRANSACTION.startEvent, async (e: any, arg: number) => {
    return await startBackgroundProcess(null, ProcessType.TRANSACTION, arg);
  });

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
  solanaConnection = createConnection();
  dbConnection = db.openConnection();
  try {
    await db.initDatabase(dbConnection);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    db.closeConnection(dbConnection);
    return;
  }

  registerHandlers();
  startBackgroundProcess(mainBackgroundProcess, ProcessType.MAIN);
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
