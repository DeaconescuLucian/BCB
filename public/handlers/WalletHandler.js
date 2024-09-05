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
const wallet_1 = require("../solana/wallet");
const events_1 = require("../events");
const walletDb = __importStar(require("../database/wallets"));
const walletTokenAccountDb = __importStar(require("../database/walletTokenAccounts"));
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../solana/utils");
const tokens_1 = require("../database/tokens");
const walletTokenAccounts_1 = require("../database/walletTokenAccounts");
const wallets_1 = require("../database/wallets");
const ImportWalletHandler = (db, solanaConnection) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.importWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        let response;
        try {
            response = (0, wallet_1.importKeypair)(arg.secretKey);
            const solBalance = yield (0, utils_1.getSolanaBalance)(solanaConnection, (_a = response.data) === null || _a === void 0 ? void 0 : _a.keyPair.publicKey);
            return new Promise((resolve) => {
                walletDb.insertWallet(db, { wallet: response.data, alias: arg.alias, balance: solBalance }, (result) => {
                    var _a;
                    if (!result.error)
                        (0, utils_1.getTokensOwnedByWallet)(solanaConnection, new web3_js_1.PublicKey((_a = response.data) === null || _a === void 0 ? void 0 : _a.publicKey)).then((res) => {
                            (0, tokens_1.insertTokens)(db, res.tokens, (r) => {
                                if (!r.error) {
                                    (0, walletTokenAccounts_1.insertWalletTokenAccounts)(db, res.accounts, (r) => {
                                        resolve(result);
                                    });
                                }
                            });
                        });
                    else {
                        resolve(result);
                    }
                });
            });
        }
        catch (error) {
            return new Promise((resolve) => {
                resolve(response);
            });
        }
    }));
};
const GenerateWalletHandler = () => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.generateWalletEvent, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = (0, wallet_1.generateWallet)();
            return new Promise((resolve) => {
                resolve(response);
            });
        }
        catch (error) {
            console.error('Error in GenerateWalletHandler:', error);
            return 'error';
        }
    }));
};
const SaveWalletHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.saveWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!arg.balance)
            arg.balance = 0;
        return new Promise((resolve) => {
            walletDb.insertWallet(db, arg, (result) => {
                resolve(result);
            });
        });
    }));
};
const GetWalletsHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getWalletsEvent, () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            walletDb.getWallets(db, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const wallets = yield Promise.all((rows === null || rows === void 0 ? void 0 : rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                            return Object.assign({}, row);
                        }))) || []);
                        resolve(wallets);
                    }
                    catch (error) {
                        reject(error);
                    }
                }
            }));
        });
    }));
};
const UpdateWalletHandler = (db, solanaConnection) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.updateWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        const publicKey = new web3_js_1.PublicKey(arg.publicKey);
        const solBalance = yield (0, utils_1.getSolanaBalance)(solanaConnection, publicKey);
        let error = null;
        yield new Promise((resolve, reject) => {
            (0, wallets_1.updateWalletBalance)(db, { publicKey: arg.publicKey, balance: solBalance }, (err) => {
                if (err) {
                    error = err.message;
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        yield (0, utils_1.getTokensOwnedByWallet)(solanaConnection, publicKey, arg.existingMints).then((res) => __awaiter(void 0, void 0, void 0, function* () {
            const tokenAccs = yield (0, walletTokenAccounts_1.getWalletTokenAccounts)(db, arg.publicKey);
            let tokenAccsToInsert = [];
            let tokenAccsToUpdate = [];
            let tokensToInsert = [];
            let tokensToUpdate = [];
            res.accounts.forEach((acc) => {
                let token = res.tokens.find((t) => t.mint === acc.mint);
                if (tokenAccs === null || tokenAccs === void 0 ? void 0 : tokenAccs.find((a) => a.accountAddress === acc.accountAddress)) {
                    tokenAccsToUpdate.push(acc);
                    if (token)
                        tokensToUpdate.push(token);
                }
                else {
                    tokenAccsToInsert.push(acc);
                    if (token)
                        tokensToInsert.push(token);
                }
            });
            try {
                if (tokensToInsert.length)
                    yield new Promise((resolve, reject) => {
                        (0, tokens_1.insertTokens)(db, tokensToInsert, (result) => {
                            if (result.error) {
                                error = result.error;
                                reject(result.error);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                if (tokensToUpdate.length)
                    yield new Promise((resolve, reject) => {
                        (0, tokens_1.updateTokens)(db, tokensToUpdate, (err) => {
                            if (err) {
                                error = err.message;
                                reject(err.message);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                if (tokenAccsToInsert.length)
                    yield new Promise((resolve, reject) => {
                        (0, walletTokenAccounts_1.insertWalletTokenAccounts)(db, tokenAccsToInsert, (result) => {
                            if (result.error) {
                                error = result.error;
                                reject(result.error);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                if (tokenAccsToUpdate.length)
                    yield new Promise((resolve, reject) => {
                        (0, walletTokenAccounts_1.updateTokenAccountBalances)(db, tokenAccsToUpdate.map((a) => {
                            return { accountAddress: a.accountAddress, balance: a.amount };
                        }), (err) => {
                            if (err) {
                                error = err.message;
                                reject(err.message);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
            }
            catch (err) {
                console.error('An error occurred:', err);
            }
        }));
        return new Promise((resolve) => {
            resolve(error);
        });
    }));
};
const GetWalletDetailsHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getWalletDetailsEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        let details = yield walletTokenAccountDb.getWalletTokenAccounts(db, arg);
        return new Promise((resolve) => {
            resolve(details);
        });
    }));
};
const DeleteWalletHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.deleteWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => {
            walletDb.deleteWallet(db, arg, (result) => {
                resolve(result);
            });
        });
    }));
};
const handleWallet = (db, solanaConnection) => {
    ImportWalletHandler(db, solanaConnection);
    GenerateWalletHandler();
    SaveWalletHandler(db);
    GetWalletsHandler(db);
    UpdateWalletHandler(db, solanaConnection);
    GetWalletDetailsHandler(db);
    DeleteWalletHandler(db);
};
exports.default = handleWallet;
