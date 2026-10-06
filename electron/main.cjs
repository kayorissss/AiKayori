const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron')
const path = require('path')

let mainWindow = null
let tray = null
let isQuiting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0A0A0A',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    title: 'AI-Kayori', // No version in taskbar
    icon: path.join(__dirname, '../public/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setOpacity(0)
    let opacity = 0
    const interval = setInterval(() => {
      opacity += 0.1
      if (opacity >= 1) {
        opacity = 1
        clearInterval(interval)
      }
      mainWindow.setOpacity(opacity)
    }, 20)
    // Start maximized, not mini
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize()
    }
  })

  const prodPath = path.join(__dirname, '../dist/index.html')
  const devUrl = 'http://localhost:5173'

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(prodPath)
    })
  } else {
    mainWindow.loadFile(prodPath)
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('app-version', app.getVersion())
  })

  // Hide to tray on close, not quit
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      mainWindow.hide()
      return false
    }
  })

  // Create tray
  try {
    const iconPath = path.join(__dirname, '../public/icons/icon.png')
    tray = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Открыть AI-Kayori', click: () => { mainWindow.show(); mainWindow.focus() } },
      { type: 'separator' },
      { label: 'Новый чат', click: () => { mainWindow.show(); mainWindow.webContents.send('new-chat') } },
      { label: 'Настройки', click: () => { mainWindow.show(); mainWindow.webContents.send('open-settings') } },
      { type: 'separator' },
      { label: 'Закрыть', click: () => { isQuiting = true; app.quit() } }
    ])
    tray.setToolTip('AI-Kayori')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      mainWindow.show()
      mainWindow.focus()
    })
  } catch (e) {
    console.error('Tray error', e)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // Don't quit, stay in tray
  if (process.platform !== 'darwin' && isQuiting) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else mainWindow.show()
})

app.on('before-quit', () => {
  isQuiting = true
})

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => {
  mainWindow?.hide() // Hide to tray instead of close
})
ipcMain.on('window-quit', () => {
  isQuiting = true
  app.quit()
})
ipcMain.on('window-hide', () => mainWindow?.hide())
ipcMain.on('window-show', () => { mainWindow?.show(); mainWindow?.focus() })

ipcMain.handle('check-updates', async () => {
  return {
    current: app.getVersion(),
    latest: app.getVersion(),
    updateAvailable: false,
    message: `AI-Kayori — последняя версия`
  }
})

ipcMain.handle('show-save-dialog', async (_, options) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})
