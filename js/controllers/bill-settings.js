const { db } = require('../database-init.js');

function openBillSettings(id) {
    // Hide all sections
    $("#detailsDisplayBillSettings").children().hide();
    $("#detailsNewBillSettings").children().hide();

    // Show the correct section
    document.getElementById(id).style.display = "block";

    switch (id) {
        case "billingExtras":
            fetchAllParams();
            break;
        case "billingModes":
            fetchAllModes();
            break;
        case "paymentModes":
            fetchAllPaymentModes();
            break;
        case "discountTypes":
            fetchAllDiscountTypes();
            break;
    }
}

/*
 * =======================================================================================
 * Billing Parameters (Taxes & Extras)
 * =======================================================================================
 */

function fetchAllParams() {
    try {
        const params = db.prepare('SELECT * FROM billing_parameters ORDER BY name').all();
        let paramsTag = '';
        params.forEach((param, i) => {
            paramsTag += `<tr role="row">
                            <td>#${i + 1}</td>
                            <td>${param.name}</td>
                            <td>${param.value}</td>
                            <td>${param.unit_name}</td>
                            <td>${param.is_compulsary ? "Yes" : "No"}</td>
                            <td onclick="deleteParameterConfirm('${param.name}')"><i class="fa fa-trash-o"></i></td>
                        </tr>`;
        });

        if (!paramsTag) {
            document.getElementById("billingParamsTable").innerHTML = '<p style="color: #bdc3c7">No parameters added yet.</p>';
        } else {
            document.getElementById("billingParamsTable").innerHTML = `<thead style="background: #f4f4f4;"><tr><th></th><th>Name</th><th>Value</th><th>Unit</th><th>Compulsory</th><th></th></tr></thead><tbody>${paramsTag}</tbody>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Billing Parameters.', '#e74c3c');
    }
}

function addParameter() {
    const name = document.getElementById("add_new_param_name").value.trim().replace(/,/g, "");
    const isCompulsary = document.getElementById("add_new_param_compulsary").value === 'YES';
    const value = parseFloat(document.getElementById("add_new_param_value").value);
    const unit = document.getElementById("add_new_param_unit").value;
    const unitName = unit === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (Rs)';

    if (!name || isNaN(value)) {
        showToast('Warning: Invalid name or value.', '#e67e22');
        return;
    }

    try {
        db.prepare('INSERT INTO billing_parameters (name, is_compulsary, value, unit, unit_name) VALUES (?, ?, ?, ?, ?)').run(name, isCompulsary ? 1 : 0, value, unit, unitName);
        showToast(`Parameter '${name}' added successfully.`, '#27ae60');
        fetchAllParams();
        hideNewBill();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A parameter with this name already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add parameter.', '#e74c3c');
        }
    }
}

function deleteParameter(name) {
    try {
        db.prepare('DELETE FROM billing_parameters WHERE name = ?').run(name);
        showToast(`Parameter '${name}' deleted successfully.`, '#27ae60');
        fetchAllParams();
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete parameter.', '#e74c3c');
    }
    cancelSettingsDeleteConfirmation();
}

/*
 * =======================================================================================
 * Billing Modes
 * =======================================================================================
 */

function fetchAllModes() {
    try {
        const modes = db.prepare('SELECT * FROM billing_modes ORDER BY name').all();
        let modesTag = '';
        modes.forEach((mode, i) => {
            modesTag += `<tr role="row">
                           <td>#${i + 1}</td>
                           <td><p style="margin: 0">${mode.name}</p><p style="margin: 0; font-size: 65%; color: #f39c12;">${mode.type}</p></td>
                           <td>${mode.extras ? mode.extras.replace(/,/g, ", ") : '-'}</td>
                           <td>${mode.minimum_bill ? `<i class="fa fa-inr"></i>${mode.minimum_bill}` : '-'}</td>
                           <td>${mode.is_discountable ? "Yes" : "No"}</td>
                           <td>${mode.max_discount ? `<i class="fa fa-inr"></i>${mode.max_discount}` : '-'}</td>
                           <td onclick="deleteModeConfirm('${mode.name}')"><i class="fa fa-trash-o"></i></td>
                       </tr>`;
        });
        if (!modesTag) {
            document.getElementById("billingModesTable").innerHTML = '<p style="color: #bdc3c7">No modes added yet.</p>';
        } else {
            document.getElementById("billingModesTable").innerHTML = `<thead style="background: #f4f4f4;"><tr><th></th><th>Mode</th><th>Extras</th><th>Min Bill</th><th>Discountable</th><th>Max Discount</th><th></th></tr></thead><tbody>${modesTag}</tbody>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Billing Modes.', '#e74c3c');
    }
}

function addMode() {
    const name = document.getElementById("add_new_mode_name").value.trim();
    const isDiscountable = document.getElementById("add_new_mode_discountable").value === 'YES';
    const extras = document.getElementById("add_new_mode_extras").value.trim();
    const type = document.getElementById("add_new_mode_type").value;
    const minimumBill = parseFloat(document.getElementById("add_new_mode_minBill").value) || 0;
    let maxDiscount = parseFloat(document.getElementById("add_new_mode_maxDisc").value) || 0;

    if (!name) {
        showToast('Warning: Please set a name.', '#e67e22');
        return;
    }
    if (isDiscountable && !maxDiscount) {
        showToast('Warning: Please set a non-zero maximum discount.', '#e67e22');
        return;
    }
    if (!isDiscountable) maxDiscount = 0;

    try {
        db.prepare('INSERT INTO billing_modes (name, is_discountable, extras, type, minimum_bill, max_discount) VALUES (?, ?, ?, ?, ?, ?)')
          .run(name, isDiscountable ? 1 : 0, extras, type, minimumBill, maxDiscount);
        showToast(`Mode '${name}' added successfully.`, '#27ae60');
        fetchAllModes();
        hideNewMode();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A mode with this name already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add mode.', '#e74c3c');
        }
    }
}

function deleteMode(name) {
    try {
        db.prepare('DELETE FROM billing_modes WHERE name = ?').run(name);
        showToast(`Mode '${name}' deleted successfully.`, '#27ae60');
        fetchAllModes();
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete mode.', '#e74c3c');
    }
    cancelSettingsDeleteConfirmation();
}

/*
 * =======================================================================================
 * Payment Modes
 * =======================================================================================
 */

function fetchAllPaymentModes() {
    try {
        const modes = db.prepare('SELECT * FROM payment_modes ORDER BY name').all();
        let modesTag = '';
        modes.forEach((mode, i) => {
            modesTag += `<tr role="row">
                           <td>#${i + 1}</td>
                           <td>${mode.name}</td>
                           <td>${mode.code}</td>
                           <td onclick="deletePaymentModeConfirm('${mode.name}')"><i class="fa fa-trash-o"></i></td>
                       </tr>`;
        });
        if (!modesTag) {
            document.getElementById("paymentModesTable").innerHTML = '<p style="color: #bdc3c7">No payment modes added yet.</p>';
        } else {
            document.getElementById("paymentModesTable").innerHTML = `<thead style="background: #f4f4f4;"><tr><th></th><th>Payment Mode</th><th>Code</th><th></th></tr></thead><tbody>${modesTag}</tbody>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Payment Modes.', '#e74c3c');
    }
}

function addPaymentMode() {
    const name = document.getElementById("add_new_payment_name").value.trim();
    const code = document.getElementById("add_new_payment_code").value.trim().toUpperCase();
    if (!name || !code) {
        showToast('Warning: Please provide a name and a code.', '#e67e22');
        return;
    }
    try {
        db.prepare('INSERT INTO payment_modes (name, code) VALUES (?, ?)').run(name, code);
        showToast(`Payment mode '${name}' added successfully.`, '#27ae60');
        fetchAllPaymentModes();
        hideNewPaymentMode();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A payment mode with this name or code already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add payment mode.', '#e74c3c');
        }
    }
}

function deletePaymentMode(name) {
    try {
        db.prepare('DELETE FROM payment_modes WHERE name = ?').run(name);
        showToast(`Payment mode '${name}' deleted successfully.`, '#27ae60');
        fetchAllPaymentModes();
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete payment mode.', '#e74c3c');
    }
    cancelSettingsDeleteConfirmation();
}

/*
 * =======================================================================================
 * Discount Types
 * =======================================================================================
 */

function fetchAllDiscountTypes() {
    try {
        const types = db.prepare('SELECT * FROM discount_types ORDER BY name').all();
        let typesTag = '';
        types.forEach((type, i) => {
            const maxDiscount = type.max_discount_unit === 'PERCENTAGE' ? `${type.max_discount_value}%` : `<i class="fa fa-inr"></i> ${type.max_discount_value}`;
            typesTag += `<tr role="row">
                           <td>#${i + 1}</td>
                           <td>${type.name}</td>
                           <td>${maxDiscount}</td>
                           <td onclick="deleteDiscountTypeConfirm('${type.name}')"><i class="fa fa-trash-o"></i></td>
                       </tr>`;
        });
        if (!typesTag) {
            document.getElementById("discountTypesTable").innerHTML = '<p style="color: #bdc3c7">No discount types added yet.</p>';
        } else {
            document.getElementById("discountTypesTable").innerHTML = `<thead style="background: #f4f4f4;"><tr><th></th><th>Type Name</th><th>Max Discount</th><th></th></tr></thead><tbody>${typesTag}</tbody>`;
        }
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read Discount Types.', '#e74c3c');
    }
}

function addDiscountType() {
    const name = document.getElementById("add_new_discount_name").value.trim();
    const unit = document.getElementById("add_new_discount_unit").value;
    const value = parseFloat(document.getElementById("add_new_discount_maxValue").value);

    if (!name || isNaN(value)) {
        showToast('Warning: Invalid name or value.', '#e67e22');
        return;
    }
    if (['COUPON', 'VOUCHER', 'NOCOSTBILL'].includes(name.toUpperCase())) {
        showToast('Warning: That is a reserved keyword. Please choose a different name.', '#e67e22');
        return;
    }

    try {
        db.prepare('INSERT INTO discount_types (name, max_discount_unit, max_discount_value) VALUES (?, ?, ?)').run(name, unit, value);
        showToast(`Discount type '${name}' added successfully.`, '#27ae60');
        fetchAllDiscountTypes();
        hideNewDiscountType();
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            showToast('Warning: A discount type with this name already exists.', '#e67e22');
        } else {
            console.error(err);
            showToast('System Error: Could not add discount type.', '#e74c3c');
        }
    }
}

function deleteDiscountType(name) {
    try {
        db.prepare('DELETE FROM discount_types WHERE name = ?').run(name);
        showToast(`Discount type '${name}' deleted successfully.`, '#27ae60');
        fetchAllDiscountTypes();
    } catch (err) {
        console.error(err);
        showToast('System Error: Could not delete discount type.', '#e74c3c');
    }
    cancelSettingsDeleteConfirmation();
}

/*
 * =======================================================================================
 * MODAL and UI Helpers
 * =======================================================================================
 */

function openNewBill() { document.getElementById("newBillArea").style.display = "block"; document.getElementById("openNewBillButton").style.display = "none"; }
function hideNewBill() { document.getElementById("newBillArea").style.display = "none"; document.getElementById("openNewBillButton").style.display = "block"; }
function openNewMode() { document.getElementById("newModeArea").style.display = "block"; document.getElementById("openNewModeButton").style.display = "none"; }
function hideNewMode() { document.getElementById("newModeArea").style.display = "none"; document.getElementById("openNewModeButton").style.display = "block"; }
function openNewPaymentMode() { document.getElementById("newPaymentModeArea").style.display = "block"; document.getElementById("openNewPaymentModeButton").style.display = "none"; }
function hideNewPaymentMode() { document.getElementById("newPaymentModeArea").style.display = "none"; document.getElementById("openNewPaymentModeButton").style.display = "block"; }
function openNewDiscountType() { document.getElementById("newDiscountTypeArea").style.display = "block"; document.getElementById("openNewDiscountButton").style.display = "none"; }
function hideNewDiscountType() { document.getElementById("newDiscountTypeArea").style.display = "none"; document.getElementById("openNewDiscountButton").style.display = "block"; }

function openSettingsDeleteConfirmation(name, functionName) {
    document.getElementById("settingsDeleteConfirmationConsent").innerHTML = `<button type="button" class="btn btn-default" onclick="cancelSettingsDeleteConfirmation()" style="float: left">Cancel</button><button type="button" class="btn btn-danger" onclick="${functionName}('${name}')">Delete</button>`;
    document.getElementById("settingsDeleteConfirmationText").innerHTML = `Are you sure you want to delete <b>${name}</b>?`;
    document.getElementById("settingsDeleteConfirmation").style.display = 'block';
}

function cancelSettingsDeleteConfirmation() {
    document.getElementById("settingsDeleteConfirmation").style.display = 'none';
}

// Confirmation dialog wrappers
function deleteParameterConfirm(name) { openSettingsDeleteConfirmation(name, 'deleteParameter'); }
function deleteModeConfirm(name) { openSettingsDeleteConfirmation(name, 'deleteMode'); }
function deletePaymentModeConfirm(name) { openSettingsDeleteConfirmation(name, 'deletePaymentMode'); }
function deleteDiscountTypeConfirm(name) { openSettingsDeleteConfirmation(name, 'deleteDiscountType'); }