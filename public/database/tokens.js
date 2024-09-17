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
exports.updateTokens = updateTokens;
exports.getTokens = getTokens;
exports.getWSOL = getWSOL;
exports.insertWSOL = insertWSOL;
exports.addTokenToFavourites = addTokenToFavourites;
exports.removeTokenFomFavourites = removeTokenFomFavourites;
const db_1 = require("./db");
function createTableTokens(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS tokens(
        mint TEXT PRIMARY KEY,
        name TEXT,
        symbol TEXT,
        icon TEXT,
        decimals INTEGER NOT NULL,
        isNft INTEGER CHECK(isNft IN (0, 1)) NOT NULL DEFAULT 0,
        favouriteIndex INTEGER )
        `;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertTokens(db, tokens, callback) {
    const insertStatement = db.prepare(`INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES (?, ?, ?, ?, ?, ?, NULL)`);
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
                    insertStatement.run(token.mint, token.name, token.symbol, token.icon, token.decimals, token.isNft ? 1 : 0, (err) => {
                        if (err) {
                            console.error('Error inserting token:', err.message);
                            hasError = true;
                        }
                    });
                }
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
function updateTokens(db, tokens, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`
      UPDATE tokens
      SET name = ?, symbol = ?, icon = ?, decimals = ?, isNft = ?
      WHERE mint = ?
    `);
        for (const token of tokens) {
            stmt.run(token.name, token.symbol, token.icon, token.decimals, token.isNft ? 1 : 0, token.mint, function (err) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }
                    return;
                }
            });
        }
        stmt.finalize((err) => {
            if (err) {
                db.run('ROLLBACK');
                if (callback) {
                    callback(err);
                }
            }
            else {
                db.run('COMMIT');
                if (callback) {
                    callback(null);
                }
            }
        });
    });
}
function getTokens(db, callback) {
    db.serialize(() => {
        db.all(`SELECT mint as address, name as name, symbol as symbol, icon as logoURI, favouriteIndex FROM tokens WHERE isNft = 0`, (err, rows) => {
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
function getWSOL(db, callback) {
    db.serialize(() => {
        db.all(`SELECT mint as address, name as name, symbol as symbol, icon as logoURI FROM tokens WHERE mint = 'So11111111111111111111111111111111111111112'`, (err, rows) => {
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
function insertWSOL(db) {
    const insertStatement = db.prepare(`INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES ('So11111111111111111111111111111111111111112', 'Wrapped SOL', 'WSOL', 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', 9, 0, 1)`);
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start the transaction
            db.run('BEGIN TRANSACTION');
            let hasError = false;
            // Check if the connection already exists
            db.get(`SELECT 1 FROM tokens WHERE mint = ?`, ['So11111111111111111111111111111111111111112'], (err, row) => {
                if (err) {
                    console.error('Error checking for existing WSOL:', err.message);
                    hasError = true;
                }
                else if (row) {
                    console.log(`Token ${'WSOL'} already exists. Skipping insert.`);
                    hasError = true;
                }
                else {
                    // Insert the new connection
                    insertStatement.run((err) => {
                        if (err) {
                            console.error('Error inserting WSOL:', err.message);
                            hasError = true;
                        }
                    });
                }
                // Finalize the statement
                insertStatement.finalize((err) => {
                    if (err) {
                        console.error('Error finalizing statement:', err.message);
                        hasError = true;
                    }
                    if (hasError) {
                        // Rollback the transaction if there was an error
                        db.run('ROLLBACK', (err) => {
                            if (err) {
                                console.error('Error rolling back transaction:', err.message);
                            }
                            resolve();
                        });
                    }
                    else {
                        // Commit the transaction if there were no errors
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction:', err.message);
                            }
                            else {
                                console.log('Transaction committed successfully.');
                            }
                            resolve();
                        });
                    }
                });
            });
        });
    });
}
function addTokenToFavourites(db, token) {
    let error = null;
    const insertStatement = db.prepare(`INSERT INTO tokens (mint, name, symbol, icon, decimals, isNft, favouriteIndex) VALUES (?, ?, ?, ?, ?, ?, (SELECT MAX(favouriteIndex) FROM tokens) + 1)`);
    const stmt = db.prepare(`
    UPDATE tokens
    SET favouriteIndex = (SELECT MAX(favouriteIndex) FROM tokens) + 1
    WHERE mint = ?
  `);
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start the transaction
            db.run('BEGIN TRANSACTION');
            // Check if the connection already exists
            db.get(`SELECT 1 FROM tokens WHERE mint = ?`, [token.mint], (err, row) => {
                if (err) {
                    console.error('Error checking for existing mint:', err.message);
                    error = err;
                }
                else if (row) {
                    stmt.run(token.mint, function (err) {
                        if (err) {
                            error = err;
                            return;
                        }
                    });
                    stmt.finalize((err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            error = err;
                        }
                        else {
                            db.run('COMMIT');
                        }
                    });
                    resolve(error);
                }
                else {
                    insertStatement.run(token.mint, token.name, token.symbol, token.icon, token.decimals, token.isNft ? 1 : 0, (err) => {
                        if (err) {
                            console.error('Error inserting WSOL:', err.message);
                            error = err;
                        }
                    });
                    insertStatement.finalize((err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            error = err;
                        }
                        else {
                            db.run('COMMIT');
                        }
                    });
                    resolve(error);
                }
            });
            resolve(error);
        });
    });
}
function removeTokenFomFavourites(db, tokenMint) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                let error = null;
                const stmt = db.prepare(`
        UPDATE tokens
        SET favouriteIndex = NULL
        WHERE mint = ?
      `);
                stmt.run(tokenMint, function (err) {
                    if (err) {
                        error = err;
                        return;
                    }
                });
                stmt.finalize((err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        error = err;
                    }
                    else {
                        db.run('COMMIT');
                    }
                });
                resolve(error);
            });
        });
    });
}
