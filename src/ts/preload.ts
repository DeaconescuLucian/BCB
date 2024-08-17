// @ts-nocheck
import { contextBridge, ipcRenderer } from "electron";
import { getCurrentWindow } from "@electron/remote";

contextBridge.exposeInMainWorld('electron', {
    minimizeWindow: () => {
        const window = getCurrentWindow();
        if (window) {
            window.minimize();
        }
    },
    maximizeWindow: () => {
        const window = getCurrentWindow();
        if (window) {
            window.maximize();
        }
    },
    unmaximizeWindow: () => {
        const window = getCurrentWindow();
        if (window) {
            window.unmaximize();
        }
    },
    closeWindow: () => {
        const window = getCurrentWindow();
        if (window) {
            window.close();
            window.destroy();
        }
    },
    invoke: (channel: string, ...args: any[]) => {
    return new Promise((resolve) => {
        ipcRenderer.send(channel, ...args);
        ipcRenderer.once(`${channel}-response`, (_, response) => {
        resolve(response);
        });
    });
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_: any, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
        ipcRenderer.removeListener(channel, subscription);
    };
    },
});