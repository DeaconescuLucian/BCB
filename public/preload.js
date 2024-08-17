"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const electron_1 = require("electron");
const remote_1 = require("@electron/remote");
electron_1.contextBridge.exposeInMainWorld('electron', {
    minimizeWindow: () => {
        const window = (0, remote_1.getCurrentWindow)();
        if (window) {
            window.minimize();
        }
    },
    maximizeWindow: () => {
        const window = (0, remote_1.getCurrentWindow)();
        if (window) {
            window.maximize();
        }
    },
    unmaximizeWindow: () => {
        const window = (0, remote_1.getCurrentWindow)();
        if (window) {
            window.unmaximize();
        }
    },
    closeWindow: () => {
        const window = (0, remote_1.getCurrentWindow)();
        if (window) {
            window.close();
            window.destroy();
        }
    },
    invoke: (channel, ...args) => {
        return new Promise((resolve) => {
            electron_1.ipcRenderer.send(channel, ...args);
            electron_1.ipcRenderer.once(`${channel}-response`, (_, response) => {
                resolve(response);
            });
        });
    },
    on: (channel, callback) => {
        const subscription = (_, ...args) => callback(...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    },
});
