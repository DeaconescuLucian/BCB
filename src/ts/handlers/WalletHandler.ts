import { BrowserWindow } from 'electron';
import { registerHandler, sendToRenderer } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';
import { CustomEvents } from '../events';

const ImportWalletHandler = (mainWindow: BrowserWindow | null) => {
  registerHandler(CustomEvents.importWalletEvent, async (e: any, arg: string) => {
    try {
      const key = importKeypair(arg);
      if (mainWindow) sendToRenderer(mainWindow, CustomEvents.walletImportedEvent, key?.pub);
    } catch (error) {
      console.error('Error in ImportWalletHandler:', error);
      return 'error';
    }
  });
};

const GenerateWalletHandler = (mainWindow: BrowserWindow | null) => {
  registerHandler(CustomEvents.generateWalletEvent, async () => {
    try {
      const key = generateWallet();
      if (mainWindow) sendToRenderer(mainWindow, CustomEvents.walletGeneratedEvent, JSON.stringify(key));
    } catch (error) {
      console.error('Error in GenerateWalletHandler:', error);
      return 'error';
    }
  });
};

const handleWallet = (mainWindow: BrowserWindow | null) => {
  ImportWalletHandler(mainWindow);
  GenerateWalletHandler(mainWindow);
}

export default handleWallet;
