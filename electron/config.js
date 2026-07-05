// Per-install runtime configuration for the desktop app.
//
// The Azure Storage connection strings are NOT baked into the app bundle.
// They are read at runtime from a JSON file in the OS user-data directory:
//
//   Windows: %APPDATA%/Tenant Manager/config.json
//
// This is the seam that keeps "one shared account now, per-client account
// later" a config edit rather than a rebuild. Each install can point at its
// own Azure Storage account by editing this file. See docs/desktop-packaging.md.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// Keys the Next.js server expects as environment variables. Azure connection
// strings are required; container names and AUTH_SECRET have safe defaults.
const REQUIRED_KEYS = [
  "AZURE_TABLE_CONNECTION_STRING",
  "AZURE_STORAGE_CONNECTION_STRING",
];

function configPath(userDataDir) {
  return path.join(userDataDir, "config.json");
}

function template(authSecret) {
  return {
    AZURE_TABLE_CONNECTION_STRING: "",
    AZURE_STORAGE_CONNECTION_STRING: "",
    AZURE_BLOB_CONTAINER_DOCS: "tenant-documents",
    AZURE_BLOB_CONTAINER_ASSETS: "property-assets",
    // Persisted so JWT sessions survive app restarts. Auto-generated on first
    // run; the operator only needs to fill in the two Azure strings.
    AUTH_SECRET: authSecret,
  };
}

// Loads config.json, creating a template on first run. Returns
// { config, path, created, missing } where `missing` lists required keys that
// are still empty (so the caller can prompt the operator to fill them in).
function loadConfig(userDataDir) {
  const file = configPath(userDataDir);
  let created = false;

  if (!fs.existsSync(file)) {
    fs.mkdirSync(userDataDir, { recursive: true });
    const seed = template(crypto.randomBytes(32).toString("base64"));
    fs.writeFileSync(file, JSON.stringify(seed, null, 2) + "\n", "utf8");
    created = true;
  }

  const config = JSON.parse(fs.readFileSync(file, "utf8"));

  // Backfill an AUTH_SECRET if an older/edited config is missing one.
  if (!config.AUTH_SECRET) {
    config.AUTH_SECRET = crypto.randomBytes(32).toString("base64");
    fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n", "utf8");
  }

  const missing = REQUIRED_KEYS.filter((k) => !config[k] || !String(config[k]).trim());

  return { config, path: file, created, missing };
}

// Translates the config object into the environment the Next server reads.
function toEnv(config) {
  return {
    AZURE_TABLE_CONNECTION_STRING: config.AZURE_TABLE_CONNECTION_STRING || "",
    AZURE_STORAGE_CONNECTION_STRING: config.AZURE_STORAGE_CONNECTION_STRING || "",
    AZURE_BLOB_CONTAINER_DOCS: config.AZURE_BLOB_CONTAINER_DOCS || "tenant-documents",
    AZURE_BLOB_CONTAINER_ASSETS: config.AZURE_BLOB_CONTAINER_ASSETS || "property-assets",
    AUTH_SECRET: config.AUTH_SECRET,
    NEXTAUTH_SECRET: config.AUTH_SECRET,
  };
}

module.exports = { loadConfig, toEnv, configPath, REQUIRED_KEYS };
