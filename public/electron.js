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
const handlers_1 = require("./handlers");
const events_1 = require("./events");
const db = __importStar(require("./database/db"));
const transactionsDb = __importStar(require("./database/transactions"));
const utils_1 = require("./solana/utils");
const connectionDb = __importStar(require("./database/connections"));
if (!(0, events_1.verifyUniqueEvents)(events_1.ProcessType)) {
    (0, child_process_1.execSync)('yarn run close-web-app');
    process.exit(1);
}
electronReload.default(__dirname, {});
let mainWindow;
let tray;
let dbConnection;
let solanaConnection;
remoteMain.initialize();
let mainBackgroundProcess = null;
let secondaryBackgroundProcesses = [];
function startBackgroundProcess(backgroundProcess, processType, pid) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');
        if (backgroundProcess) {
            if (backgroundProcess.connected) {
                console.log('Background process is already running');
                return { message: 'Process already started!', pid: pid };
            }
            else {
                console.log('Cleaning up disconnected background process');
                backgroundProcess = null;
            }
        }
        return new Promise((resolve, reject) => {
            console.log('Starting background process...');
            if (processType !== events_1.ProcessType.MAIN) {
                if ((pid && secondaryBackgroundProcesses.find((e) => e.pid === pid)) ||
                    (secondaryBackgroundProcesses.find((e) => e.type === 'transaction') && processType.type === 'transaction')) {
                    console.log(`Process ${pid} already started!`);
                    resolve({ message: `Process ${pid} already started!`, pid: pid });
                }
                else {
                    backgroundProcess = (0, child_process_1.fork)(path.join(`${__dirname}/background-processes`, processType.file));
                    secondaryBackgroundProcesses.push({
                        process: backgroundProcess,
                        pid: backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.pid,
                        type: processType.type,
                    });
                    (0, ipcHandler_1.registerHandler)(processType.stopEvent, () => __awaiter(this, void 0, void 0, function* () {
                        yield stopBackgroundProcess(backgroundProcess);
                    }));
                }
            }
            else {
                backgroundProcess = (0, child_process_1.fork)(path.join(`${__dirname}/background-processes`, processType.file));
            }
            const timeout = setTimeout(() => {
                console.log('Timeout reached, resolving without confirmation');
                resolve({ message: 'Process started but no confirmation received', pid: undefined });
            }, 5000);
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.once('message', (message) => {
                if (message === 'ready') {
                    console.log('Background process is ready, sending start command');
                    if (!pid) {
                        //backgroundProcess?.send({ type: 'init'});
                        backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.send('start');
                    }
                    clearTimeout(timeout);
                    resolve({ message: `Started process ${pid !== null && pid !== void 0 ? pid : backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.pid}.`, pid: pid !== null && pid !== void 0 ? pid : backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.pid });
                }
            });
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.on('error', (error) => {
                console.error('Background process error:', error);
                clearTimeout(timeout);
                backgroundProcess = null;
                reject(error);
            });
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.on('exit', (code, signal) => {
                console.log(`Background process exited with code ${code} and signal ${signal}`);
                backgroundProcess = null;
            });
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.on('message', (message) => {
                if (message !== 'ready') {
                    if (processType.type === 'transaction') {
                        transactionsDb.insertTransaction(dbConnection, message);
                    }
                    if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                        (0, ipcHandler_1.sendToRenderer)(mainWindow, processType.updateEvent, message);
                    }
                }
            });
        });
    });
}
function stopBackgroundProcess(backgroundProcess) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Entering stopBackgroundProcess function');
        console.log('Current backgroundProcess state:', backgroundProcess ? 'exists' : 'null');
        const pid = backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.pid;
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
                secondaryBackgroundProcesses = secondaryBackgroundProcesses.filter((e) => e.pid === pid);
            }, 1000);
            backgroundProcess === null || backgroundProcess === void 0 ? void 0 : backgroundProcess.once('exit', () => {
                console.log('Background process exited');
                clearTimeout(forceKillTimeout);
                backgroundProcess = null;
                resolve('Stopped process');
            });
            resolve(`Stopped process ${pid}`);
        });
    });
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.on('ready-to-show', () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.on('show', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const rows = yield (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.executeJavaScript(`window.electron.invoke('get-latest-transactions')`));
            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, rows.data);
        }
        catch (error) {
            console.log('Error retrieving transaction history:', error);
        }
    }));
}
function createTray() {
    const iconPath = path.join(__dirname, 'solana.png');
    tray = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => __awaiter(this, void 0, void 0, function* () {
                if (mainWindow === null) {
                    createWindow();
                    try {
                        const result = yield connectionDb.getActiveConnection(dbConnection);
                        if (result)
                            solanaConnection = (0, utils_1.createConnection)(result);
                        (0, handlers_1.setupHandlers)(dbConnection, solanaConnection);
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                else {
                    mainWindow.show();
                }
            }),
        },
        {
            label: 'Quit',
            click: () => {
                (0, child_process_1.execSync)('yarn run close-web-app');
                secondaryBackgroundProcesses.forEach((pr) => {
                    var _a;
                    (_a = pr.process) === null || _a === void 0 ? void 0 : _a.kill();
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
    (0, ipcHandler_1.registerHandler)('start-background-process', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield startBackgroundProcess(mainBackgroundProcess, events_1.ProcessType.MAIN);
            return result;
        }
        catch (error) {
            console.error('Error in startBackgroundProcess:', error);
            return 'error';
        }
    }));
    (0, handlers_1.setupHandlers)(dbConnection, solanaConnection);
    (0, ipcHandler_1.registerHandler)(events_1.ProcessType.MAIN.stopEvent, () => __awaiter(this, void 0, void 0, function* () {
        return yield stopBackgroundProcess(mainBackgroundProcess);
    }));
    // registerHandler(ProcessType.WALLET.startEvent, async (e: any, arg: number) => {
    //   return await startBackgroundProcess(null, ProcessType.WALLET, arg);
    // });
    (0, ipcHandler_1.registerHandler)(events_1.ProcessType.TRANSACTION.startEvent, (e, arg) => __awaiter(this, void 0, void 0, function* () {
        return yield startBackgroundProcess(null, events_1.ProcessType.TRANSACTION, arg);
    }));
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getLatestTransactionsEvent, () => __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            transactionsDb.getLatestTransactions(dbConnection, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }));
}
electron_1.app.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    createTray();
    createWindow();
    dbConnection = db.openConnection();
    try {
        yield db.initDatabase(dbConnection);
        console.log('Database initialized successfully.');
        const result = yield connectionDb.getActiveConnection(dbConnection);
        if (result)
            solanaConnection = (0, utils_1.createConnection)(result);
    }
    catch (err) {
        console.error('Error initializing database:', err);
        db.closeConnection(dbConnection);
        return;
    }
    registerHandlers();
    startBackgroundProcess(mainBackgroundProcess, events_1.ProcessType.MAIN);
}));
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
