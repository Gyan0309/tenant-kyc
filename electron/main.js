const { app, BrowserWindow, dialog, shell, Menu, ipcMain } = require("electron");
const path = require("node:path");
const { loadConfig, toEnv, configPath } = require("./config");
const { startServer, resolveServerEntry } = require("./server");

// Window-controls-overlay colors per theme (must match app tokens / splash).
const TITLEBAR = {
  light: { color: "#ffffff", symbolColor: "#334155", height: 34 },
  dark: { color: "#0f1115", symbolColor: "#e5e7eb", height: 34 },
};

// The web app reports its resolved theme; recolor the native controls to match.
ipcMain.on("set-titlebar-theme", (_event, isDark) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setTitleBarOverlay(isDark ? TITLEBAR.dark : TITLEBAR.light);
    } catch {
      // setTitleBarOverlay is unavailable on some platforms — ignore.
    }
  }
});

// Ensure only one instance runs (a second launch focuses the existing window).
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;
let serverChild = null;
let appUrl = null;

function resolveIcon() {
  // Shipped only in dev/unpacked; packaged windows inherit the exe icon.
  const p = path.join(__dirname, "..", "build-resources", "icon.png");
  return require("node:fs").existsSync(p) ? p : undefined;
}

// Create the window up front and show a local splash immediately, so the user
// sees branding instead of a blank frame while the Next server boots.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: "Tenant Manager",
    // Matches the splash background so there's no white flash before paint.
    backgroundColor: "#0f1115",
    icon: resolveIcon(),
    // Frameless with a themed Window Controls Overlay: no native title bar or
    // menu, but the OS min/maximize/close buttons are kept and recolored to
    // match the app. Starts matching the (dark) splash; the web app updates it
    // to the active theme via IPC. The draggable strip is rendered by
    // components/desktop-chrome.tsx.
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: TITLEBAR.dark,
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

  // Open external links in the system browser instead of inside the shell.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (appUrl && target.startsWith(appUrl)) return { action: "allow" };
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.loadFile(path.join(__dirname, "splash.html"));
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

  // Show the splash window immediately while the server spins up.
  createWindow();

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
    appUrl = url;
    child.on("exit", (code) => {
      if (code && code !== 0 && !app.isQuiting) {
        showFatal("Server stopped", `The Tenant Manager server exited unexpectedly (code ${code}).`);
        app.quit();
      }
    });
    if (mainWindow) mainWindow.loadURL(url);
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
  // No application menu — the app has no File/Edit/View bar.
  Menu.setApplicationMenu(null);
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
