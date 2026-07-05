// The renderer loads the trusted local Next.js app over http://127.0.0.1, so no
// bridge APIs are exposed. contextIsolation stays on and nodeIntegration off;
// this file exists so the sandboxed renderer has an explicit (empty) preload.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  isDesktop: true,
});
