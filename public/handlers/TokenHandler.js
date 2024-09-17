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
const utils_1 = require("../solana/utils");
const tokenDb = __importStar(require("../database/tokens"));
const GetTokenDetailsHandler = (solanaConnection) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getTokenDetailsEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        let response = yield (0, utils_1.getTokenDetails)(solanaConnection, arg);
        return new Promise((resolve) => {
            resolve(response);
        });
    }));
};
const GetTokenPriceHandler = (solanaConnection) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getTokenPriceEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        let response = yield (0, utils_1.getTokenPrice)(arg);
        return new Promise((resolve) => {
            resolve(response);
        });
    }));
};
const GetTokensHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getTokenList, () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            tokenDb.getTokens(db, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const tokens = yield Promise.all((rows === null || rows === void 0 ? void 0 : rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                            return Object.assign({}, row);
                        }))) || []);
                        let response = yield (0, utils_1.getTokenList)();
                        const tokensArray = [
                            ...tokens,
                            ...(response || []).map((e) => ({
                                name: e.name,
                                symbol: e.symbol,
                                address: e.address,
                                logoURI: e.logoURI,
                            })),
                        ];
                        const tokensSet = new Set(tokensArray.map((e) => e.address));
                        const uniqueTokensArray = Array.from(tokensSet).map((address) => tokensArray.find((e) => e.address === address));
                        uniqueTokensArray.sort((a, b) => {
                            if (a.favouriteIndex === null)
                                return 1;
                            if (b.favouriteIndex === null)
                                return -1;
                            return a.favouriteIndex - b.favouriteIndex;
                        });
                        resolve(uniqueTokensArray);
                    }
                    catch (error) {
                        reject(error);
                    }
                }
            }));
        });
    }));
};
const AddTokenHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.addTokenEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            tokenDb.insertTokens(db, [arg], (result) => {
                if (result.error) {
                    reject(result.error);
                }
                else {
                    resolve('token inserted successfully');
                }
            });
        });
    }));
};
const GetWsolHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getWSOLEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            tokenDb.getWSOL(db, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const tokens = yield Promise.all((rows === null || rows === void 0 ? void 0 : rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                            return Object.assign({}, row);
                        }))) || []);
                        resolve(tokens[0]);
                    }
                    catch (error) {
                        reject(error);
                    }
                }
            }));
        });
    }));
};
const AddTokenToFavouritesHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.addTokenToFavouritesEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield tokenDb.addTokenToFavourites(db, arg);
            resolve('done');
        }));
    }));
};
const RemoveTokenFromFavouritesHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.removeTokenFromFavouritesEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield tokenDb.removeTokenFomFavourites(db, arg);
            resolve('done');
        }));
    }));
};
const handleToken = (db, solanaConnection) => {
    GetTokenDetailsHandler(solanaConnection);
    GetTokenPriceHandler(solanaConnection);
    GetTokensHandler(db);
    AddTokenHandler(db);
    GetWsolHandler(db);
    AddTokenToFavouritesHandler(db);
    RemoveTokenFromFavouritesHandler(db);
};
exports.default = handleToken;
