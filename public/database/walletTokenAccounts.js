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
exports.createTableWalletTokenAccounts = createTableWalletTokenAccounts;
exports.insertWalletTokenAccounts = insertWalletTokenAccounts;
exports.getWalletTokenAccounts = getWalletTokenAccounts;
const db_1 = require("./db");
function createTableWalletTokenAccounts(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS walletTokenAccounts (
        accountAddress TEXT PRIMARY KEY,
        publicKey TEXT,
        mint TEXT,
        amount REAL NOT NULL,
        FOREIGN KEY (publicKey) REFERENCES wallets(publicKey) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (mint) REFERENCES tokens(mint) ON DELETE CASCADE ON UPDATE CASCADE
    )`;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertWalletTokenAccounts(db, tokenAccs, callback) {
    const insertStatement = db.prepare(`INSERT INTO walletTokenAccounts (publicKey, accountAddress, mint, amount) VALUES (?, ?, ?, ?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        let hasError = false;
        tokenAccs.forEach((tokenAcc, index) => {
            db.get(`SELECT 1 FROM walletTokenAccounts WHERE accountAddress = ?`, [tokenAcc.accountAddress], (err, row) => {
                if (err) {
                    console.error('Error checking for existing token account:', err.message);
                    callback({ error: err.message });
                    hasError = true;
                    return;
                }
                if (row) {
                    console.log(`Token account ${tokenAcc.accountAddress} already exists. Skipping insert.`);
                }
                else {
                    insertStatement.run(tokenAcc.publicKey, tokenAcc.accountAddress, tokenAcc.mint, tokenAcc.amount, (err) => {
                        if (err) {
                            console.error('Error inserting token account:', err.message);
                            hasError = true;
                        }
                    });
                }
                // Finalize after the last token account is processed
                if (index === tokenAccs.length - 1) {
                    insertStatement.finalize((err) => {
                        if (err) {
                            console.error('Error finalizing statement:', err.message);
                            hasError = true;
                        }
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction:', err.message);
                                callback({ error: err.message });
                            }
                            else if (!hasError) {
                                console.log('Transaction committed successfully.');
                                callback({ message: 'Accounts inserted successfully.' });
                            }
                        });
                    });
                }
            });
        });
    });
}
function getWalletTokenAccounts(db, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const sql = `
      SELECT 
        wta.accountAddress,
        wta.mint,
        wta.amount,
        t.name,
        t.symbol,
        t.decimals,
        t.isNft
      FROM 
        walletTokenAccounts wta
      JOIN 
        tokens t
      ON 
        wta.mint = t.mint
      WHERE 
        wta.publicKey = ?;
    `;
            db.all(sql, [publicKey], (err, rows) => {
                if (err) {
                    console.error('Error retrieving wallet token accounts:', err.message);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
