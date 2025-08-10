const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'vega.db');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Create tables if they don't exist
function initializeDatabase() {
    // Categories table
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Menu items table
    db.exec(`
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            is_custom BOOLEAN DEFAULT 0,
            is_photo BOOLEAN DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    `);

    // Menu item options table (for custom items)
    db.exec(`
        CREATE TABLE IF NOT EXISTS menu_item_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            menu_item_id INTEGER,
            custom_name TEXT NOT NULL,
            custom_price TEXT NOT NULL,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
        )
    `);

    // Tables table
    db.exec(`
        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            capacity INTEGER NOT NULL,
            type TEXT NOT NULL
        )
    `);

    // Table sections table
    db.exec(`
        CREATE TABLE IF NOT EXISTS table_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Billing modes table
    db.exec(`
        CREATE TABLE IF NOT EXISTS billing_modes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            is_discountable BOOLEAN DEFAULT 0,
            extras TEXT,
            type TEXT NOT NULL,
            minimum_bill REAL DEFAULT 0,
            max_discount REAL DEFAULT 0
        )
    `);

    // Billing parameters table
    db.exec(`
        CREATE TABLE IF NOT EXISTS billing_parameters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            is_compulsary BOOLEAN DEFAULT 0,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            unit_name TEXT NOT NULL
        )
    `);

    // Orders table (KOT)
    db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kot_number TEXT UNIQUE NOT NULL,
            order_details_json TEXT,
            table_name TEXT NOT NULL,
            customer_name TEXT,
            customer_mobile TEXT,
            steward_name TEXT,
            steward_code TEXT,
            order_status INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            time_punch TEXT,
            time_kot TEXT,
            time_bill TEXT,
            time_settle TEXT,
            cart_json TEXT,
            extras_json TEXT,
            discount_json TEXT,
            special_remarks TEXT
        )
    `);

    // Settings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value_json TEXT
        )
    `);

    // Last counters table
    db.exec(`
        CREATE TABLE IF NOT EXISTS counters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            value INTEGER DEFAULT 0
        )
    `);
}

// Migrate existing JSON data to database
function migrateData() {
    try {
        // Migrate categories
        const categoriesPath = path.join(__dirname, '..', 'data', 'static', 'menuCategories.json');
        if (fs.existsSync(categoriesPath)) {
            const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
            const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
            const transaction = db.transaction((cats) => {
                for (const cat of cats) {
                    insertCategory.run(cat);
                }
            });
            transaction(categoriesData);
        }

        // Migrate menu items
        const menuPath = path.join(__dirname, '..', 'data', 'static', 'mastermenu.json');
        if (fs.existsSync(menuPath)) {
            const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
            const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
            const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
            const insertMenuItem = db.prepare(`
                INSERT OR IGNORE INTO menu_items 
                (category_id, code, name, price, is_available, is_custom, is_photo) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            const insertMenuItemOption = db.prepare(`
                INSERT INTO menu_item_options 
                (menu_item_id, custom_name, custom_price) 
                VALUES (?, ?, ?)
            `);

            for (const category of menuData) {
                // Insert category
                insertCategory.run(category.category);
                const categoryIdRow = getCategory.get(category.category);
                const categoryId = categoryIdRow ? categoryIdRow.id : null;

                if (categoryId) {
                    // Insert menu items
                    for (const item of category.items) {
                        const result = insertMenuItem.run(
                            categoryId,
                            item.code,
                            item.name,
                            item.price,
                            item.isAvailable ? 1 : 0,
                            item.isCustom ? 1 : 0,
                            item.isPhoto ? 1 : 0
                        );

                        // Insert custom options if any
                        if (item.isCustom && item.customOptions) {
                            const menuItemId = result.lastInsertRowid;
                            for (const option of item.customOptions) {
                                insertMenuItemOption.run(
                                    menuItemId,
                                    option.customName,
                                    option.customPrice
                                );
                            }
                        }
                    }
                }
            }
        }

        // Migrate tables
        const tablesPath = path.join(__dirname, '..', 'data', 'static', 'tables.json');
        if (fs.existsSync(tablesPath)) {
            const tablesData = JSON.parse(fs.readFileSync(tablesPath, 'utf8'));
            const insertTable = db.prepare(`
                INSERT OR IGNORE INTO restaurant_tables 
                (name, capacity, type) 
                VALUES (?, ?, ?)
            `);
            const transaction = db.transaction((tables) => {
                for (const table of tables) {
                    insertTable.run(table.name, table.capacity, table.type);
                }
            });
            transaction(tablesData);
        }

        // Migrate table sections
        const tableSectionsPath = path.join(__dirname, '..', 'data', 'static', 'tablesections.json');
        if (fs.existsSync(tableSectionsPath)) {
            const tableSectionsData = JSON.parse(fs.readFileSync(tableSectionsPath, 'utf8'));
            const insertSection = db.prepare('INSERT OR IGNORE INTO table_sections (name) VALUES (?)');
            const transaction = db.transaction((sections) => {
                for (const section of sections) {
                    insertSection.run(section);
                }
            });
            transaction(tableSectionsData);
        }

        // Migrate billing modes
        const billingModesPath = path.join(__dirname, '..', 'data', 'static', 'billingmodes.json');
        if (fs.existsSync(billingModesPath)) {
            const billingModesData = JSON.parse(fs.readFileSync(billingModesPath, 'utf8'));
            const insertMode = db.prepare(`
                INSERT OR IGNORE INTO billing_modes 
                (name, is_discountable, extras, type, minimum_bill, max_discount) 
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const transaction = db.transaction((modes) => {
                for (const mode of modes) {
                    insertMode.run(
                        mode.name,
                        mode.isDiscountable ? 1 : 0,
                        mode.extras,
                        mode.type,
                        mode.minimumBill || 0,
                        mode.maxDiscount || 0
                    );
                }
            });
            transaction(billingModesData);
        }

        // Migrate billing parameters
        const billingParamsPath = path.join(__dirname, '..', 'data', 'static', 'billingparameters.json');
        if (fs.existsSync(billingParamsPath)) {
            const billingParamsData = JSON.parse(fs.readFileSync(billingParamsPath, 'utf8'));
            const insertParam = db.prepare(`
                INSERT OR IGNORE INTO billing_parameters 
                (name, is_compulsary, value, unit, unit_name) 
                VALUES (?, ?, ?, ?, ?)
            `);
            const transaction = db.transaction((params) => {
                for (const param of params) {
                    insertParam.run(
                        param.name,
                        param.isCompulsary ? 1 : 0,
                        param.value,
                        param.unit,
                        param.unitName
                    );
                }
            });
            transaction(billingParamsData);
        }

        // Migrate counters
        const lastKotPath = path.join(__dirname, '..', 'data', 'static', 'lastKOT.txt');
        if (fs.existsSync(lastKotPath)) {
            const lastKot = fs.readFileSync(lastKotPath, 'utf8');
            const insertCounter = db.prepare(`
                INSERT OR IGNORE INTO counters (name, value) VALUES (?, ?)
            `);
            insertCounter.run('last_kot', parseInt(lastKot) || 0);
        }

        const lastBillPath = path.join(__dirname, '..', 'data', 'static', 'lastBILL.txt');
        if (fs.existsSync(lastBillPath)) {
            const lastBill = fs.readFileSync(lastBillPath, 'utf8');
            const insertCounter = db.prepare(`
                INSERT OR IGNORE INTO counters (name, value) VALUES (?, ?)
            `);
            insertCounter.run('last_bill', parseInt(lastBill) || 0);
        }

        console.log('Data migration completed successfully');
    } catch (error) {
        console.error('Error during data migration:', error);
    }
}

// Initialize and migrate data
initializeDatabase();
migrateData();

// Export database instance and helper functions
module.exports = {
    db,
    
    // Category functions
    getAllCategories: () => db.prepare('SELECT * FROM categories ORDER BY name').all(),
    getCategoryByName: (name) => db.prepare('SELECT * FROM categories WHERE name = ?').get(name),
    addCategory: (name) => db.prepare('INSERT INTO categories (name) VALUES (?)').run(name),
    updateCategory: (oldName, newName) => db.prepare('UPDATE categories SET name = ? WHERE name = ?').run(newName, oldName),
    deleteCategory: (name) => db.prepare('DELETE FROM categories WHERE name = ?').run(name),
    
    // Menu item functions
    getMenuItemsByCategory: (categoryId) => {
        const items = db.prepare(`
            SELECT * FROM menu_items 
            WHERE category_id = ? 
            ORDER BY name
        `).all(categoryId);
        
        // Add custom options to each item
        return items.map(item => {
            if (item.is_custom) {
                item.customOptions = db.prepare(`
                    SELECT custom_name as customName, custom_price as customPrice 
                    FROM menu_item_options 
                    WHERE menu_item_id = ?
                `).all(item.id);
            }
            return item;
        });
    },
    getMenuItemByCode: (code) => db.prepare('SELECT * FROM menu_items WHERE code = ?').get(code),
    addMenuItem: (item) => {
        const result = db.prepare(`
            INSERT INTO menu_items 
            (category_id, code, name, price, is_available, is_custom, is_photo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            item.category_id,
            item.code,
            item.name,
            item.price,
            item.is_available ? 1 : 0,
            item.is_custom ? 1 : 0,
            item.is_photo ? 1 : 0
        );
        return result.lastInsertRowid;
    },
    updateMenuItem: (code, item) => {
        return db.prepare(`
            UPDATE menu_items 
            SET category_id = ?, name = ?, price = ?, is_available = ?, is_custom = ?, is_photo = ?
            WHERE code = ?
        `).run(
            item.category_id,
            item.name,
            item.price,
            item.is_available ? 1 : 0,
            item.is_custom ? 1 : 0,
            item.is_photo ? 1 : 0,
            code
        );
    },
    deleteMenuItem: (code) => db.prepare('DELETE FROM menu_items WHERE code = ?').run(code),
    addMenuItemOption: (menuItemId, option) => {
        return db.prepare(`
            INSERT INTO menu_item_options 
            (menu_item_id, custom_name, custom_price) 
            VALUES (?, ?, ?)
        `).run(menuItemId, option.customName, option.customPrice);
    },
    deleteMenuItemOptions: (menuItemId) => {
        return db.prepare('DELETE FROM menu_item_options WHERE menu_item_id = ?').run(menuItemId);
    },
    
    // Table functions
    getAllTables: () => db.prepare('SELECT * FROM restaurant_tables ORDER BY name').all(),
    getTableByName: (name) => db.prepare('SELECT * FROM restaurant_tables WHERE name = ?').get(name),
    addTable: (table) => db.prepare(`
        INSERT INTO restaurant_tables (name, capacity, type) VALUES (?, ?, ?)
    `).run(table.name, table.capacity, table.type),
    updateTable: (oldName, table) => db.prepare(`
        UPDATE restaurant_tables 
        SET name = ?, capacity = ?, type = ? 
        WHERE name = ?
    `).run(table.name, table.capacity, table.type, oldName),
    deleteTable: (name) => db.prepare('DELETE FROM restaurant_tables WHERE name = ?').run(name),
    
    // Table section functions
    getAllTableSections: () => db.prepare('SELECT * FROM table_sections ORDER BY name').all(),
    addTableSection: (name) => db.prepare('INSERT INTO table_sections (name) VALUES (?)').run(name),
    deleteTableSection: (name) => db.prepare('DELETE FROM table_sections WHERE name = ?').run(name),
    
    // Billing mode functions
    getAllBillingModes: () => db.prepare('SELECT * FROM billing_modes ORDER BY name').all(),
    addBillingMode: (mode) => db.prepare(`
        INSERT INTO billing_modes 
        (name, is_discountable, extras, type, minimum_bill, max_discount) 
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        mode.name,
        mode.isDiscountable ? 1 : 0,
        mode.extras,
        mode.type,
        mode.minimumBill || 0,
        mode.maxDiscount || 0
    ),
    updateBillingMode: (oldName, mode) => db.prepare(`
        UPDATE billing_modes 
        SET name = ?, is_discountable = ?, extras = ?, type = ?, minimum_bill = ?, max_discount = ?
        WHERE name = ?
    `).run(
        mode.name,
        mode.isDiscountable ? 1 : 0,
        mode.extras,
        mode.type,
        mode.minimumBill || 0,
        mode.maxDiscount || 0,
        oldName
    ),
    deleteBillingMode: (name) => db.prepare('DELETE FROM billing_modes WHERE name = ?').run(name),
    
    // Billing parameter functions
    getAllBillingParameters: () => db.prepare('SELECT * FROM billing_parameters ORDER BY name').all(),
    addBillingParameter: (param) => db.prepare(`
        INSERT INTO billing_parameters 
        (name, is_compulsary, value, unit, unit_name) 
        VALUES (?, ?, ?, ?, ?)
    `).run(
        param.name,
        param.isCompulsary ? 1 : 0,
        param.value,
        param.unit,
        param.unitName
    ),
    updateBillingParameter: (oldName, param) => db.prepare(`
        UPDATE billing_parameters 
        SET name = ?, is_compulsary = ?, value = ?, unit = ?, unit_name = ?
        WHERE name = ?
    `).run(
        param.name,
        param.isCompulsary ? 1 : 0,
        param.value,
        param.unit,
        param.unitName,
        oldName
    ),
    deleteBillingParameter: (name) => db.prepare('DELETE FROM billing_parameters WHERE name = ?').run(name),
    
    // Order functions
    getAllOrders: () => db.prepare('SELECT * FROM orders ORDER BY date DESC, time_punch DESC').all(),
    getOrderById: (id) => db.prepare('SELECT * FROM orders WHERE id = ?').get(id),
    getOrderByKotNumber: (kotNumber) => db.prepare('SELECT * FROM orders WHERE kot_number = ?').get(kotNumber),
    addOrder: (order) => db.prepare(`
        INSERT INTO orders 
        (kot_number, order_details_json, table_name, customer_name, customer_mobile, 
         steward_name, steward_code, order_status, date, time_punch, time_kot, time_bill, 
         time_settle, cart_json, extras_json, discount_json, special_remarks) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        order.kot_number,
        order.order_details_json,
        order.table_name,
        order.customer_name,
        order.customer_mobile,
        order.steward_name,
        order.steward_code,
        order.order_status,
        order.date,
        order.time_punch,
        order.time_kot,
        order.time_bill,
        order.time_settle,
        order.cart_json,
        order.extras_json,
        order.discount_json,
        order.special_remarks
    ),
    updateOrder: (kotNumber, order) => db.prepare(`
        UPDATE orders 
        SET order_details_json = ?, table_name = ?, customer_name = ?, customer_mobile = ?, 
            steward_name = ?, steward_code = ?, order_status = ?, date = ?, time_punch = ?, 
            time_kot = ?, time_bill = ?, time_settle = ?, cart_json = ?, extras_json = ?, 
            discount_json = ?, special_remarks = ?
        WHERE kot_number = ?
    `).run(
        order.order_details_json,
        order.table_name,
        order.customer_name,
        order.customer_mobile,
        order.steward_name,
        order.steward_code,
        order.order_status,
        order.date,
        order.time_punch,
        order.time_kot,
        order.time_bill,
        order.time_settle,
        order.cart_json,
        order.extras_json,
        order.discount_json,
        order.special_remarks,
        kotNumber
    ),
    deleteOrder: (kotNumber) => db.prepare('DELETE FROM orders WHERE kot_number = ?').run(kotNumber),
    
    // Settings functions
    getSetting: (key) => {
        const row = db.prepare('SELECT value_json FROM settings WHERE key = ?').get(key);
        return row ? JSON.parse(row.value_json) : null;
    },
    setSetting: (key, value) => {
        const valueJson = JSON.stringify(value);
        return db.prepare(`
            INSERT INTO settings (key, value_json) 
            VALUES (?, ?) 
            ON CONFLICT(key) DO UPDATE SET value_json = ?
        `).run(key, valueJson, valueJson);
    },
    
    // Counter functions
    getCounter: (name) => {
        const row = db.prepare('SELECT value FROM counters WHERE name = ?').get(name);
        return row ? row.value : 0;
    },
    incrementCounter: (name) => {
        const currentValue = module.exports.getCounter(name);
        const newValue = currentValue + 1;
        db.prepare(`
            INSERT INTO counters (name, value) 
            VALUES (?, ?) 
            ON CONFLICT(name) DO UPDATE SET value = ?
        `).run(name, newValue, newValue);
        return newValue;
    },
    setCounter: (name, value) => {
        db.prepare(`
            INSERT INTO counters (name, value) 
            VALUES (?, ?) 
            ON CONFLICT(name) DO UPDATE SET value = ?
        `).run(name, value, value);
        return value;
    }
};