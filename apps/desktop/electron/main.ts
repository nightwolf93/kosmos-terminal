import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import * as pty from 'node-pty';
import os from 'os';
import { LLMConnector } from 'agent';

// Determine the correct shell for the OS
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── main.js
// │ └─┬ dist-electron
// │   ├── main.js
// │   └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST, '../public')
  : process.env.DIST

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = "http://localhost:3000"

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // Spawn pty process
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  // Relay data from pty to renderer
  ptyProcess.on('data', function (data) {
    win?.webContents.send('pty-data', data);
  });

  // Relay data from renderer to pty
  ipcMain.on('pty-write', (event, data) => {
    ptyProcess.write(data);
  });

  // Handle LLM command explanation
  const llmConnector = new LLMConnector();
  ipcMain.handle('llm-explain-command', async (event, command) => {
    return await llmConnector.explainCommand(command);
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
