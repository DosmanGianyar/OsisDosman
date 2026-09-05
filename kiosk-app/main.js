const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Load Configuration
let config = {
  serverUrl: 'http://36.93.15.146:8080/login',
  kioskMode: true,
  fullscreen: true,
  allowExitShortcut: true,
  exitShortcut: 'CommandOrControl+Shift+Q'
};

const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const rawData = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(rawData) };
  } catch (err) {
    console.error('Error reading config.json, using defaults:', err.message);
  }
}

let mainWindow = null;

function createWindow() {
  // Remove default application menu (removes File, Edit, View, Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: config.fullscreen !== false,
    kiosk: config.kioskMode !== false,
    autoHideMenuBar: true,
    title: 'Bilik Suara E-Voting OSIS — SMAN 1 Gianyar',
    icon: path.join(__dirname, '../public/assets/logo_dosman.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false // Completely disable DevTools
    }
  });

  // Block right-click context menu
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Prevent navigation to external sites outside server
  mainWindow.webContents.on('will-navigate', (e, url) => {
    try {
      const targetHost = new URL(url).host;
      const allowedHost = new URL(config.serverUrl).host;
      if (targetHost !== allowedHost) {
        e.preventDefault();
      }
    } catch (err) {
      e.preventDefault();
    }
  });

  // Handle load failures (e.g. server down or no internet)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode !== -3) { // Ignore ABORTED errors
      console.warn(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
      mainWindow.loadFile(path.join(__dirname, 'error.html'));
    }
  });

  // Load target voting login URL
  mainWindow.loadURL(config.serverUrl);

  // Close window event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Register emergency exit shortcut for administrators/proctors
  if (config.allowExitShortcut && config.exitShortcut) {
    globalShortcut.register(config.exitShortcut, () => {
      app.quit();
    });
  }

  // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+R
  const blockedShortcuts = ['F12', 'CommandOrControl+Shift+I', 'CommandOrControl+Shift+J', 'CommandOrControl+U', 'CommandOrControl+R', 'F5'];
  blockedShortcuts.forEach(key => {
    try {
      globalShortcut.register(key, () => {
        // Block action silently
      });
    } catch (e) {
      // Ignore
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  // Unregister all global shortcuts on quit
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
