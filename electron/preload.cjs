const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  quit: () => ipcRenderer.send('window-quit'),
  hide: () => ipcRenderer.send('window-hide'),
  show: () => ipcRenderer.send('window-show'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  onAppVersion: (cb) => {
    ipcRenderer.on('app-version', (_, v) => cb(v))
  },
  onNewChat: (cb) => {
    ipcRenderer.on('new-chat', () => cb())
  },
  onOpenSettings: (cb) => {
    ipcRenderer.on('open-settings', () => cb())
  },
  openExternal: (url) => {
    ipcRenderer.send('open-external', url)
  }
})
