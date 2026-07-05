// Starts the packaged Next.js standalone server as a child process and waits
// until it is accepting connections. The standalone build lives outside the
// asar archive (extraResources) so it can be executed from disk.

const { spawn } = require("node:child_process");
const net = require("node:net");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

const HOSTNAME = "127.0.0.1";

// Ask the OS for a free ephemeral port so multiple installs / other apps never
// collide. Cookies are port-agnostic, so a dynamic port is fine for auth.
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, HOSTNAME, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Resolve the standalone server.js. In a packaged app it is unpacked to
// resources/standalone; in local `npm run build` it sits in .next/standalone.
function resolveServerEntry({ isPackaged, resourcesPath, appRoot }) {
  const candidates = isPackaged
    ? [path.join(resourcesPath, "standalone", "server.js")]
    : [path.join(appRoot, ".next", "standalone", "server.js")];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `Could not find the Next.js standalone server. Looked in:\n${candidates.join("\n")}\n` +
      `Run "npm run build" first.`,
  );
}

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`Next server did not start within ${timeoutMs}ms`));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

// Launches the server and resolves with { url, child }. `env` carries the
// Azure/auth config from the per-install config file.
async function startServer({ execPath, serverEntry, env, onLog }) {
  const port = await findFreePort();
  const url = `http://${HOSTNAME}:${port}`;

  const child = spawn(execPath, [serverEntry], {
    cwd: path.dirname(serverEntry),
    env: {
      ...process.env,
      // Run the bundled Electron binary as a plain Node process.
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME,
      PORT: String(port),
      // NextAuth callback/base URL must match where the server actually listens.
      AUTH_URL: url,
      NEXTAUTH_URL: url,
      AUTH_TRUST_HOST: "true",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (onLog) {
    child.stdout.on("data", (d) => onLog(d.toString()));
    child.stderr.on("data", (d) => onLog(d.toString()));
  }

  await waitForServer(url);
  return { url, child };
}

module.exports = { startServer, resolveServerEntry, findFreePort };
