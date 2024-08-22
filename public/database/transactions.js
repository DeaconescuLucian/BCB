"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTableTransactions = createTableTransactions;
exports.insertTransaction = insertTransaction;
exports.getLatestTransactions = getLatestTransactions;
function createTableTransactions(db) {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        signature TEXT PRIMARY KEY,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('success', 'fail', 'pending'))
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
        else {
            console.log('Table created or already exists.');
        }
    });
}
function insertTransaction(db, t) {
    db.serialize(() => {
        db.run(`INSERT INTO transactions (signature, value, "date", status) VALUES (?, ?, ?, ?)`, [t.signature, t.value, t.date, t.status], (err) => {
            if (err) {
                console.error('Error inserting transaction:', err.message);
            }
            else {
                console.log('Transaction inserted successfully.');
            }
        });
    });
}
function getLatestTransactions(db, callback) {
    db.serialize(() => {
        db.all(`SELECT * FROM transactions ORDER BY date DESC LIMIT 100`, (err, rows) => {
            if (err) {
                console.error('Error retrieving transactions:', err.message);
                callback(err);
            }
            else {
                console.log('Retrieved latest 100 transactions.');
                callback(null, rows);
            }
        });
    });
}
