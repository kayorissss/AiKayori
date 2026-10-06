import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0A0A0A',
    frame: false, // custom titlebar
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    icon: path.join(__dirname, '../public/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  // Smooth show
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // fade in animation
    mainWindow?.setOpacity(0)
    let opacity = 0
    const interval = setInterval(() => {
      opacity += 0.1
      if (opacity >= 1) {
        opacity = 1
        clearInterval(interval)
      }
      mainWindow?.setOpacity(opacity)
    }, 20)
  })

  const devUrl = 'http://localhost:5173'
  const prodPath = path.join(__dirname, '../dist/index.html')

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow?.loadFile(prodPath)
    })
  } else {
    mainWindow.loadFile(prodPath)
  }

  // Auto updater check (stub)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('app-version', app.getVersion())
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC for custom titlebar
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

ipcMain.handle('check-updates', async () => {
  // In real app: use electron-updater
  // Here: simulate check via GitHub releases
  return {
    current: app.getVersion(),
    latest: app.getVersion(),
    updateAvailable: false,
    message: `AI-Kayori v${app.getVersion()} — последняя версия`
  }
})

ipcMain.handle('show-save-dialog', async (_, options) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})
