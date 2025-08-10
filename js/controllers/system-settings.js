const { db } = require('../database-init.js');

function openSystemSettings(id) {
    // Hide all setting sections before showing the target one
    $("#detailsDisplaySystemSettings").children().hide();
    $("#detailsNewSystemSettings").children().hide();

    document.getElementById(id).style.display = "block";

    switch (id) {
        case "personalOptions":
            renderPersonalisations();
            break;
        case "systemSecurity":
            renderSecurityOptions();
            break;
    }
}

function getSettings() {
    try {
        const settingsRows = db.prepare("SELECT key, value_json FROM settings").all();
        const settings = {};
        for (const row of settingsRows) {
            settings[row.key] = JSON.parse(row.value_json);
        }
        return settings;
    } catch (err) {
        console.error("Failed to get settings:", err);
        showToast('System Error: Unable to read settings data.', '#e74c3c');
        return {};
    }
}

function updateSetting(key, value) {
    try {
        db.prepare("INSERT OR REPLACE INTO settings (key, value_json) VALUES (?, ?)").run(key, JSON.stringify(value));
    } catch (err) {
        console.error(`Failed to update setting ${key}:`, err);
        showToast('System Error: Unable to save settings data.', '#e74c3c');
    }
}

function renderPersonalisations() {
    const settings = getSettings();

    // Theme
    if (settings.theme) {
        let themeName = settings.theme.replace(/skin-|/g, '').replace(/-/g, ' ');
        if (themeName.split(" ").length === 1) themeName += ' Dark';
        // Clear previous default
        $(".selectThemeTitleDefaulted").html("");
        document.getElementById(`title_${settings.theme}`).innerHTML = `${themeName} <tag class="selectThemeTitleDefaulted"><i style="color: #2ecc71" class="fa fa-check-circle"></i></tag>`;
    }

    // Menu Images
    document.getElementById("personalisationEditImage").value = settings.menuImages || 'YES';

    // Virtual Keyboard
    document.getElementById("personalisationEditKeyboard").value = settings.virtualKeyboard || 0;

    // Screen Lock
    const screenLockOption = settings.screenLockOptions || 'NONE';
    document.getElementById("personalisationInactiveScreen").value = screenLockOption;
    const isScreenIdleEnabled = ['SCREENSAVER', 'LOCKSCREEN'].includes(screenLockOption);
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = isScreenIdleEnabled ? 'table-row' : 'none';
    document.getElementById("personalisationIdleDuration").value = settings.screenLockDuration || 300;
}

function renderSecurityOptions() {
    const settings = getSettings();
    const passcodeProtection = settings.securityPasscodeProtection || 'NO';
    document.getElementById("securityPasscodeProtection").value = passcodeProtection;
    document.getElementById("passcodeActionsArea").style.display = passcodeProtection === 'YES' ? 'table-row' : 'none';
}

/* Actions */
function changePersonalisationTheme(themeName) {
    document.body.className = document.body.className.replace(/skin-[a-z-]+/g, themeName);
    window.localStorage.appCustomSettings_Theme = themeName;
    updateSetting("theme", themeName);
    renderPersonalisations(); // Re-render to update the checkmark
    showToast('Theme changed successfully', '#27ae60');
}

function changePersonalisationImage() {
    const value = document.getElementById("personalisationEditImage").value;
    window.localStorage.appCustomSettings_ImageDisplay = (value === 'YES');
    updateSetting("menuImages", value);
    showToast(`Menu photos have been ${value === 'YES' ? 'enabled' : 'disabled'}.`, '#27ae60');
}

function changePersonalisationKeyboard() {
    const value = parseInt(document.getElementById("personalisationEditKeyboard").value, 10);
    window.localStorage.appCustomSettings_Keyboard = value;
    updateSetting("virtualKeyboard", value);
    const message = ['disabled', 'activated on input only', 'enabled'][value] || 'configured';
    showToast(`Virtual Keyboard is ${message}.`, '#27ae60');
}

function changePersonalisationLock() {
    const optName = document.getElementById("personalisationInactiveScreen").value;
    if (optName === 'LOCKSCREEN' && !window.localStorage.appCustomSettings_InactivityToken) {
        showToast('Warning! Set a passcode before enabling the lock screen.', '#e67e22');
        openSystemSettings('systemSecurity');
        return;
    }
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = (optName !== 'NONE') ? 'table-row' : 'none';
    window.localStorage.appCustomSettings_InactivityEnabled = optName;
    updateSetting("screenLockOptions", optName);
    initScreenSaver(); // This function should exist elsewhere
    showToast('Screen inactivity settings updated.', '#27ae60');
}

function changePersonalisationIdleDuration() {
    const duration = document.getElementById("personalisationIdleDuration").value;
    window.localStorage.appCustomSettings_InactivityScreenDelay = duration;
    updateSetting("screenLockDuration", duration);
    initScreenSaver(); // This function should exist elsewhere
    showToast('Screen idle duration updated.', '#27ae60');
}

/* Security Options */
function changeSecurityPasscodeProtection() {
    const shouldEnable = document.getElementById("securityPasscodeProtection").value === 'YES';
    if (shouldEnable) {
        document.getElementById("setNewPassCodeModal").style.display = 'block';
    } else {
        document.getElementById("confirmCurrentPassCodeModal").style.display = 'block';
    }
}

function securityPasscodeProtectionSetCode() {
    const newCode = document.getElementById("screenlock_passcode_new").value;
    const confirmCode = document.getElementById("screenlock_passcode_confirm").value;

    if (newCode.length !== 4) {
        showToast('Warning! Passcode must be 4 characters long.', '#e67e22');
        return;
    }
    if (newCode !== confirmCode) {
        showToast('Failed! Codes do not match.', '#e74c3c');
        return;
    }

    window.localStorage.appCustomSettings_InactivityToken = btoa(newCode);
    window.localStorage.appCustomSettings_PasscodeProtection = true;
    updateSetting("securityPasscodeProtection", 'YES');
    showToast('Passcode Protection has been enabled.', '#27ae60');
    securityPasscodeProtectionSetCodeHIDE();
}

function securityPasscodeProtectionSetCodeHIDE() {
    document.getElementById("setNewPassCodeModal").style.display = 'none';
    renderSecurityOptions();
}

function securityPasscodeProtectionConfirmCode() {
    const currentPassword = atob(window.localStorage.appCustomSettings_InactivityToken || '');
    const enteredPassword = document.getElementById("screenlock_passcode_old_confirm").value;

    if (enteredPassword === currentPassword) {
        window.localStorage.appCustomSettings_PasscodeProtection = false;
        updateSetting("securityPasscodeProtection", 'NO');
        window.localStorage.appCustomSettings_InactivityToken = '';
        if (window.localStorage.appCustomSettings_InactivityEnabled === 'LOCKSCREEN') {
            window.localStorage.appCustomSettings_InactivityEnabled = '';
        }
        showToast('Passcode Protection has been disabled.', '#27ae60');
        securityPasscodeProtectionConfirmCodeHIDE();
    } else {
        showToast('Failed! Incorrect code.', '#e74c3c');
    }
}

function securityPasscodeProtectionConfirmCodeHIDE() {
    document.getElementById("confirmCurrentPassCodeModal").style.display = 'none';
    renderSecurityOptions();
}

// Other functions like changePasscodeToNew, recoveryPasscodeLogin etc. seem to rely on localStorage and external APIs,
// so they are left as is, assuming they don't interact with the flat-file system directly for settings.