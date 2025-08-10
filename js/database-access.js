const { db } = require('./database-init.js');

// Database access functions to replace JSON file operations

// Categories functions
function getAllCategories() {
    try {
        return db.prepare('SELECT * FROM categories ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

function addCategory(name) {
    try {
        const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
        const result = stmt.run(name);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

function deleteCategory(name) {
    try {
        const stmt = db.prepare('DELETE FROM categories WHERE name = ?');
        const result = stmt.run(name);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

// Menu Items functions
function getAllMenuItems() {
    try {
        return db.prepare(`
            SELECT mi.*, c.name as category_name 
            FROM menu_items mi 
            LEFT JOIN categories c ON mi.category_id = c.id 
            ORDER BY mi.name
        `).all();
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }
}

function getMenuItemsByCategory(categoryName) {
    try {
        const category = db.prepare('SELECT id FROM categories WHERE name = ?').get(categoryName);
        if (!category) return [];
        return db.prepare('SELECT * FROM menu_items WHERE category_id = ? ORDER BY name').all(category.id);
    } catch (error) {
        console.error('Error fetching menu items by category:', error);
        return [];
    }
}


function addMenuItem(categoryId, code, name, price, isAvailable = 1, isCustom = 0, isPhoto = 0) {
    try {
        const stmt = db.prepare(`
            INSERT INTO menu_items (category_id, code, name, price, is_available, is_custom, is_photo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(categoryId, code, name, price, isAvailable, isCustom, isPhoto);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding menu item:', error);
        throw error;
    }
}

function updateMenuItem(id, updates) {
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE menu_items SET ${setClause} WHERE id = ?`);
        const result = stmt.run(...values);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating menu item:', error);
        throw error;
    }
}

function updateMenuItemByCode(code, updates) {
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(code);
        
        const stmt = db.prepare(`UPDATE menu_items SET ${setClause} WHERE code = ?`);
        const result = stmt.run(...values);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating menu item by code:', error);
        throw error;
    }
}


function deleteMenuItem(id) {
    try {
        const stmt = db.prepare('DELETE FROM menu_items WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting menu item:', error);
        throw error;
    }
}

// Menu Item Options functions
function getMenuItemOptions(menuItemId) {
    try {
        return db.prepare('SELECT * FROM menu_item_options WHERE menu_item_id = ? ORDER BY name').all(menuItemId);
    } catch (error) {
        console.error('Error fetching menu item options:', error);
        return [];
    }
}

function addMenuItemOption(menuItemId, name, price) {
    try {
        const stmt = db.prepare('INSERT INTO menu_item_options (menu_item_id, name, price) VALUES (?, ?, ?)');
        const result = stmt.run(menuItemId, name, price);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding menu item option:', error);
        throw error;
    }
}

// Tables functions
function getAllTables() {
    try {
        return db.prepare('SELECT * FROM tables ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
    }
}

function addTable(name, capacity, type) {
    try {
        const stmt = db.prepare('INSERT INTO tables (name, capacity, type) VALUES (?, ?, ?)');
        const result = stmt.run(name, capacity, type);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding table:', error);
        throw error;
    }
}

function updateTable(id, updates) {
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE tables SET ${setClause} WHERE id = ?`);
        const result = stmt.run(...values);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating table:', error);
        throw error;
    }
}

// Table Sections functions
function getAllTableSections() {
    try {
        return db.prepare('SELECT * FROM table_sections ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching table sections:', error);
        return [];
    }
}

function addTableSection(name) {
    try {
        const stmt = db.prepare('INSERT INTO table_sections (name) VALUES (?)');
        const result = stmt.run(name);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding table section:', error);
        throw error;
    }
}

// Billing Modes functions
function getAllBillingModes() {
    try {
        return db.prepare('SELECT * FROM billing_modes ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching billing modes:', error);
        return [];
    }
}

function addBillingMode(name, isDiscountable, extras, type, minimumBill = 0, maxDiscount = 0) {
    try {
        const stmt = db.prepare(`
            INSERT INTO billing_modes (name, is_discountable, extras, type, minimum_bill, max_discount) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(name, isDiscountable, extras, type, minimumBill, maxDiscount);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding billing mode:', error);
        throw error;
    }
}

function updateBillingMode(id, updates) {
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE billing_modes SET ${setClause} WHERE id = ?`);
        const result = stmt.run(...values);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating billing mode:', error);
        throw error;
    }
}

function deleteBillingMode(id) {
    try {
        const stmt = db.prepare('DELETE FROM billing_modes WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting billing mode:', error);
        throw error;
    }
}

// Billing Parameters functions
function getAllBillingParameters() {
    try {
        return db.prepare('SELECT * FROM billing_parameters ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching billing parameters:', error);
        return [];
    }
}

function addBillingParameter(name, isCompulsary, value, unit, unitName) {
    try {
        const stmt = db.prepare('INSERT INTO billing_parameters (name, is_compulsary, value, unit, unit_name) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(name, isCompulsary, value, unit, unitName);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding billing parameter:', error);
        throw error;
    }
}

// Orders functions
function getAllOrders() {
    try {
        return db.prepare('SELECT * FROM orders ORDER BY date DESC, time_punch DESC').all();
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

function getOrderByKotNumber(kotNumber) {
    try {
        return db.prepare('SELECT * FROM orders WHERE kot_number = ?').get(kotNumber);
    } catch (error) {
        console.error('Error fetching order by KOT number:', error);
        return null;
    }
}

function addOrder(orderData) {
    try {
        const stmt = db.prepare(`
            INSERT INTO orders (
                kot_number, order_details_json, table_name, customer_name, customer_mobile,
                steward_name, steward_code, order_status, date, time_punch, time_kot,
                time_bill, time_settle, cart_json, extras_json, discount_json, special_remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            orderData.kot_number,
            orderData.order_details_json,
            orderData.table_name,
            orderData.customer_name,
            orderData.customer_mobile,
            orderData.steward_name,
            orderData.steward_code,
            orderData.order_status,
            orderData.date,
            orderData.time_punch,
            orderData.time_kot,
            orderData.time_bill,
            orderData.time_settle,
            orderData.cart_json,
            orderData.extras_json,
            orderData.discount_json,
            orderData.special_remarks
        );
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding order:', error);
        throw error;
    }
}

function updateOrder(kotNumber, updates) {
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(kotNumber);
        
        const stmt = db.prepare(`UPDATE orders SET ${setClause} WHERE kot_number = ?`);
        const result = stmt.run(...values);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}

function deleteOrder(kotNumber) {
    try {
        const stmt = db.prepare('DELETE FROM orders WHERE kot_number = ?');
        const result = stmt.run(kotNumber);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

// Settings functions
function getSetting(key) {
    try {
        const result = db.prepare('SELECT value_json FROM settings WHERE key = ?').get(key);
        return result ? JSON.parse(result.value_json) : null;
    } catch (error) {
        console.error('Error fetching setting:', error);
        return null;
    }
}

function setSetting(key, value) {
    try {
        const valueJson = JSON.stringify(value);
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value_json) VALUES (?, ?)');
        const result = stmt.run(key, valueJson);
        return result.changes > 0;
    } catch (error) {
        console.error('Error setting setting:', error);
        throw error;
    }
}

// Payment Modes functions
function getAllPaymentModes() {
    try {
        return db.prepare('SELECT * FROM payment_modes ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching payment modes:', error);
        return [];
    }
}

function addPaymentMode(name, code) {
    try {
        const stmt = db.prepare('INSERT INTO payment_modes (name, code) VALUES (?, ?)');
        const result = stmt.run(name, code);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding payment mode:', error);
        throw error;
    }
}

// Discount Types functions
function getAllDiscountTypes() {
    try {
        return db.prepare('SELECT * FROM discount_types ORDER BY name').all();
    } catch (error) {
        console.error('Error fetching discount types:', error);
        return [];
    }
}

function addDiscountType(name, maxDiscountUnit, maxDiscountValue) {
    try {
        const stmt = db.prepare('INSERT INTO discount_types (name, max_discount_unit, max_discount_value) VALUES (?, ?, ?)');
        const result = stmt.run(name, maxDiscountUnit, maxDiscountValue);
        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error adding discount type:', error);
        throw error;
    }
}

// Table Mapping functions
function getAllTableMappings() {
    try {
        return db.prepare('SELECT * FROM table_mapping ORDER BY table_name').all();
    } catch (error) {
        console.error('Error fetching table mappings:', error);
        return [];
    }
}

function getTableMapping(tableName) {
    try {
        return db.prepare('SELECT * FROM table_mapping WHERE table_name = ?').get(tableName);
    } catch (error) {
        console.error('Error fetching table mapping:', error);
        return null;
    }
}

function addOrUpdateTableMapping(tableName, kotNumber, assignedTo, status, lastUpdate) {
    try {
        const existing = getTableMapping(tableName);
        if (existing) {
            const stmt = db.prepare(`
                UPDATE table_mapping 
                SET kot_number = ?, assigned_to = ?, status = ?, last_update = ? 
                WHERE table_name = ?
            `);
            const result = stmt.run(kotNumber, assignedTo, status, lastUpdate, tableName);
            return result.changes > 0;
        } else {
            const stmt = db.prepare(`
                INSERT INTO table_mapping (table_name, kot_number, assigned_to, status, last_update) 
                VALUES (?, ?, ?, ?, ?)
            `);
            const result = stmt.run(tableName, kotNumber, assignedTo, status, lastUpdate);
            return result.lastInsertRowid;
        }
    } catch (error) {
        console.error('Error adding/updating table mapping:', error);
        throw error;
    }
}

function deleteTableMapping(tableName) {
    try {
        const stmt = db.prepare('DELETE FROM table_mapping WHERE table_name = ?');
        const result = stmt.run(tableName);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting table mapping:', error);
        throw error;
    }
}

// Utility functions for dine sessions and saved comments (stored in settings)
function getAllDineSessions() {
    try {
        return getSetting('dinesessions') || [];
    } catch (error) {
        console.error('Error fetching dine sessions:', error);
        return [];
    }
}

function addDineSession(session) {
    try {
        const sessions = getAllDineSessions();
        sessions.push(session);
        return setSetting('dinesessions', sessions);
    } catch (error) {
        console.error('Error adding dine session:', error);
        throw error;
    }
}

function deleteDineSession(sessionName) {
    try {
        const sessions = getAllDineSessions();
        const filteredSessions = sessions.filter(s => s.name !== sessionName);
        return setSetting('dinesessions', filteredSessions);
    } catch (error) {
        console.error('Error deleting dine session:', error);
        throw error;
    }
}

function getAllSavedComments() {
    try {
        return getSetting('savedcomments') || [];
    } catch (error) {
        console.error('Error fetching saved comments:', error);
        return [];
    }
}

function addSavedComment(comment) {
    try {
        const comments = getAllSavedComments();
        if (!comments.includes(comment)) {
            comments.push(comment);
            return setSetting('savedcomments', comments);
        }
        return false;
    } catch (error) {
        console.error('Error adding saved comment:', error);
        throw error;
    }
}

function deleteSavedComment(comment) {
    try {
        const comments = getAllSavedComments();
        const filteredComments = comments.filter(c => c !== comment);
        return setSetting('savedcomments', filteredComments);
    } catch (error) {
        console.error('Error deleting saved comment:', error);
        throw error;
    }
}

// Export all functions
module.exports = {
    // Categories
    getAllCategories,
    addCategory,
    deleteCategory,
    
    // Menu Items
    getAllMenuItems,
    getMenuItemsByCategory,
    addMenuItem,
    updateMenuItem,
    updateMenuItemByCode,
    deleteMenuItem,
    
    // Menu Item Options
    getMenuItemOptions,
    addMenuItemOption,
    
    // Tables
    getAllTables,
    addTable,
    updateTable,
    
    // Table Sections
    getAllTableSections,
    addTableSection,
    
    // Billing Modes
    getAllBillingModes,
    addBillingMode,
    updateBillingMode,
    deleteBillingMode,
    
    // Billing Parameters
    getAllBillingParameters,
    addBillingParameter,
    
    // Orders
    getAllOrders,
    getOrderByKotNumber,
    addOrder,
    updateOrder,
    deleteOrder,
    
    // Settings
    getSetting,
    setSetting,
    
    // Payment Modes
    getAllPaymentModes,
    addPaymentMode,
    
    // Discount Types
    getAllDiscountTypes,
    addDiscountType,
    
    // Table Mapping
    getAllTableMappings,
    getTableMapping,
    addOrUpdateTableMapping,
    deleteTableMapping,
    
    // Utility functions
    getAllDineSessions,
    addDineSession,
    deleteDineSession,
    getAllSavedComments,
    addSavedComment,
    deleteSavedComment
};