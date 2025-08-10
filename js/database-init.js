const Database = require('better-sqlite3');
const path = require('path');

// Define the path for the database in the 'data' directory
const dbPath = path.join(__dirname, '..', 'data', 'vega.db');
const db = new Database(dbPath, { verbose: console.log });

function initializeDatabase() {
    console.log('Initializing database...');

    const createTables = db.transaction(() => {
        // Categories (from menuCategories.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `).run();

        // Menu Items (from mastermenu.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                is_available INTEGER DEFAULT 1,
                is_custom INTEGER DEFAULT 0,
                is_photo INTEGER DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        `).run();

        // Menu Item Options (for custom items in mastermenu.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS menu_item_options (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                menu_item_id INTEGER,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
            )
        `).run();

        // Tables (from tables.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS tables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                capacity INTEGER,
                type TEXT
            )
        `).run();

        // Table Sections (from tablesections.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS table_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `).run();

        // Billing Modes (from billingmodes.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS billing_modes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                is_discountable INTEGER,
                extras TEXT,
                type TEXT,
                minimum_bill REAL,
                max_discount REAL
            )
        `).run();

        // Billing Parameters (from billingparameters.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS billing_parameters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                is_compulsary INTEGER,
                value REAL,
                unit TEXT,
                unit_name TEXT
            )
        `).run();

        // Orders (for KOTs)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kot_number TEXT UNIQUE,
                order_details_json TEXT,
                table_name TEXT,
                customer_name TEXT,
                customer_mobile TEXT,
                steward_name TEXT,
                steward_code TEXT,
                order_status TEXT,
                date TEXT,
                time_punch TEXT,
                time_kot TEXT,
                time_bill TEXT,
                time_settle TEXT,
                cart_json TEXT,
                extras_json TEXT,
                discount_json TEXT,
                special_remarks TEXT
            )
        `).run();

        // Settings (for personalisations, user profiles, etc.)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value_json TEXT
            )
        `).run();

        // Payment Modes (from paymentmodes.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS payment_modes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL UNIQUE
            )
        `).run();

        // Discount Types (from discounttypes.json)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS discount_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                max_discount_unit TEXT,
                max_discount_value REAL
            )
        `).run();
    });

    createTables();
    console.log('Database initialization complete.');
}

// Export the function and the database connection
module.exports = { db, initializeDatabase };
