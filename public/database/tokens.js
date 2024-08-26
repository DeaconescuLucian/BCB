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
exports.createTableTokens = createTableTokens;
exports.insertTokens = insertTokens;
const db_1 = require("./db");
function createTableTokens(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS tokens(
        mint TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        isNft INTEGER CHECK(isNft IN (0, 1)) NOT NULL DEFAULT 0 )
        `;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertTokens(db, tokens, callback) {
    const insertStatement = db.prepare(`INSERT INTO tokens (mint, name, symbol, decimals, isNft) VALUES (?, ?, ?, ?, ?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        let hasError = false;
        tokens.forEach((token, index) => {
            db.get(`SELECT 1 FROM tokens WHERE mint = ?`, [token.mint], (err, row) => {
                if (err) {
                    console.error('Error checking for existing token:', err.message);
                    callback({ error: err.message });
                    hasError = true;
                    return;
                }
                if (row) {
                    console.log(`Token with mint ${token.mint} already exists. Skipping insert.`);
                }
                else {
                    insertStatement.run(token.mint, token.name, token.symbol, token.decimals, token.isNft ? 1 : 0, (err) => {
                        if (err) {
                            console.error('Error inserting token:', err.message);
                            hasError = true;
                        }
                    });
                }
                // Finalize after the last token is processed
                if (index === tokens.length - 1) {
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
                                callback({ message: 'Tokens inserted successfully.' });
                            }
                        });
                    });
                }
            });
        });
    });
}
