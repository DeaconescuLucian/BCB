import { BrowserWindow } from 'electron'
import handleWallet from './WalletHandler'

export function setupHandlers(mainWindow: BrowserWindow | null): void
{
    handleWallet(mainWindow);
}