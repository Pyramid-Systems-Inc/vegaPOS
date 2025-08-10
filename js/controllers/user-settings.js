const { db } = require('../database-init.js');

function fetchAllUsersInfo() {
    try {
        const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
        if (!userSettings || !userSettings.value_json) {
            document.getElementById("allUsersRenderArea").innerHTML = '<p style="color: #bdc3c7">No users found.</p>';
            return;
        }

        const users = JSON.parse(userSettings.value_json);
        users.sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical sorting

        let userRenderContent = '';
        users.forEach((user, index) => {
            userRenderContent += `<tr role="row" class="odd">
                                    <td>#${index + 1}</td>
                                    <td>${user.name}</td>
                                    <td>${user.role === 'ADMIN' ? 'Admin' : 'Staff'}</td>
                                    <td>${user.code}</td>
                                    <td onclick="openDeleteUserConsent('${user.code}', '${user.name}')"><i style="cursor: pointer" class="fa fa-trash-o"></i></td>
                                  </tr>`;
        });

        document.getElementById("allUsersRenderArea").innerHTML = userRenderContent;
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to read User Profiles.', '#e74c3c');
    }
}

function addNewUserProfile() {
    const role = document.getElementById("user_profile_new_user_role").value;
    const name = document.getElementById("user_profile_new_user_name").value.trim();
    const mobile = document.getElementById("user_profile_new_user_mobile").value.trim();
    const password = document.getElementById("user_profile_new_user_password").value;

    if (!role || !name || !mobile || !password) {
        showToast('Warning: Missing some values', '#e67e22');
        return;
    }

    if (isNaN(mobile) || mobile.length !== 10) {
        showToast('Warning: Invalid mobile number', '#e67e22');
        return;
    }

    try {
        const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
        const users = userSettings && userSettings.value_json ? JSON.parse(userSettings.value_json) : [];

        if (users.some(user => user.code === mobile)) {
            showToast('Warning: A user is already registered with this mobile number.', '#e67e22');
            return;
        }

        users.push({ name, code: mobile, role, password });

        db.prepare("UPDATE settings SET value_json = ? WHERE key = 'userprofiles'").run(JSON.stringify(users));

        showToast(`User '${name}' added successfully.`, '#27ae60');
        fetchAllUsersInfo();
        hideNewUser();
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to save new user profile.', '#e74c3c');
    }
}

function deleteUserFromUserProfile(code, name) {
    try {
        const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
        if (!userSettings || !userSettings.value_json) {
            showToast('System Error: Could not find user data to delete.', '#e74c3c');
            return;
        }

        let users = JSON.parse(userSettings.value_json);
        const updatedUsers = users.filter(user => user.code !== code);

        db.prepare("UPDATE settings SET value_json = ? WHERE key = 'userprofiles'").run(JSON.stringify(updatedUsers));

        showToast(`'${name}' has been removed successfully.`, '#27ae60');
        fetchAllUsersInfo();
        hideDeleteUserConsent();
        removeFromCurrentUser(code); // Check if the deleted user is the currently logged-in one
    } catch (err) {
        console.error(err);
        showToast('System Error: Unable to delete user profile.', '#e74c3c');
    }
}


/*
 * =======================================================================================
 * UI and MODAL MANAGEMENT (Helper Functions)
 * =======================================================================================
 */

function openDeleteUserConsent(code, name) {
    document.getElementById("deleteUserConsentModalText").innerHTML = `Are you sure you want to remove <b>${name}</b> from the list?`;
    document.getElementById("deleteUserConsentModalConsent").innerHTML = `<button type="button" class="btn btn-default" onclick="hideDeleteUserConsent()" style="float: left">Cancel</button><button type="button" class="btn btn-danger" onclick="deleteUserFromUserProfile('${code}', '${name}')">Delete</button>`;
    document.getElementById("deleteUserConsentModal").style.display = "block";
}

function hideDeleteUserConsent() {
    document.getElementById("deleteUserConsentModal").style.display = "none";
}

function openNewUser() {
    document.getElementById("newUserArea").style.display = "block";
    document.getElementById("openNewUserButton").style.display = "none";
}

function hideNewUser() {
    document.getElementById("newUserArea").style.display = "none";
    document.getElementById("openNewUserButton").style.display = "block";
}

function removeFromCurrentUser(code) {
    const loggedInStaffInfo = window.localStorage.loggedInStaffData ? JSON.parse(window.localStorage.loggedInStaffData) : {};
    if (loggedInStaffInfo.code === code) {
        window.localStorage.loggedInStaffData = '';
        renderCurrentUserDisplay(); // This function should exist elsewhere to update the UI
    }
}

// Initial load of users when the page is ready
fetchAllUsersInfo();