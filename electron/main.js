const { app, BrowserWindow, dialog, shell, Menu } = require("electron");
const path = require("node:path");
const { loadConfig, toEnv, configPath } = require("./config");
const { startServer, resolveServerEntry } = require("./server");

// Ensure only one instance runs (a second launch focuses the existing window).
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;
let serverChild = null;

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: "Tenant Manager",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links (mailto, http to other origins) in the system browser
  // instead of inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith(url)) return { action: "allow" };
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.loadURL(url);
}

function showFatal(title, message) {
  dialog.showErrorBox(title, message);
}

// First-run / misconfiguration flow: if the operator has not filled in the
// Azure connection strings yet, open config.json and explain, then exit.
function promptForConfig(cfg) {
  const { response } = { response: 0 };
  dialog.showMessageBoxSync({
    type: "info",
    title: "Tenant Manager — configuration needed",
    message: "Azure Storage connection is not configured yet.",
    detail:
      `This install needs its Azure Storage connection strings before it can run.\n\n` +
      `Edit this file and fill in the two AZURE_* values, then reopen the app:\n\n${cfg.path}\n\n` +
      `Missing: ${cfg.missing.join(", ")}`,
    buttons: ["Open config file and quit"],
    defaultId: 0,
  });
  void response;
  shell.showItemInFolder(cfg.path);
  shell.openPath(cfg.path);
}

async function boot() {
  const userDataDir = app.getPath("userData");

  let cfg;
  try {
    cfg = loadConfig(userDataDir);
  } catch (err) {
    showFatal("Configuration error", `Could not read ${configPath(userDataDir)}:\n\n${err.message}`);
    app.quit();
    return;
  }

  if (cfg.missing.length > 0) {
    promptForConfig(cfg);
    app.quit();
    return;
  }

  let serverEntry;
  try {
    serverEntry = resolveServerEntry({
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
      appRoot: app.getAppPath(),
    });
  } catch (err) {
    showFatal("Startup error", err.message);
    app.quit();
    return;
  }

  try {
    const { url, child } = await startServer({
      execPath: process.execPath,
      serverEntry,
      env: toEnv(cfg.config),
      onLog: (line) => process.stdout.write(`[next] ${line}`),
    });
    serverChild = child;
    child.on("exit", (code) => {
      if (code && code !== 0 && !app.isQuiting) {
        showFatal("Server stopped", `The Tenant Manager server exited unexpectedly (code ${code}).`);
        app.quit();
      }
    });
    createWindow(url);
  } catch (err) {
    showFatal("Startup error", `The Tenant Manager server failed to start:\n\n${err.message}`);
    app.quit();
  }
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // A minimal application menu; the app is otherwise chrome-free.
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: "fileMenu" },
      { role: "editMenu" },
      { role: "viewMenu" },
      { role: "windowMenu" },
    ]),
  );
  boot();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) boot();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  app.isQuiting = true;
  if (serverChild) {
    serverChild.kill();
    serverChild = null;
  }
});
