const Database = require('better-sqlite3');
const path = require('path');

// Define the path for the database in the 'data' directory
const dbPath = path.join(__dirname, '..', 'data', 'vega.db');
const db = new Database(dbPath, { verbose: console.log });

function initializeDatabase() {
    console.log('Initializing database...');

    const createTables = db.transaction(() => {
        // Users table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin'
            )
        `).run();

        // Customers table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                debt REAL DEFAULT 0,
                total_paid REAL DEFAULT 0
            )
        `).run();

        // Orders table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                date TEXT,
                total REAL NOT NULL,
                status TEXT NOT NULL, -- 'paid' or 'unpaid'
                notes TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `).run();
    });

    createTables();
    console.log('Database initialization complete.');
}

// Export the function and the database connection
module.exports = { db, initializeDatabase };
