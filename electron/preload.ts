import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  showSaveDialog: (opts: any) => ipcRenderer.invoke('show-save-dialog', opts),
  onAppVersion: (cb: (v: string) => void) => {
    ipcRenderer.on('app-version', (_, v) => cb(v))
  }
})

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      checkUpdates: () => Promise<any>
      showSaveDialog: (opts: any) => Promise<any>
      onAppVersion: (cb: (v: string) => void) => void
    }
  }
}
