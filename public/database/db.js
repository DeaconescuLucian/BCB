"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openConnection = openConnection;
exports.initDatabase = initDatabase;
exports.closeConnection = closeConnection;
const sqlite3_1 = __importDefault(require("sqlite3"));
const transactions_1 = require("./transactions");
const wallets_1 = require("./wallets");
function openConnection() {
    const db = new sqlite3_1.default.Database('blockchain-busters.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
        else {
            console.log('Connected to the SQLite database.');
        }
    });
    return db;
}
function initDatabase(db) {
    db.serialize(() => {
        (0, transactions_1.createTableTransactions)(db);
        (0, wallets_1.createTablWallets)(db);
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
