const { db, initializeDatabase } = require('./database-init.js');

function seedDatabase() {
    // Ensure the database and tables are created
    initializeDatabase();

    console.log('Seeding database with sample data...');

    const seed = db.transaction(() => {
        // Clear existing data
        db.prepare('DELETE FROM menu_item_options').run();
        db.prepare('DELETE FROM menu_items').run();
        db.prepare('DELETE FROM categories').run();
        db.prepare('DELETE FROM tables').run();
        db.prepare('DELETE FROM table_sections').run();
        db.prepare('DELETE FROM billing_modes').run();
        db.prepare('DELETE FROM billing_parameters').run();
        db.prepare('DELETE FROM payment_modes').run();
        db.prepare('DELETE FROM discount_types').run();
        db.prepare('DELETE FROM table_mapping').run();
        db.prepare('DELETE FROM settings').run();

        // 1. Category
        const categoryId = db.prepare("INSERT INTO categories (name) VALUES (?)").run('Sample Category').lastInsertRowid;

        // 2. Menu Item
        const menuItemId = db.prepare(
            'INSERT INTO menu_items (category_id, code, name, price, is_available, is_custom, is_photo)'
            + ' VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(categoryId, 'S001', 'Sample Item', 10.99, 1, 1, 0).lastInsertRowid;

        // 3. Menu Item Option
        db.prepare('INSERT INTO menu_item_options (menu_item_id, name, price) VALUES (?, ?, ?)').run(menuItemId, 'Extra Cheese', 1.50);

        // 4. Table Section
        db.prepare("INSERT INTO table_sections (name) VALUES (?)").run('Main Hall');

        // 5. Table
        db.prepare('INSERT INTO tables (name, capacity, type) VALUES (?, ?, ?)').run('T1', 4, 'Main Hall');

        // 6. Billing Mode
        db.prepare('INSERT INTO billing_modes (name, is_discountable, extras, type, minimum_bill, max_discount) VALUES (?, ?, ?, ?, ?, ?)')
          .run('Dine-In', 1, 'GST', 'DINE', 0, 100);

        // 7. Billing Parameter
        db.prepare('INSERT INTO billing_parameters (name, is_compulsary, value, unit, unit_name) VALUES (?, ?, ?, ?, ?)')
          .run('GST', 1, 5, 'PERCENTAGE', '%');

        // 8. Payment Mode
        db.prepare("INSERT INTO payment_modes (name, code) VALUES (?, ?)").run('Cash', 'CASH');

        // 9. Discount Type
        db.prepare("INSERT INTO discount_types (name, max_discount_unit, max_discount_value) VALUES (?, ?, ?)").run('Staff Discount', 'PERCENTAGE', 10);

        // 10. Settings
        const sampleUserSettings = { code: '1234', name: 'Admin User', role: 'ADMIN', password: '1234' };
        db.prepare('INSERT INTO settings (key, value_json) VALUES (?, ?)').run('userprofiles', JSON.stringify([sampleUserSettings]));
        
        const sampleThemeSetting = { name: 'theme', value: 'skin-blue' };
        db.prepare('INSERT INTO settings (key, value_json) VALUES (?, ?)').run(sampleThemeSetting.name, JSON.stringify(sampleThemeSetting.value));

        // 11. Table Mapping
        db.prepare("INSERT INTO table_mapping (table_name, status) VALUES (?, ?)").run('T1', 0);

        // 12. Last KOT
        db.prepare("INSERT INTO settings (key, value_json) VALUES (?, ?)").run('last_kot', '1000');
    });

    try {
        seed();
        console.log('Database seeded successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// Run the seeding function directly
seedDatabase();
