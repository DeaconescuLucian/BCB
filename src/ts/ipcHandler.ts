import { ipcMain } from 'electron';
import { BrowserWindow } from 'electron';

type IPCHandler = (event: Electron.IpcMainEvent, ...args: any[]) => any | Promise<any>;

const handlers: { [key: string]: IPCHandler } = {};

export function registerHandler(channel: string, handler: IPCHandler) {
  if (handlers[channel]) {
    console.warn(`Handler for channel "${channel}" already exists. Overwriting.`);
    ipcMain.removeAllListeners(channel);
  }
  handlers[channel] = handler;
  ipcMain.on(channel, async (event, ...args) => {
    try {
      const result = await handler(event, ...args);
      event.reply(`${channel}-response`, { success: true, data: result });
    } catch (error:any) {
      event.reply(`${channel}-response`, { success: false, error: error.message });
    }
  });
}

export function sendToRenderer(window: BrowserWindow | null, channel?: string, ...args: any[]) {
  if (window) {
    if (channel) window.webContents.send(channel, ...args);
  }
}
