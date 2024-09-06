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
const web3_js_1 = require("@solana/web3.js");
const transactions_1 = require("../solana/transactions");
const wallets_1 = require("../database/wallets");
const wallet_1 = require("../solana/wallet");
const transactionsDb = __importStar(require("../database/transactions"));
const connectionDb = __importStar(require("../database/connections"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
let _poolKeys = [];
const BuyHandler = (solanaConnection, db, mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.buyEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        let response = null;
        const wallet = yield (0, wallets_1.getWalletSecret)(db, arg.params.wallet);
        if (wallet) {
            const keyPair = (0, wallet_1.getKeyPairFromSecret)(wallet.secretKey);
            if (keyPair) {
                let poolKeys = ((_a = _poolKeys.find((e) => (e.mint === arg.params.mint))) === null || _a === void 0 ? void 0 : _a.poolKeys) ||
                    (yield (0, transactions_1.getPoolKeys)(new web3_js_1.PublicKey(arg.params.mint), solanaConnection));
                console.log(poolKeys);
                if (poolKeys) {
                    if (!_poolKeys.find((e) => (e.mint = arg.params.mint)))
                        _poolKeys.push({
                            mint: arg.params.mint,
                            poolKeys: poolKeys,
                        });
                    response = yield (0, transactions_1.buy)({ poolKeys, wallet: keyPair, mint: new web3_js_1.PublicKey(arg.params.mint), amount: arg.params.amount }, { prioFee: arg.fees }, solanaConnection, arg.simulate);
                    console.log(response);
                    if (!arg.simulate) {
                        if (response.status === 'success') {
                            const transaction = {
                                signature: response.signature,
                                value: response.amount,
                                date: new Date(),
                                status: 'pending',
                            };
                            console.log(transaction);
                            transactionsDb.insertTransaction(db, transaction);
                            if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, transaction);
                            }
                            connectionDb.getActiveConnection(db).then((r) => {
                                const confirmTransactionProcess = (0, child_process_1.fork)(path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js'));
                                confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.once('message', (msg) => {
                                    if (msg === 'ready') {
                                        confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.send({
                                            type: 'start',
                                            data: {
                                                transactionData: {
                                                    block: response.block,
                                                    amount: transaction.value,
                                                    signature: transaction.signature,
                                                },
                                                connection: r,
                                            },
                                        });
                                    }
                                });
                                confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.on('message', (msg) => {
                                    if (msg.type === 'transaction-confirmation-done') {
                                        console.log('Transaction confirmed successfully');
                                        transactionsDb.updateTransaction(db, msg.data);
                                        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, msg.data);
                                        }
                                    }
                                });
                            });
                        }
                    }
                }
            }
        }
        return new Promise((resolve) => {
            if (response)
                resolve(response);
            else {
                resolve(null);
            }
        });
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
                            value: response.amount,
                            date: new Date(),
                            status: 'pending',
                        };
                        transactionsDb.insertTransaction(db, transaction);
                        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, transaction);
                        }
                        connectionDb.getActiveConnection(db).then((r) => {
                            const confirmTransactionProcess = (0, child_process_1.fork)(path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js'));
                            confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.once('message', (msg) => {
                                if (msg === 'ready') {
                                    confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.send({
                                        type: 'start',
                                        data: {
                                            transactionData: {
                                                block: response.block,
                                                amount: transaction.value,
                                                signature: transaction.signature,
                                            },
                                            connection: r,
                                        },
                                    });
                                }
                            });
                            confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.on('message', (msg) => {
                                if (msg.type === 'transaction-confirmation-done') {
                                    console.log('Transaction confirmed successfully');
                                    transactionsDb.updateTransaction(db, msg.data);
                                    if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                        (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, msg.data);
                                    }
                                }
                            });
                        });
                    }
                }
            }
        }
        return new Promise((resolve) => {
            if (response)
                resolve(response);
            else {
                resolve(null);
            }
        });
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
                            value: response.amount,
                            date: new Date(),
                            status: 'pending',
                        };
                        transactionsDb.insertTransaction(db, transaction);
                        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                            (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, transaction);
                        }
                        connectionDb.getActiveConnection(db).then((r) => {
                            const confirmTransactionProcess = (0, child_process_1.fork)(path.join(`${__dirname}/../background-processes`, 'confirm-transaction.js'));
                            confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.once('message', (msg) => {
                                if (msg === 'ready') {
                                    confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.send({
                                        type: 'start',
                                        data: {
                                            transactionData: {
                                                block: response.block,
                                                amount: transaction.value,
                                                signature: transaction.signature,
                                            },
                                            connection: r,
                                        },
                                    });
                                }
                            });
                            confirmTransactionProcess === null || confirmTransactionProcess === void 0 ? void 0 : confirmTransactionProcess.on('message', (msg) => {
                                if (msg.type === 'transaction-confirmation-done') {
                                    console.log('Transaction confirmed successfully');
                                    transactionsDb.updateTransaction(db, msg.data);
                                    if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isVisible()) {
                                        (0, ipcHandler_1.sendToRenderer)(mainWindow, events_1.ProcessType.TRANSACTION.updateEvent, msg.data);
                                    }
                                }
                            });
                        });
                    }
                }
            }
        }
        return new Promise((resolve) => {
            if (response)
                resolve(response);
            else {
                resolve(null);
            }
        });
    }));
};
const handleTransaction = (db, solanaConnection, mainWindow) => {
    BuyHandler(solanaConnection, db, mainWindow);
    WrapHandler(solanaConnection, db, mainWindow);
    UnwrapHandler(solanaConnection, db, mainWindow);
};
exports.default = handleTransaction;
