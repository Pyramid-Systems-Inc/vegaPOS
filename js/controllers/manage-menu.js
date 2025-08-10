const { db } = require('../database-init.js');

/*
 * =======================================================================================
 * CATEGORY MANAGEMENT
 * =======================================================================================
 */

function fetchAllCategories() {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
        let categoryTag = '';

        if (categories.length > 0) {
            categories.forEach(category => {
                categoryTag += `<tr class="subMenuList" onclick="openSubMenu(${category.id}, '${category.name}')"><td>${category.name}</td></tr>`;
            });
        } else {
            categoryTag = '<p style="color: #bdc3c7">No Category added yet.</p>';
        }

        document.getElementById("categoryArea").innerHTML = categoryTag;
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Category data.', '#e74c3c');
    }
}

function addCategory() {
    const name = document.getElementById("add_new_category_name").value.trim();
    if (!name) {
        showToast('Warning: Category Name is invalid.', '#e67e22');
        return;
    }

    try {
        db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
        showToast(`Success! Category '${name}' was added.`, '#27ae60');
        fetchAllCategories();
        hideNewMenuCategory();
        const newCategory = db.prepare('SELECT id, name FROM categories WHERE name = ?').get(name);
        openSubMenu(newCategory.id, newCategory.name);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: Category already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Unable to save new category.', '#e74c3c');
        }
    }
}

function saveNewCategoryName(categoryId, currentName) {
    const newName = document.getElementById("edit_category_new_name").value.trim();
    if (!newName) {
        showToast('Warning: Name is invalid.', '#e67e22');
        return;
    }

    if (currentName !== newName) {
        try {
            db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(newName, categoryId);
            showToast('Category name updated successfully.', '#27ae60');
            fetchAllCategories();
            openSubMenu(categoryId, newName);
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                showToast('Warning: A category with that name already exists.', '#e67e22');
            } else {
                console.error(err);
                showToast('System Error: Could not update category name.', '#e74c3c');
            }
        }
    }
    hideEditCategoryName();
}

function deleteCategory(categoryId, categoryName) {
    try {
        db.transaction(() => {
            // Delete menu item options associated with items in the category
            const items = db.prepare('SELECT id FROM menu_items WHERE category_id = ?').all(categoryId);
            if (items.length > 0) {
                const itemIds = items.map(item => item.id);
                const params = ','.join('?'.repeat(itemIds.length));
                db.prepare(`DELETE FROM menu_item_options WHERE menu_item_id IN (${params})`).run(...itemIds);
            }
            // Delete menu items in the category
            db.prepare('DELETE FROM menu_items WHERE category_id = ?').run(categoryId);
            // Delete the category itself
            db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
        })();
        showToast(`Category '${categoryName}' and all its items have been deleted.`, '#27ae60');
        document.getElementById("menuDetailsArea").style.display = "none";
        fetchAllCategories();
    } catch (err) {
        console.error(err);
        showToast('System Error: Failed to delete category.', '#e74c3c');
    }
    cancelDeleteConfirmation();
}


/*
 * =======================================================================================
 * MENU ITEM MANAGEMENT
 * =======================================================================================
 */

function openSubMenu(categoryId, categoryName) {
    try {
        const items = db.prepare('SELECT * FROM menu_items WHERE category_id = ? ORDER BY name').all(categoryId);
        let itemsInCategory = "";

        items.forEach(item => {
            const availabilityTag = item.is_available
                ? `<span class="label availTag" id="item_avail_${item.code}" onclick="markAvailability('${item.code}')">Available</span>`
                : `<span class="label notavailTag" id="item_avail_${item.code}" onclick="markAvailability('${item.code}')">Out of Stock</span>`;

            itemsInCategory += `<tr>
                                    <td>${item.name}</td>
                                    <td><button class="btn btn-sm itemPriceTag" onclick='editItemPrice(${JSON.stringify(item)})'><i class="fa fa-inr"></i> ${item.price}</button></td>
                                    <td>${availabilityTag}</td>
                                 </tr>`;
        });

        document.getElementById("menuRenderTitle").innerHTML = `<div class="box-header" style="padding: 10px 0px"><h3 class="box-title" style="padding: 5px 0px; font-size: 21px;">${categoryName}</h3></div>`;
        
        // Setup submenu options (Add, Edit, Delete category)
        setupSubmenuOptions(categoryId, categoryName);

        document.getElementById("menuRenderContent").innerHTML = itemsInCategory || `<p style="color: #bdc3c7">No items found in ${categoryName}</p>`;
        document.getElementById("menuDetailsArea").style.display = "block";

    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to load menu items.', '#e74c3c');
    }
}

function markAvailability(itemCode) {
    try {
        const item = db.prepare('SELECT is_available FROM menu_items WHERE code = ?').get(itemCode);
        if (item) {
            const newAvailability = item.is_available ? 0 : 1;
            db.prepare('UPDATE menu_items SET is_available = ? WHERE code = ?').run(newAvailability, itemCode);
            
            const availElement = document.getElementById(`item_avail_${itemCode}`);
            if (newAvailability) {
                availElement.innerHTML = 'Available';
                availElement.className = 'label availTag';
            } else {
                availElement.innerHTML = 'Out of Stock';
                availElement.className = 'label notavailTag';
            }
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to update item availability.', '#e74c3c');
    }
}

function saveItem(categoryId, categoryName, editFlag) {
    const code = document.getElementById("item_main_code_secret").value;
    const name = document.getElementById("item_main_name").value.trim();
    let price = document.getElementById("item_main_price").value.trim();
    const isCustom = document.getElementById("existingChoices").innerHTML.trim() !== '' || document.getElementById("extraChoicesArea").innerHTML.trim() !== '';

    const customOptions = [];
    if (isCustom) {
        let i = 1;
        while (document.getElementById(`edit_choiceName_${i}`)) {
            const choiceName = document.getElementById(`edit_choiceName_${i}`).value.trim();
            const choicePrice = document.getElementById(`edit_choicePrice_${i}`).value.trim();
            if (choiceName && choicePrice) {
                customOptions.push({ customName: choiceName, customPrice: parseFloat(choicePrice) });
            }
            i++;
        }
        // Also check for newly added choices
        i = 1;
        while (document.getElementById(`choice_name_${i}`)) {
            const choiceName = document.getElementById(`choice_name_${i}`).value.trim();
            const choicePrice = document.getElementById(`choice_price_${i}`).value.trim();
            if (choiceName && choicePrice) {
                customOptions.push({ customName: choiceName, customPrice: parseFloat(choicePrice) });
            }
            i++;
        }

        if (customOptions.length > 0) {
            const prices = customOptions.map(opt => opt.customPrice);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            price = minPrice === maxPrice ? `${minPrice}` : `${minPrice}-${maxPrice}`;
        }
    }

    const itemData = {
        name,
        price,
        isCustom: isCustom ? 1 : 0,
        isAvailable: 1, // Default to available
        isPhoto: 0 // Default to no photo
    };

    try {
        if (editFlag) { // Update existing item
            db.prepare('UPDATE menu_items SET name = ?, price = ?, is_custom = ? WHERE code = ?').run(itemData.name, itemData.price, itemData.isCustom, code);
            // Clear and re-insert options
            db.prepare('DELETE FROM menu_item_options WHERE menu_item_id = (SELECT id FROM menu_items WHERE code = ?)').run(code);
            const menuItemId = db.prepare('SELECT id FROM menu_items WHERE code = ?').get(code).id;
            const insertOption = db.prepare('INSERT INTO menu_item_options (menu_item_id, name, price) VALUES (?, ?, ?)');
            customOptions.forEach(opt => insertOption.run(menuItemId, opt.customName, opt.customPrice));
            showToast(`'${itemData.name}' updated successfully.`, '#27ae60');
        } else { // Insert new item
            const newCode = `I${Date.now()}`;
            const result = db.prepare('INSERT INTO menu_items (category_id, code, name, price, is_available, is_custom, is_photo) VALUES (?, ?, ?, ?, ?, ?, ?)')
                             .run(categoryId, newCode, itemData.name, itemData.price, itemData.isAvailable, itemData.isCustom, itemData.isPhoto);
            const menuItemId = result.lastInsertRowid;
            const insertOption = db.prepare('INSERT INTO menu_item_options (menu_item_id, name, price) VALUES (?, ?, ?)');
            customOptions.forEach(opt => insertOption.run(menuItemId, opt.customName, opt.customPrice));
            showToast(`'${itemData.name}' added successfully.`, '#27ae60');
        }
        openSubMenu(categoryId, categoryName);
        hideNewMenuItem();
        hideEditMenuItemPrice();
    } catch (err) {
        console.error(err);
        showToast('System Error: Failed to save item.', '#e74c3c');
    }
}


/*
 * =======================================================================================
 * UI and MODAL MANAGEMENT (some functions might need adjustments)
 * =======================================================================================
 */

// Helper to setup submenu floating action button
function setupSubmenuOptions(categoryId, categoryName) {
    const subOptions = `<div class="floaty" style="right: -85px; top: 10px">
                          <div class="floaty-btn" onclick="openNewMenuItem(${categoryId}, '${categoryName}')">
                            <span class="floaty-btn-label">Add a New Item</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" class="floaty-btn-icon floaty-btn-icon-plus absolute-center"><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z" fill="#fff"/><path d="M0-.75h24v24H0z" fill="none"/></svg>
                            <svg width="24" height="24" viewBox="0 0 24 24" class="floaty-btn-icon floaty-btn-icon-create absolute-center"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                          </div>
                          <ul class="floaty-list">
                            <li class="floaty-list-item floaty-list-item--blue" onclick="openEditCategoryName(${categoryId}, '${categoryName}')">
                              <span class="floaty-list-item-label">Edit Category Name</span>
                              <svg width="20" height="20" viewBox="0 0 24 24" class="absolute-center"><path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                            </li>
                            <li class="floaty-list-item floaty-list-item--red" onclick="openDeleteConfirmation(${categoryId}, '${categoryName}')">
                              <span class="floaty-list-item-label">Delete ${categoryName}</span>
                              <svg width="20" height="20" viewBox="0 0 24 24" class="absolute-center"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                            </li>
                          </ul>
                        </div>`;
    document.getElementById("submenuOptions").innerHTML = subOptions;

    // Re-initialize floaty button animation
    var $floaty = $('.floaty');
    $floaty.off().on('mouseover click', function(e) {
        $floaty.addClass('is-active');
        e.stopPropagation();
    });
    $('body').on('click', function() { $floaty.removeClass('is-active'); });
}

function openNewMenuCategory() { document.getElementById("newMenuCategoryModal").style.display = "block"; }
function hideNewMenuCategory() { document.getElementById("newMenuCategoryModal").style.display = "none"; }

function openNewMenuItem(categoryId, categoryName) {
    document.getElementById("newItemChoicesArea").innerHTML = "";
    document.getElementById("new_item_choice_count").value = 0;
    document.getElementById("removeChoiceButton").style.display = 'none';
    document.getElementById("newItemModalTitle").innerHTML = `Add New <b>${categoryName}</b>`;
    document.getElementById("newItemModalActions").innerHTML = `<button type="button" class="btn btn-default" onclick="hideNewMenuItem()" style="float: left">Cancel</button><button type="button" onclick="saveItem(${categoryId}, '${categoryName}', false)" class="btn btn-success">Add</button>`;
    document.getElementById("new_item_name").value = '';
    document.getElementById("new_item_price").value = '';
    document.getElementById("item_main_code_secret").value = ''; // Clear secret code
    document.getElementById("newMenuItemModal").style.display = "block";
}
function hideNewMenuItem() { document.getElementById("newMenuItemModal").style.display = "none"; }

function editItemPrice(item) {
    document.getElementById("extraChoicesArea").innerHTML = '';
    document.getElementById("removeExtraChoiceButton").style.display = 'none';

    const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(item.category_id);

    document.getElementById("editMenuItemPriceModal").style.display = "block";
    document.getElementById("editItemPriceModalTitle").innerHTML = `Edit <b>${item.name}</b>`;
    document.getElementById("editItemModalActions").innerHTML = `<button type="button" class="btn btn-default" onclick="hideEditMenuItemPrice()" style="float: left">Cancel</button><button type="button" onclick="saveItem(${item.category_id}, '${category.name}', true)" class="btn btn-success">Save</button>`;

    let editContent = '';
    if (item.is_custom) {
        const options = db.prepare('SELECT * FROM menu_item_options WHERE menu_item_id = ?').all(item.id);
        let customRow = '';
        options.forEach((opt, i) => {
            customRow += `<div class="row" id="edit_choiceNamed_${i + 1}">
                            <div class="col-lg-8"><div class="form-group"><label>Choice ${i + 1}</label> <input type="text" value="${opt.name}" id="edit_choiceName_${i + 1}" class="form-control tip"/></div></div>
                            <div class="col-lg-4"><div class="form-group"><label>Price</label> <input type="text" value="${opt.price}" class="form-control tip" id="edit_choicePrice_${i + 1}"/></div></div>
                         </div>`;
        });
        editContent = `<div class="row"><div class="col-lg-8"><div class="form-group"><label>Item Name</label> <input type="text" value="${item.name}" id="item_main_name" class="form-control tip"/></div></div></div><div id="existingChoices">${customRow}</div>`;
        document.getElementById("removeExtraChoiceButton").style.display = 'block';
    } else {
        editContent = `<div class="row">
                        <div class="col-lg-8"><div class="form-group"><label>Item Name</label> <input type="text" id="item_main_name" value="${item.name}" class="form-control tip"/></div></div>
                        <div class="col-lg-4"><div class="form-group"><label>Price</label> <input type="text" value="${item.price}" class="form-control tip" id="item_main_price"/></div></div>
                     </div><div id="existingChoices"></div>`;
    }

    document.getElementById("editItemArea").innerHTML = editContent;
    document.getElementById("editItemCodeSecret").innerHTML = `<input type="hidden" id="item_main_code_secret" value="${item.code}"/>`;
}
function hideEditMenuItemPrice() { document.getElementById("editMenuItemPriceModal").style.display = "none"; }

function openDeleteConfirmation(categoryId, categoryName) {
    document.getElementById("deleteConfirmationConsent").innerHTML = `<button type="button" class="btn btn-default" onclick="cancelDeleteConfirmation()" style="float: left">Cancel</button><button type="button" class="btn btn-danger" onclick="deleteCategory(${categoryId}, '${categoryName}')">Delete</button>`;
    document.getElementById("deleteConfirmationText").innerHTML = `All items in <b>${categoryName}</b> will also be deleted. Are you sure?`;
    document.getElementById("categoryDeleteConfirmation").style.display = 'block';
}
function cancelDeleteConfirmation() { document.getElementById("categoryDeleteConfirmation").style.display = 'none'; }

function openEditCategoryName(categoryId, currentName) {
    document.getElementById("editCategoryNameConsent").innerHTML = `<button type="button" class="btn btn-default" onclick="hideEditCategoryName()" style="float: left">Cancel</button><button type="button" onclick="saveNewCategoryName(${categoryId}, '${currentName}')" class="btn btn-success">Save</button>`;
    document.getElementById("editCategoryNameArea").innerHTML = `<input style="border: none; border-bottom: 1px solid" placeholder="Enter a Name" type="text" id="edit_category_new_name" value="${currentName}" class="form-control tip"/>`;
    document.getElementById("categoryEditNameConfirmation").style.display = 'block';
}
function hideEditCategoryName() { document.getElementById("categoryEditNameConfirmation").style.display = 'none'; }

// Initial load
fetchAllCategories();