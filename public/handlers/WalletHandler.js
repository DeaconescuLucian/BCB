"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchWalletHandler = void 0;
const ipcHandler_1 = require("../ipcHandler");
const wallet_1 = require("../solana/wallet");
const WatchWalletHandler = (mainWindow) => {
    (0, ipcHandler_1.registerHandler)('watch-wallet', (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Watch Wallet Called');
        try {
            return new Promise((resolve) => {
                const key = (0, wallet_1.generateWallet)().pub;
                if (mainWindow)
                    (0, ipcHandler_1.sendToRenderer)(mainWindow, 'started-watching-wallet', 'ceva');
                resolve('ceva');
            });
        }
        catch (error) {
            console.error('Error in startBackgroundProcess:', error);
            return 'error';
        }
    }));
};
exports.WatchWalletHandler = WatchWalletHandler;
