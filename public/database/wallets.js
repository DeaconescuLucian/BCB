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
exports.createTableWallets = createTableWallets;
exports.insertWallet = insertWallet;
exports.getWallets = getWallets;
exports.updateWalletBalance = updateWalletBalance;
exports.deleteWallet = deleteWallet;
const db_1 = require("./db");
function createTableWallets(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS wallets (
        publicKey TEXT PRIMARY KEY,
        secretKey TEXT NOT NULL,
        alias TEXT UNIQUE CHECK(length(alias) >= 3 AND length(alias) <= 20),
        balance REAL NOT NULL)`;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertWallet(db, w, callback) {
    db.serialize(() => {
        db.run(`INSERT INTO wallets (publicKey, secretKey, alias, balance) VALUES (?, ?, ?, ?)`, [w.wallet.publicKey, w.wallet.secretKey, w.alias, w.balance], (err) => {
            if (err) {
                console.error('Error inserting wallet:', err.message);
                callback({ error: err.message });
            }
            else {
                console.log('Wallet inserted successfully.');
                console.log(w);
                callback({ message: 'Wallet successfully saved' });
            }
        });
    });
}
function getWallets(db, callback) {
    db.serialize(() => {
        db.all(`SELECT publicKey, alias, balance FROM wallets`, (err, rows) => {
            if (err) {
                console.error('Error retrieving wallets:', err.message);
                callback(err);
            }
            else {
                console.log('Retrieved wallets.');
                callback(null, rows);
            }
        });
    });
}
function updateWalletBalance(db, arg, callback) {
    db.serialize(() => {
        db.all(`UPDATE wallets SET balance = ? WHERE publicKey = ?`, [arg.balance, arg.publicKey], (err) => {
            if (err) {
                console.error('Error updating wallet:', err.message);
                if (callback)
                    callback(err);
            }
            else {
                console.log('Updated wallet balance.');
                if (callback)
                    callback(null);
            }
        });
    });
}
function deleteWallet(db, publicKey, callback) {
    db.serialize(() => {
        db.run(`DELETE FROM wallets WHERE publicKey = ?`, [publicKey], (err) => {
            if (err) {
                console.error('Error deleting wallet:', err.message);
                if (callback)
                    callback({ error: err.message });
            }
            else {
                console.log('Wallet inserted successfully.');
                if (callback)
                    callback({ message: 'Wallet successfully deleted' });
            }
        });
    });
}
