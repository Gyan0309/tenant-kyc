import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { ensureTablesExist } = await import("../lib/azure/tables");
  const { ensureContainersExist } = await import("../lib/azure/blobs");

  console.log("Creating Azure Tables...");
  await ensureTablesExist();
  console.log("Creating Blob containers...");
  try {
    await ensureContainersExist();
  } catch (err) {
    console.warn(
      "Blob container bootstrap skipped. If using Azurite, restart it with --skipApiVersionCheck or upgrade Azurite.",
    );
    console.warn(err);
  }
  console.log("Bootstrap complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
