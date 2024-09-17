"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const events_1 = require("../events");
const transactions_1 = require("../solana/transactions");
const wallets_1 = require("../database/wallets");
const wallet_1 = require("../solana/wallet");
const transactionsDb = __importStar(require("../database/transactions"));
const utils_1 = require("../solana/utils");
const SwapHandler = (solanaConnection, db, mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.swapEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let response = null;
            const wallet = yield (0, wallets_1.getWalletSecret)(db, arg.params.wallet);
            if (wallet) {
                const keyPair = (0, wallet_1.getKeyPairFromSecret)(wallet.secretKey);
                if (keyPair) {
                    response = yield (0, transactions_1.swapWithRaydiumAPI)(solanaConnection, arg.params.wallet, arg.params.mintA, arg.params.mintB, arg.simulate, arg.params.amount, keyPair, arg.fees, arg.slippage);
                    const prices = yield (0, utils_1.getTokensPrice)([arg.params.mintA, 'So11111111111111111111111111111111111111112']);
                    const solanaAmount = arg.params.amount * (prices[arg.params.mintA] / prices['So11111111111111111111111111111111111111112']);
                    if (!arg.simulate) {
                        if (response.status === 'success') {
                            const transaction = {
                                signature: response.signature,
                                wallet: arg.params.wallet,
                                value: solanaAmount,
                                date: new Date(),
                                status: 'pending',
                            };
                            transactionsDb.insertTransaction(db, transaction);
                            if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, transaction);
                            }
                            if (response.confirmation) {
                                response.confirmation.then((msg) => {
                                    console.log('Transaction confirmed successfully');
                                    let data = {
                                        signature: transaction.signature,
                                        wallet: arg.params.wallet,
                                        status: msg.status,
                                        date: transaction.date,
                                        value: solanaAmount,
                                    };
                                    transactionsDb.updateTransaction(db, data);
                                    if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                        (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, data);
                                    }
                                });
                            }
                        }
                    }
                }
            }
            return {
                status: response.status,
                message: response === null || response === void 0 ? void 0 : response.message,
                error: response === null || response === void 0 ? void 0 : response.error,
            };
        }
        catch (e) {
            console.log('exceptie aici');
            console.log(e);
        }
    }));
};
const WrapHandler = (solanaConnection, db, mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.wrapEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        let response = null;
        const wallet = yield (0, wallets_1.getWalletSecret)(db, arg.wallet);
        if (wallet) {
            const keyPair = (0, wallet_1.getKeyPairFromSecret)(wallet.secretKey);
            if (keyPair) {
                response = yield (0, transactions_1.wrapSol)(keyPair, arg.amount, solanaConnection, arg.simulate);
                if (!arg.simulate) {
                    if (response.status === 'success') {
                        const transaction = {
                            signature: response.signature,
                            wallet: arg.wallet,
                            value: Number(response.amount),
                            date: new Date(),
                            status: 'pending',
                        };
                        transactionsDb.insertTransaction(db, transaction);
                        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, Object.assign(Object.assign({}, transaction), { date: transaction.date.toISOString() }));
                        }
                        if (response.confirmation) {
                            response.confirmation.then((msg) => {
                                console.log('Transaction confirmed successfully');
                                let data = {
                                    signature: transaction.signature,
                                    wallet: arg.wallet,
                                    status: msg.status,
                                    date: transaction.date,
                                    value: Number(transaction.value),
                                };
                                transactionsDb.updateTransaction(db, data);
                                if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                    (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, Object.assign(Object.assign({}, data), { date: data.date.toISOString() }));
                                }
                            });
                        }
                    }
                }
            }
        }
        return {
            status: response.status,
            message: response === null || response === void 0 ? void 0 : response.message,
            error: response === null || response === void 0 ? void 0 : response.error,
        };
    }));
};
const UnwrapHandler = (solanaConnection, db, mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.unwrapEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        let response = null;
        const wallet = yield (0, wallets_1.getWalletSecret)(db, arg.wallet);
        if (wallet) {
            const keyPair = (0, wallet_1.getKeyPairFromSecret)(wallet.secretKey);
            if (keyPair) {
                response = yield (0, transactions_1.unwrapSol)(keyPair, solanaConnection, arg.amount, arg.simulate);
                if (!arg.simulate) {
                    if (response.status === 'success') {
                        const transaction = {
                            signature: response.signature,
                            wallet: arg.wallet,
                            value: Number(response.amount),
                            date: new Date(),
                            status: 'pending',
                        };
                        transactionsDb.insertTransaction(db, transaction);
                        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, Object.assign(Object.assign({}, transaction), { date: new Date().toISOString() }));
                        }
                        if (response.confirmation) {
                            response.confirmation.then((msg) => {
                                console.log('Transaction confirmed successfully');
                                let data = {
                                    signature: transaction.signature,
                                    wallet: arg.wallet,
                                    status: msg.status,
                                    date: transaction.date,
                                    value: Number(transaction.value),
                                };
                                transactionsDb.updateTransaction(db, data);
                                if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                    (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, Object.assign(Object.assign({}, data), { date: transaction.date.toISOString() }));
                                }
                            });
                        }
                    }
                }
            }
        }
        return {
            status: response.status,
            message: response === null || response === void 0 ? void 0 : response.message,
            error: response === null || response === void 0 ? void 0 : response.error,
        };
    }));
};
const handleTransaction = (db, solanaConnection, mainWindow) => {
    SwapHandler(solanaConnection, db, mainWindow);
    WrapHandler(solanaConnection, db, mainWindow);
    UnwrapHandler(solanaConnection, db, mainWindow);
};
exports.default = handleTransaction;
