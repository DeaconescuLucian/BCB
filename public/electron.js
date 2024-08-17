"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const isDev = __importStar(require("electron-is-dev"));
const remoteMain = __importStar(require("@electron/remote/main"));
const electronReload = __importStar(require("electron-reload"));
const child_process_1 = require("child_process");
const ipcHandler_1 = require("./ipcHandler");
const WalletHandler_1 = require("./handlers/WalletHandler");
electronReload.default(__dirname, {});
let mainWindow;
let tray;
remoteMain.initialize();
let backgroundProcess = null;
function startBackgroundProcess() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Entering startBackgroundProcess function');
        console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');
        if (backgroundProcess) {
            if (backgroundProcess.connected) {
                console.log('Background process is already running');
                return 'Process already started!';
            }
            else {
                console.log('Cleaning up disconnected background process');
                backgroundProcess = null;
            }
        }
        return new Promise((resolve, reject) => {
            console.log('Starting background process...');
            backgroundProcess = (0, child_process_1.fork)(path.join(__dirname, 'backgroundProcess.js'));
            const timeout = setTimeout(() => {
                console.log('Timeout reached, resolving without confirmation');
                resolve('Process started but no confirmation received');
            }, 5000);
            backgroundProcess.once('message', (message) => {
                if (message === 'ready') {
                    console.log('Background process is ready, sending start command');
                    backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.send('start');
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
                    (0, ipcHandler_1.sendToRenderer)(mainWindow, 'background-update', message);
                }
            });
        });
    });
}
function stopBackgroundProcess() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Entering stopBackgroundProcess function');
        console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');
        if (!backgroundProcess) {
            console.log('No process running');
            return 'No process running';
        }
        return new Promise((resolve) => {
            console.log('Stopping background process...');
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.send('stop');
            const forceKillTimeout = setTimeout(() => {
                if (backgroundProcess && !backgroundProcess.killed) {
                    console.log('Force killing background process');
                    backgroundProcess.kill();
                    backgroundProcess = null;
                    resolve('Forcefully stopped process');
                }
            }, 1000);
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.once('exit', () => {
                console.log('Background process exited');
                clearTimeout(forceKillTimeout);
                backgroundProcess = null;
                resolve('Stopped process');
            });
        });
    });
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
function createTray() {
    const iconPath = path.join(__dirname, 'solana.png');
    tray = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow === null) {
                    createWindow();
                }
                else {
                    mainWindow.show();
                }
            },
        },
        {
            label: 'Quit',
            click: () => {
                (0, child_process_1.exec)('yarn run close-web-app');
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
    (0, ipcHandler_1.registerHandler)('start-background-process', () => __awaiter(this, void 0, void 0, function* () {
        console.log('start-background-process handler called');
        try {
            const result = yield startBackgroundProcess();
            console.log('startBackgroundProcess result:', result);
            return result;
        }
        catch (error) {
            console.error('Error in startBackgroundProcess:', error);
            return 'error';
        }
    }));
    (0, WalletHandler_1.WatchWalletHandler)(mainWindow);
    (0, ipcHandler_1.registerHandler)('stop-background-process', () => __awaiter(this, void 0, void 0, function* () {
        return yield stopBackgroundProcess();
    }));
}
electron_1.app.on('ready', () => {
    createTray();
    createWindow();
    registerHandlers();
    startBackgroundProcess();
});
electron_1.app.on('window-all-closed', (event) => {
    if (process.platform !== 'darwin') {
        event.preventDefault();
        if (mainWindow) {
            mainWindow.hide();
        }
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
    else {
        mainWindow.show();
    }
});
