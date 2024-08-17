import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as remoteMain from '@electron/remote/main';
import * as electronReload from 'electron-reload';
import { fork, ChildProcess, exec } from 'child_process';
import { registerHandler, sendToRenderer } from './ipcHandler';
import { WatchWalletHandler } from './handlers/WalletHandler';

electronReload.default(__dirname, {});

let mainWindow: BrowserWindow | null;
let tray: Tray;

remoteMain.initialize();

let backgroundProcess: ChildProcess | null = null;

async function startBackgroundProcess(): Promise<string> {
  console.log('Entering startBackgroundProcess function');
  console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');

  if (backgroundProcess) {
    if (backgroundProcess.connected) {
      console.log('Background process is already running');
      return 'Process already started!';
    } else {
      console.log('Cleaning up disconnected background process');
      backgroundProcess = null;
    }
  }

  return new Promise((resolve, reject) => {
    console.log('Starting background process...');
    backgroundProcess = fork(path.join(__dirname, 'backgroundProcess.js'));

    const timeout = setTimeout(() => {
      console.log('Timeout reached, resolving without confirmation');
      resolve('Process started but no confirmation received');
    }, 5000);

    backgroundProcess.once('message', (message) => {
      if (message === 'ready') {
        console.log('Background process is ready, sending start command');
        backgroundProcess?.send('start');
        clearTimeout(timeout);
        resolve('Started process');
      }
    });

    backgroundProcess.on('error', (error) => {
      console.error('Background process error:', error);
      clearTimeout(timeout);
      backgroundProcess = null;
      reject(error);
    });

    backgroundProcess.on('exit', (code, signal) => {
      console.log(`Background process exited with code ${code} and signal ${signal}`);
      backgroundProcess = null;
    });

    backgroundProcess.on('message', (message) => {
      console.log('Received message in main process:', message);
      if (message !== 'ready') {
        console.log('Forwarding message to renderer:', message);
        sendToRenderer(mainWindow, 'background-update', message);
      }
    });
  });
}

async function stopBackgroundProcess(): Promise<string> {
  console.log('Entering stopBackgroundProcess function');
  console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');

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
    }, 1000);

    backgroundProcess?.once('exit', () => {
      console.log('Background process exited');
      clearTimeout(forceKillTimeout);
      backgroundProcess = null;
      resolve('Stopped process');
    });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    minWidth: 900,
    minHeight: 680,
    width: 900,
    height: 680,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);

  mainWindow.setMenuBarVisibility(false);
  remoteMain.enable(mainWindow.webContents);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
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
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        exec('yarn run close-web-app');
        if (backgroundProcess) {
          backgroundProcess.kill();
        }
        process.exit(1);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Blockchain Busters');
}

function registerHandlers() {
  registerHandler('start-background-process', async () => {
    console.log('start-background-process handler called');
    try {
      const result = await startBackgroundProcess();
      console.log('startBackgroundProcess result:', result);
      return result;
    } catch (error) {
      console.error('Error in startBackgroundProcess:', error);
      return 'error';
    }
  });

  WatchWalletHandler(mainWindow);

  registerHandler('stop-background-process', async () => {
    return await stopBackgroundProcess();
  });
}

app.on('ready', () => {
  createTray();
  createWindow();
  registerHandlers();
  startBackgroundProcess();
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
