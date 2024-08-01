const { contextBridge } = require('electron');
const { getCurrentWindow } = require('@electron/remote');

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
            window.destroy();
        }
    }
});