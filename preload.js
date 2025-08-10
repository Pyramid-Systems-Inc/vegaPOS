const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vegaAPI', {
  login: (username, password) => ipcRenderer.invoke('vega-login', username, password),
  getAllUsers: () => ipcRenderer.invoke('vega-get-all-users'),
  addUser: (user) => ipcRenderer.invoke('vega-add-user', user),
  // Add more APIs as needed
});
