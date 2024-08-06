const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const isDev = require("electron-is-dev");

const remoteMain = require('@electron/remote/main');

require('electron-reload')(__dirname, {
  // Optionally, you can specify more options here
  electron: require(`../node_modules/electron`)
});

let mainWindow;
remoteMain.initialize();

function createWindow() {
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
    }
  });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.setMenuBarVisibility(false);
  remoteMain.enable(mainWindow.webContents);
  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
