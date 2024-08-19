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
const ipcHandler_1 = require("../ipcHandler");
const wallet_1 = require("../solana/wallet");
const events_1 = require("../events");
const ImportWalletHandler = (mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.importWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const key = (0, wallet_1.importKeypair)(arg);
            if (mainWindow)
                (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.CustomEvents.walletImportedEvent, key === null || key === void 0 ? void 0 : key.pub);
        }
        catch (error) {
            console.error('Error in ImportWalletHandler:', error);
            return 'error';
        }
    }));
};
const GenerateWalletHandler = (mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.generateWalletEvent, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const key = (0, wallet_1.generateWallet)();
            if (mainWindow)
                (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.CustomEvents.walletGeneratedEvent, JSON.stringify(key));
        }
        catch (error) {
            console.error('Error in GenerateWalletHandler:', error);
            return 'error';
        }
    }));
};
const handleWallet = (mainWindow) => {
    ImportWalletHandler(mainWindow);
    GenerateWalletHandler(mainWindow);
};
exports.default = handleWallet;
