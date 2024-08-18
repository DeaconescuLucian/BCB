import { BrowserWindow } from 'electron';
import { registerHandler, sendToRenderer } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';

const ImportWalletHandler = (mainWindow: BrowserWindow | null) => {
  registerHandler('import-wallet', async (e: any, arg: string) => {
    try {
      const key = importKeypair(arg);
      if (mainWindow) sendToRenderer(mainWindow, 'wallet-imported', key?.pub);
    } catch (error) {
      console.error('Error in ImportWalletHandler:', error);
      return 'error';
    }
  });
};

const GenerateWalletHandler = (mainWindow: BrowserWindow | null) => {
  registerHandler('generate-wallet', async () => {
    try {
      const key = generateWallet();
      console.log(key)
      if (mainWindow) sendToRenderer(mainWindow, 'wallet-generated', JSON.stringify(key));
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
