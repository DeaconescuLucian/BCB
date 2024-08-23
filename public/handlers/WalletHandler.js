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
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../solana/utils");
const ImportWalletHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.importWalletEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = (0, wallet_1.importKeypair)(arg.secretKey);
            return new Promise((resolve) => {
                walletDb.insertWallet(db, { wallet: response.data, alias: arg.alias }, (result) => {
                    resolve(result);
                });
            });
        }
        catch (error) {
            console.error('Error in ImportWalletHandler:', error);
            return 'error';
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
        return new Promise((resolve) => {
            walletDb.insertWallet(db, arg, (result) => {
                resolve(result);
            });
        });
    }));
};
const GetWalletsHandler = (db, solanaConnection) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getWalletsEvent, () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            walletDb.getWallets(db, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const wallets = yield Promise.all((rows === null || rows === void 0 ? void 0 : rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                            const keyPair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(row.secretKey.split(',').map(Number)));
                            console.log(keyPair);
                            const solBalance = yield (0, utils_1.getSolanaBalance)(solanaConnection, keyPair.publicKey);
                            console.log(solBalance);
                            return Object.assign(Object.assign({}, row), { sol: solBalance });
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
const handleWallet = (db, solanaConnection) => __awaiter(void 0, void 0, void 0, function* () {
    ImportWalletHandler(db);
    GenerateWalletHandler();
    SaveWalletHandler(db);
    GetWalletsHandler(db, solanaConnection);
});
exports.default = handleWallet;
