import sqlite3 from 'sqlite3';


export function createTableTransactions(db: sqlite3.Database) {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        signature TEXT PRIMARY KEY,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('success', 'fail', 'pending'))
    )`, (err: Error | null) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Table created or already exists.');
        }
    });
}

export function insertTransaction(db: sqlite3.Database, t: any): void {
    db.serialize(() => {
        console.log(t)
        db.run(`INSERT INTO transactions (signature, value, "date", status) VALUES (?, ?, ?, ?)`,
            [t.signature, t.value, t.date, t.status], (err: Error | null) => {
                if (err) {
                    console.error('Error inserting transaction:', err.message);
                } else {
                    console.log('Transaction inserted successfully.');
                }
            });
    });
}

export function getLatestTransactions(db: sqlite3.Database, callback: (err: Error | null, rows?: any[]) => void): void {
    db.serialize(() => {
        db.all(
            `SELECT * FROM transactions ORDER BY date DESC LIMIT 100`,
            (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error('Error retrieving transactions:', err.message);
                    callback(err);
                } else {
                    console.log('Retrieved latest 100 transactions.');
                    callback(null, rows);
                }
            }
        );
    });
}