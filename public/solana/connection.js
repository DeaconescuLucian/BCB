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
exports.updateSolanaConnection = updateSolanaConnection;
exports.testConnection = testConnection;
const web3_js_1 = require("@solana/web3.js");
const handlers_1 = require("../handlers");
function updateSolanaConnection(dbConnection, connection, newConnection) {
    if (newConnection.startsWith('http'))
        connection = new web3_js_1.Connection(newConnection);
    else
        connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(newConnection), 'confirmed');
    (0, handlers_1.setupHandlers)(dbConnection, connection);
}
function testConnection(connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let connection;
            if (connectionString.startsWith('http'))
                connection = new web3_js_1.Connection(connectionString);
            else
                connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(connectionString), 'confirmed');
            const latestBlockhash = yield connection.getLatestBlockhash();
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
