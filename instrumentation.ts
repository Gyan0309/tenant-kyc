// Runs once when the Next.js server starts. Ensures the Azure Storage tables
// and blob containers exist so a fresh install (or a new per-client storage
// account) works without a manual `npm run bootstrap` step. Idempotent:
// creating an existing table/container is a no-op.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.AZURE_TABLE_CONNECTION_STRING) return;

  try {
    const { ensureTablesExist } = await import("@/lib/azure/tables");
    const { ensureContainersExist } = await import("@/lib/azure/blobs");
    await ensureTablesExist();
    await ensureContainersExist();
    console.log("[startup] Azure tables and containers ready");
  } catch (err) {
    // Non-fatal: the app still starts and surfaces a storage error on first
    // data access (see app/dashboard/error.tsx) rather than failing to boot.
    console.error("[startup] storage provisioning skipped:", err);
  }
}
