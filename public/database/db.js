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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuery = runQuery;
exports.openConnection = openConnection;
exports.initDatabase = initDatabase;
exports.closeConnection = closeConnection;
const sqlite3_1 = __importDefault(require("sqlite3"));
const transactions_1 = require("./transactions");
const wallets_1 = require("./wallets");
const walletTokenAccounts_1 = require("./walletTokenAccounts");
const tokens_1 = require("./tokens");
const connections_1 = require("./connections");
function runQuery(db, sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function openConnection() {
    const db = new sqlite3_1.default.Database('blockchain-busters.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
        else {
            console.log('Connected to the SQLite database.');
        }
    });
    db.run('PRAGMA foreign_keys = ON');
    return db;
}
function initDatabase(db) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db.serialize(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield (0, transactions_1.createTableTransactions)(db);
                    yield (0, wallets_1.createTableWallets)(db);
                    yield (0, tokens_1.createTableTokens)(db);
                    yield (0, walletTokenAccounts_1.createTableWalletTokenAccounts)(db);
                    yield (0, connections_1.createTableConnections)(db);
                    yield (0, connections_1.insertDefaultConnection)(db, 'mainnet-beta');
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    });
}
function closeConnection(db) {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        else {
            console.log('Database connection closed.');
        }
    });
}
