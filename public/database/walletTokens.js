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
exports.createTablWalletTokens = createTablWalletTokens;
exports.insertWalletTokens = insertWalletTokens;
exports.getWalletTokens = getWalletTokens;
const db_1 = require("./db");
function createTablWalletTokens(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS walletTokens (
        publicKey TEXT PRIMARY KEY,
        tokenSignature TEXT,
        tokenName TEXT,
        amount REAL NOT NULL,
        FOREIGN KEY (publicKey) REFERENCES wallets(publicKey) ON DELETE CASCADE ON UPDATE CASCADE)`;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertWalletTokens(db, tokens, callback) {
    const insertStatement = db.prepare(`INSERT INTO walletTokens (publicKey, tokenSignature, tokenName, amount) VALUES (?, ?, ?, ?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        tokens.forEach((token) => {
            insertStatement.run(token.publicKey, token.tokenSignature, token.tokenName, token.amount, (err) => {
                if (err) {
                    console.error('Error inserting token:', err.message);
                }
            });
        });
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error committing transaction:', err.message);
                callback({ error: err.message });
            }
            else {
                console.log('Transaction committed successfully.');
                callback({ message: 'Tokens inserted successfully.' });
            }
        });
    });
    insertStatement.finalize();
}
function getWalletTokens(db, publicKey, callback) {
    db.serialize(() => {
        db.all(`SELECT * FROM walletTokens WHERE publicKey = ${publicKey}`, (err, rows) => {
            if (err) {
                console.error('Error retrieving walletTokens:', err.message);
                callback(err);
            }
            else {
                console.log('Retrieved wallet tokens.');
                callback(null, rows);
            }
        });
    });
}
