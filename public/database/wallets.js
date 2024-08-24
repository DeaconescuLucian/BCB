"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTablWallets = createTablWallets;
exports.insertWallet = insertWallet;
exports.getWallets = getWallets;
function createTablWallets(db) {
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
        publicKey TEXT PRIMARY KEY,
        secretKey TEXT NOT NULL,
        alias TEXT UNIQUE CHECK(length(alias) >= 3 AND length(alias) <= 20)
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
        else {
            console.log('Table created or already exists.');
        }
    });
}
function insertWallet(db, w, callback) {
    db.serialize(() => {
        db.run(`INSERT INTO wallets (publicKey, secretKey, alias) VALUES (?, ?, ?)`, [w.wallet.publicKey, w.wallet.secretKey, w.alias], (err) => {
            if (err) {
                console.error('Error inserting wallet:', err.message);
                callback({ error: err.message });
            }
            else {
                console.log('Wallet inserted successfully.');
                console.log(w);
                callback({ message: "Wallet successfully saved" });
            }
        });
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
