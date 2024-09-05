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
const events_1 = require("../events");
const utils_1 = require("../solana/utils");
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
const handleToken = (db, solanaConnection) => {
    GetTokenDetailsHandler(solanaConnection);
    GetTokenPriceHandler(solanaConnection);
};
exports.default = handleToken;
