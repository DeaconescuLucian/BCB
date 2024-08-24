import sqlite3 from 'sqlite3';


export function createTablWallets(db: sqlite3.Database) {
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
        publicKey TEXT PRIMARY KEY,
        secretKey TEXT NOT NULL,
        alias TEXT UNIQUE CHECK(length(alias) >= 3 AND length(alias) <= 20)
    )`, (err: Error | null) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Table created or already exists.');
        }
    });
}

export function insertWallet(db: sqlite3.Database, w: any, callback: (result: {error?: string, message?: string}) => void): void {
    db.serialize(() => {
        db.run(`INSERT INTO wallets (publicKey, secretKey, alias) VALUES (?, ?, ?)`,
            [w.wallet.publicKey, w.wallet.secretKey, w.alias], (err: Error | null) => {
                if (err) {
                    console.error('Error inserting wallet:', err.message);
                    callback({error: err.message});
                } else {
                    console.log('Wallet inserted successfully.');
                    console.log(w);
                    callback({message: "Wallet successfully saved"});
                }
            });
    });
}

export function getWallets(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
    db.serialize(() => {
        db.all(
            `SELECT * FROM wallets`,
            (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error('Error retrieving wallets:', err.message);
                    callback(err);
                } else {
                    console.log('Retrieved wallets.');
                    callback(null, rows);
                }
            }
        );
    });
}