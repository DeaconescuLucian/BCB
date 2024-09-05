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
exports.createTableTransactions = createTableTransactions;
exports.insertTransaction = insertTransaction;
exports.getLatestTransactions = getLatestTransactions;
exports.updateTransaction = updateTransaction;
const db_1 = require("./db");
function createTableTransactions(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS transactions (
        signature TEXT PRIMARY KEY,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('success', 'fail', 'pending')))`;
        yield (0, db_1.runQuery)(db, sql);
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
function updateTransaction(db, t) {
    db.serialize(() => {
        db.run(`UPDATE transactions SET "date" = ? , status = ? WHERE signature = ?`, [t.date, t.status, t.signature], (err) => {
            if (err) {
                console.error('Error updating transaction:', err.message);
            }
            else {
                console.log('Transaction updated successfully.');
            }
        });
    });
}
