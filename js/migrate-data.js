const fs = require('fs');
const path = require('path');
const { db, initializeDatabase } = require('./database-init.js');

// Initialize the database first
initializeDatabase();

function migrateData() {
    console.log('Starting data migration...');

    const migrate = db.transaction(() => {
        // Clear existing data
        db.prepare('DELETE FROM menu_item_options').run();
        db.prepare('DELETE FROM menu_items').run();
        db.prepare('DELETE FROM categories').run();
        db.prepare('DELETE FROM tables').run();
        db.prepare('DELETE FROM table_sections').run();
        db.prepare('DELETE FROM billing_modes').run();
        db.prepare('DELETE FROM billing_parameters').run();
        db.prepare('DELETE FROM settings').run();

        // Migrate Categories
        const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'menuCategories.json'), 'utf8'));
        const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
        categories.forEach(name => insertCategory.run(name));

        // Migrate Menu Items
        const masterMenu = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'mastermenu.json'), 'utf8'));
        const insertMenuItem = db.prepare('INSERT INTO menu_items (category_id, code, name, price, is_available, is_custom, is_photo) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const insertMenuOption = db.prepare('INSERT INTO menu_item_options (menu_item_id, name, price) VALUES (?, ?, ?)');
        const getCategoryId = db.prepare('SELECT id FROM categories WHERE name = ?');

        masterMenu.forEach(category => {
            const categoryId = getCategoryId.get(category.category).id;
            category.items.forEach(item => {
                const menuItemInfo = insertMenuItem.run(
                    categoryId,
                    item.code,
                    item.name,
                    item.price,
                    item.isAvailable ? 1 : 0,
                    item.isCustom ? 1 : 0,
                    item.isPhoto ? 1 : 0
                );
                if (item.isCustom && item.customOptions) {
                    item.customOptions.forEach(option => {
                        insertMenuOption.run(menuItemInfo.lastInsertRowid, option.customName, option.customPrice);
                    });
                }
            });
        });

        // Migrate Tables
        const tables = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'tables.json'), 'utf8'));
        const insertTable = db.prepare('INSERT INTO tables (name, capacity, type) VALUES (?, ?, ?)');
        tables.forEach(table => insertTable.run(table.name, table.capacity, table.type));

        // Migrate Table Sections
        const tableSections = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'tablesections.json'), 'utf8'));
        const insertTableSection = db.prepare('INSERT INTO table_sections (name) VALUES (?)');
        tableSections.forEach(name => insertTableSection.run(name));

        // Migrate Billing Modes
        const billingModes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'billingmodes.json'), 'utf8'));
        const insertBillingMode = db.prepare('INSERT INTO billing_modes (name, is_discountable, extras, type, minimum_bill, max_discount) VALUES (?, ?, ?, ?, ?, ?)');
        billingModes.forEach(mode => insertBillingMode.run(mode.name, mode.isDiscountable ? 1 : 0, mode.extras, mode.type, mode.minimumBill, mode.maxDiscount));

        // Migrate Billing Parameters
        const billingParams = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'billingparameters.json'), 'utf8'));
        const insertBillingParam = db.prepare('INSERT INTO billing_parameters (name, is_compulsary, value, unit, unit_name) VALUES (?, ?, ?, ?, ?)');
        billingParams.forEach(param => insertBillingParam.run(param.name, param.isCompulsary ? 1 : 0, param.value, param.unit, param.unitName));

        // Migrate Settings
        const personalisations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'personalisations.json'), 'utf8'));
        const userProfiles = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'static', 'userprofiles.json'), 'utf8'));
        const insertSetting = db.prepare('INSERT INTO settings (key, value_json) VALUES (?, ?)');
        personalisations.forEach(p => insertSetting.run(p.name, JSON.stringify(p.value)));
        insertSetting.run('userprofiles', JSON.stringify(userProfiles));

    });

    migrate();
    console.log('Data migration complete.');
}

migrateData();

module.exports = { migrateData };
