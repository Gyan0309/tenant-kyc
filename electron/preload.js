// The renderer loads the trusted local Next.js app over http://127.0.0.1.
// contextIsolation stays on and nodeIntegration off; we expose a tiny, explicit
// bridge: a desktop flag and a themed-title-bar updater.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  isDesktop: true,
  // Recolor the native window-controls overlay to match the app theme.
  setTitleBarTheme: (isDark) =>
    ipcRenderer.send("set-titlebar-theme", Boolean(isDark)),
});
