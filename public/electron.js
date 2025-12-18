// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, protocol, ipcMain, shell } = require("electron");
const path = require("path");
const url = require("url");

let splash;
let mainWindow;

// Create the native browser window.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    backgroundColor: '#f5f5f5',
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true
    },
  });

  // Create splash screen
  splash = new BrowserWindow({ 
    width: 400, 
    height: 300, 
    transparent: true, 
    frame: false, 
    alwaysOnTop: true,
    skipTaskbar: true
  });
  splash.loadURL(`file://${__dirname}/splash.html`);

  // Load the app
  let appURL;
  if (app.isPackaged) {
    // For packaged app, load from resources
    appURL = url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    });
  } else {
    appURL = "http://localhost:3000";
  }
  
  mainWindow.loadURL(appURL);

  // Debug: Log loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Show main window when ready
  mainWindow.once('ready-to-show', () => {
    if (splash && !splash.isDestroyed()) {
      splash.destroy();
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Setup IPC handlers
function setupIPC() {
  // Window controls
  ipcMain.on('minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.on('maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('enter-fullscreen', () => {
    if (mainWindow) mainWindow.maximize();
  });

  ipcMain.on('restore-fullscreen', () => {
    if (mainWindow) mainWindow.unmaximize();
  });

  // External links
  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });
}

// Setup local file protocol
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const requestUrl = request.url.substr(8);
      callback({ path: path.normalize(`${__dirname}/${requestUrl}`) });
    }
  );
}

// App ready
app.whenReady().then(() => {
  createWindow();
  setupIPC();
  setupLocalFilesNormalizerProxy();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Limit navigation
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Allow localhost for development and file protocol for production
    if (!parsedUrl.protocol.includes('file') && !parsedUrl.hostname.includes('localhost')) {
      event.preventDefault();
    }
  });
  
  // Prevent new window creation
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.