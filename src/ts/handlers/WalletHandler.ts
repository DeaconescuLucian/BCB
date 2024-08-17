import { BrowserWindow } from 'electron';
import { registerHandler, sendToRenderer } from '../ipcHandler';
import { importKeypair } from '../solana/wallet';

export const WatchWalletHandler = (mainWindow: BrowserWindow | null) => {
  registerHandler('watch-wallet', async (e: any, arg: string) => {
    console.log('Watch Wallet Called');
    try {
      return new Promise((resolve) => {
        const key = importKeypair(arg);
        if (mainWindow) sendToRenderer(mainWindow, 'started-watching-wallet', key?.pub);
        resolve('ceva');
      });
    } catch (error) {
      console.error('Error in startBackgroundProcess:', error);
      return 'error';
    }
  });
};
