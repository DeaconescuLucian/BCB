const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;

const path = require("path");
const isDev = require("electron-is-dev");

const remoteMain = require('@electron/remote/main');

require('electron-reload')(__dirname, {
  // Optionally, you can specify more options here
  electron: require(`../node_modules/electron`)
});

let mainWindow;
let tray;
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
  mainWindow.on("closed", () => { mainWindow = null; });
}

function createTray() {
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
        process.exit(1);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Blockchain Busters');
}

app.on("ready", () => {
  createTray();
  createWindow();
});

app.on("window-all-closed", (event) => {
  if (process.platform !== "darwin") {
    event.preventDefault();
    mainWindow.hide();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
