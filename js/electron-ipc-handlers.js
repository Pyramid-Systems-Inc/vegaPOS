const { ipcMain } = require('electron');
const { db } = require('./js/database-init.js');

// Handle login
ipcMain.handle('vega-login', async (event, username, password) => {
  try {
    const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
    if (!userSettings || !userSettings.value_json) return { success: false, error: 'No users found.' };
    const users = JSON.parse(userSettings.value_json);
    const user = users.find(u => u.code === username && u.password === password);
    if (user) {
      return { success: true, user: { name: user.name, code: user.code, role: user.role, branch: user.branch || '', branchCode: user.branchCode || '' } };
    } else {
      return { success: false, error: 'Invalid username or password.' };
    }
  } catch (err) {
    return { success: false, error: 'System Error: Unable to login.' };
  }
});

// Handle get all users
ipcMain.handle('vega-get-all-users', async () => {
  try {
    const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
    if (!userSettings || !userSettings.value_json) return [];
    return JSON.parse(userSettings.value_json);
  } catch (err) {
    return [];
  }
});

// Handle add user
ipcMain.handle('vega-add-user', async (event, user) => {
  try {
    const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
    const users = userSettings && userSettings.value_json ? JSON.parse(userSettings.value_json) : [];
    users.push(user);
    db.prepare("UPDATE settings SET value_json = ? WHERE key = 'userprofiles'").run(JSON.stringify(users));
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Unable to add user.' };
  }
});
