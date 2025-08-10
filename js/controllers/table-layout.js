const { db } = require('../database-init.js');

/*
 * =======================================================================================
 * Table Sections Management
 * =======================================================================================
 */

function fetchAllTableSections() {
    try {
        const sections = db.prepare('SELECT * FROM table_sections ORDER BY name').all();
        let sectionsList = '';
        sections.forEach((section, i) => {
            sectionsList += `<tr>
                                <th style="text-align: left">#${i + 1}</th>
                                <th style="text-align: left">${section.name}</th>
                                <th style="text-align: left" onclick="deleteSingleTableSectionConsent('${section.name}')"><i class="fa fa-trash-o"></i></th>
                             </tr>`;
        });

        if (sections.length === 0) {
            document.getElementById("openNewTableButton").style.display = "none";
            document.getElementById("allTableSectionList").innerHTML = '<p style="color: #bdc3c7">No Table Section added yet.</p>';
        } else {
            document.getElementById("openNewTableButton").style.display = "block";
            document.getElementById("allTableSectionList").innerHTML = `<thead style="background: #f4f4f4;">${sectionsList}</thead>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Table Sections data.', '#e74c3c');
    }
}

function addNewTableSection() {
    const sectionName = document.getElementById("add_new_tableSection_name").value.trim();
    if (!sectionName) {
        showToast('Warning: Please set a name for the section.', '#e67e22');
        return;
    }

    try {
        db.prepare('INSERT INTO table_sections (name) VALUES (?)').run(sectionName);
        showToast(`Section '${sectionName}' added successfully.`, '#27ae60');
        hideNewTableSectionModal();
        fetchAllTableSections();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A table section with this name already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add table section.', '#e74c3c');
        }
    }
}

function deleteSingleTableSection(name) {
    try {
        db.transaction(() => {
            // First, delete all tables mapped to this section
            db.prepare('DELETE FROM tables WHERE type = ?').run(name);
            // Then, delete the section itself
            db.prepare('DELETE FROM table_sections WHERE name = ?').run(name);
        })();
        showToast(`Section '${name}' and all its tables have been deleted.`, '#27ae60');
        fetchAllTableSections();
        fetchAllTables(); // Refresh table list as well
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete table section.', '#e74c3c');
    }
    cancelTableDeleteConfirmation();
}

/*
 * =======================================================================================
 * Tables Management
 * =======================================================================================
 */

function fetchAllTables() {
    try {
        const tables = db.prepare('SELECT * FROM tables ORDER BY name').all();
        let tablesList = '';
        tables.forEach(table => {
            tablesList += `<tr role="row">
                             <td>${table.name}</td>
                             <td>${table.type}</td>
                             <td>${table.capacity}</td>
                             <td onclick="deleteSingleTableConsent('${table.name}')"><i class="fa fa-trash-o"></i></td>
                         </tr>`;
        });

        if (tables.length === 0) {
            document.getElementById("allTablesList").innerHTML = '<p style="color: #bdc3c7">No Table added yet.</p>';
        } else {
            document.getElementById("allTablesList").innerHTML = `<thead style="background: #f4f4f4;"><tr><th>Table</th><th>Section</th><th>Capacity</th><th></th></tr></thead><tbody>${tablesList}</tbody>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Tables data.', '#e74c3c');
    }
}

function addNewTable() {
    const name = document.getElementById("add_new_table_name").value.trim();
    const capacity = parseInt(document.getElementById("add_new_table_capacity").value, 10);
    const type = document.getElementById("add_new_table_type").value;

    if (!name || !type || isNaN(capacity)) {
        showToast('Warning: Please provide a valid name, capacity, and section.', '#e67e22');
        return;
    }

    try {
        db.prepare('INSERT INTO tables (name, capacity, type) VALUES (?, ?, ?)').run(name, capacity, type);
        showToast(`Table '${name}' added successfully.`, '#27ae60');
        hideNewTableModal();
        fetchAllTables();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A table with this name already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add table.', '#e74c3c');
        }
    }
}

function deleteSingleTable(name) {
    try {
        db.prepare('DELETE FROM tables WHERE name = ?').run(name);
        showToast(`Table '${name}' deleted successfully.`, '#27ae60');
        fetchAllTables();
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete table.', '#e74c3c');
    }
    cancelTableDeleteConfirmation();
}

/*
 * =======================================================================================
 * MODAL and UI Helpers
 * =======================================================================================
 */

function openNewTableModal() {
    try {
        const sections = db.prepare('SELECT name FROM table_sections').all();
        if (sections.length > 0) {
            const optionsList = sections.map(section => `<option value="${section.name}">${section.name}</option>`).join('');
            document.getElementById("add_new_table_type").innerHTML = optionsList;
            document.getElementById("newTableModal").style.display = "block";
            document.getElementById("openNewTableButton").style.display = "none";
        } else {
            showToast('Please add a Table Section first.', '#e67e22');
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not load table sections.', '#e74c3c');
    }
}

function hideNewTableModal() { document.getElementById("newTableModal").style.display = "none"; document.getElementById("openNewTableButton").style.display = "block"; }
function openNewTableSectionModal() { document.getElementById("newTableSectionModal").style.display = "block"; document.getElementById("openNewTableSectionButton").style.display = "none"; }
function hideNewTableSectionModal() { document.getElementById("newTableSectionModal").style.display = "none"; document.getElementById("openNewTableSectionButton").style.display = "block"; }

function openTableDeleteConfirmation(name, functionName, warning = '') {
    document.getElementById("tableDeleteConfirmationConsent").innerHTML = `<button type="button" class="btn btn-default" onclick="cancelTableDeleteConfirmation()" style="float: left">Cancel</button><button type="button" class="btn btn-danger" onclick="${functionName}('${name}')">Delete</button>`;
    document.getElementById("tableDeleteConfirmationText").innerHTML = `${warning} Are you sure you want to delete <b>${name}</b>?`;
    document.getElementById("tableDeleteConfirmation").style.display = 'block';
}

function cancelTableDeleteConfirmation() { document.getElementById("tableDeleteConfirmation").style.display = 'none'; }

// Confirmation wrappers
function deleteSingleTableConsent(name) { openTableDeleteConfirmation(name, 'deleteSingleTable'); }
function deleteSingleTableSectionConsent(name) { openTableDeleteConfirmation(name, 'deleteSingleTableSection', 'All tables in this section will also be deleted.'); }

// Initial data load
fetchAllTables();
fetchAllTableSections();