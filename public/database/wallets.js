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
exports.createTablWallets = createTablWallets;
exports.insertWallet = insertWallet;
exports.getAllWalletsWithTokens = getAllWalletsWithTokens;
exports.getWalletWithTokens = getWalletWithTokens;
exports.getWallets = getWallets;
exports.updateWalletBalance = updateWalletBalance;
const db_1 = require("./db");
function createTablWallets(db) {
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
function getAllWalletsWithTokens(db, callback) {
    const query = `
        SELECT 
            wallets.publicKey AS walletPublicKey,
            wallets.secretKey AS walletSecretKey,
            wallets.alias AS walletAlias,
            wallets.balance AS walletBalance,
            walletTokens.publicKey AS tokenPublicKey,
            walletTokens.tokenSignature AS tokenSignature,
            walletTokens.tokenName AS tokenName,
            walletTokens.amount AS tokenAmount
        FROM wallets
        LEFT JOIN walletTokens ON wallets.publicKey = walletTokens.publicKey
    `;
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error retrieving wallets:', err.message);
            callback(err);
            return;
        }
        const result = [];
        const walletMap = new Map();
        rows.forEach((row) => {
            if (!walletMap.has(row.walletPublicKey)) {
                walletMap.set(row.walletPublicKey, {
                    wallet: {
                        publicKey: row.walletPublicKey,
                        secretKey: row.walletSecretKey,
                        alias: row.walletAlias,
                        balance: row.walletBalance,
                    },
                    tokens: [],
                });
            }
            const walletEntry = walletMap.get(row.walletPublicKey);
            if (row.tokenPublicKey) {
                walletEntry.tokens.push({
                    tokenSignature: row.tokenSignature,
                    tokenName: row.tokenName,
                    amount: row.tokenAmount,
                });
            }
        });
        result.push(...walletMap.values());
        console.log('Retrieved wallets.');
        callback(null, result);
    });
}
function getWalletWithTokens(db, publicKey, callback) {
    const query = `
        SELECT 
            wallets.publicKey AS walletPublicKey,
            wallets.secretKey AS walletSecretKey,
            wallets.alias AS walletAlias,
            wallets.balance AS walletBalance,
            walletTokens.publicKey AS tokenPublicKey,
            walletTokens.tokenSignature AS tokenSignature,
            walletTokens.tokenName AS tokenName,
            walletTokens.amount AS tokenAmount
        FROM wallets
        LEFT JOIN walletTokens ON wallets.publicKey = walletTokens.publicKey
        WHERE wallets.publicKey = ?
    `;
    db.all(query, [publicKey], (err, rows) => {
        if (err) {
            callback(err);
            return;
        }
        if (rows.length === 0) {
            // No wallet found with the given publicKey
            callback(null, undefined);
            return;
        }
        // Process results
        const walletData = {
            wallet: {
                publicKey: rows[0].walletPublicKey,
                secretKey: rows[0].walletSecretKey,
                alias: rows[0].walletAlias,
                balance: rows[0].walletBalance,
            },
            tokens: [],
        };
        rows.forEach((row) => {
            if (row.tokenPublicKey) {
                walletData.tokens.push({
                    publicKey: row.tokenPublicKey,
                    tokenSignature: row.tokenSignature,
                    tokenName: row.tokenName,
                    amount: row.tokenAmount,
                });
            }
        });
        callback(null, walletData);
    });
}
function getWallets(db, callback) {
    db.serialize(() => {
        db.all(`SELECT * FROM wallets`, (err, rows) => {
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
        db.all(`UPDATE wallets SET balance = ${arg.balance} WHERE publicKey = ${arg.publicKey}`, (err) => {
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
