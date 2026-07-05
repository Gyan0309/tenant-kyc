// Next's `output: 'standalone'` intentionally omits `public/` and
// `.next/static/` (it assumes a CDN). For a self-contained desktop bundle we
// copy them into the standalone folder so its server.js serves them directly.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error(
    "Missing .next/standalone. Run `next build` (with output: 'standalone') first.",
  );
  process.exit(1);
}

function copyInto(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

const staticCopied = copyInto(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
);
const publicCopied = copyInto(
  path.join(root, "public"),
  path.join(standalone, "public"),
);

console.log(
  `Standalone assets ready: static=${staticCopied ? "ok" : "skipped"}, public=${publicCopied ? "ok" : "skipped"}`,
);
