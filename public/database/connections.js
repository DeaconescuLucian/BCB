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
exports.createTableConnections = createTableConnections;
exports.insertConnection = insertConnection;
exports.deleteConnection = deleteConnection;
exports.getConnections = getConnections;
exports.updateActiveConnection = updateActiveConnection;
exports.getActiveConnection = getActiveConnection;
exports.insertDefaultConnection = insertDefaultConnection;
const db_1 = require("./db");
function createTableConnections(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `CREATE TABLE IF NOT EXISTS connections(
        connection TEXT PRIMARY KEY,
        isActive INTEGER CHECK(isActive IN (0, 1)) NOT NULL DEFAULT 0 )
        `;
        yield (0, db_1.runQuery)(db, sql);
    });
}
function insertConnection(db, connection, callback) {
    const insertStatement = db.prepare(`INSERT INTO connections (connection, isActive) VALUES (?, ?)`);
    db.serialize(() => {
        // Start the transaction
        db.run('BEGIN TRANSACTION');
        let hasError = false;
        // Check if the connection already exists
        db.get(`SELECT 1 FROM connections WHERE connection = ?`, [connection], (err, row) => {
            if (err) {
                console.error('Error checking for existing connection:', err.message);
                hasError = true;
            }
            else if (row) {
                console.log(`Connection ${connection} already exists. Skipping insert.`);
                hasError = true;
            }
            else {
                // Insert the new connection
                insertStatement.run(connection, 0, (err) => {
                    if (err) {
                        console.error('Error inserting connection:', err.message);
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
                            callback({ error: err.message });
                        }
                        else {
                            callback({ error: 'Failed to insert connection.' });
                        }
                    });
                }
                else {
                    // Commit the transaction if there were no errors
                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('Error committing transaction:', err.message);
                            callback({ error: err.message });
                        }
                        else {
                            console.log('Transaction committed successfully.');
                            callback({ message: 'Connection inserted successfully.' });
                        }
                    });
                }
            });
        });
    });
}
function deleteConnection(db, connection, callback) {
    console.log(connection);
    db.serialize(() => {
        db.run(`DELETE FROM connections WHERE connection = ?`, [connection], (err) => {
            if (err) {
                console.error('Error deleting connection:', err.message);
                if (callback)
                    callback({ error: err.message });
            }
            else {
                console.log('Connection deleted successfully.');
                if (callback)
                    callback({ message: 'Connection successfully deleted' });
            }
        });
    });
}
function getConnections(db, callback) {
    db.serialize(() => {
        db.all(`SELECT * FROM connections`, (err, rows) => {
            if (err) {
                console.error('Error retrieving connections:', err.message);
                callback(err);
            }
            else {
                console.log('Retrieved connections.');
                callback(null, rows);
            }
        });
    });
}
function updateActiveConnection(db, arg, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                console.error('Error beginning transaction:', err.message);
                if (callback)
                    callback(err);
                return;
            }
            db.run(`UPDATE connections SET isActive = 0 WHERE isActive = 1`, (err) => {
                if (err) {
                    console.error('Error updating isActive to 0:', err.message);
                    db.run('ROLLBACK', () => {
                        if (callback)
                            callback(err);
                    });
                    return;
                }
                db.run(`UPDATE connections SET isActive = 1 WHERE connection = ?`, arg, (err) => {
                    if (err) {
                        console.error('Error updating isActive to 1:', err.message);
                        db.run('ROLLBACK', () => {
                            if (callback)
                                callback(err);
                        });
                        return;
                    }
                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('Error committing transaction:', err.message);
                            if (callback)
                                callback(err);
                        }
                        else {
                            console.log('Transaction committed successfully.');
                            if (callback)
                                callback(null);
                        }
                    });
                });
            });
        });
    });
}
function getActiveConnection(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `SELECT connection FROM connections WHERE isActive = 1 LIMIT 1`;
        return new Promise((resolve, reject) => {
            db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row ? row.connection : null);
                }
            });
        });
    });
}
function insertDefaultConnection(db, connection) {
    const insertStatement = db.prepare(`INSERT INTO connections (connection, isActive) VALUES (?, 1)`);
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start the transaction
            db.run('BEGIN TRANSACTION');
            let hasError = false;
            // Check if the connection already exists
            db.get(`SELECT 1 FROM connections WHERE connection = ?`, [connection], (err, row) => {
                if (err) {
                    console.error('Error checking for existing connection:', err.message);
                    hasError = true;
                }
                else if (row) {
                    console.log(`Connection ${connection} already exists. Skipping insert.`);
                    hasError = true;
                }
                else {
                    // Insert the new connection
                    insertStatement.run(connection, (err) => {
                        if (err) {
                            console.error('Error inserting connection:', err.message);
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
