import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Produce a self-contained server at `.next/standalone` so the Electron
  // desktop shell can run it without a full `node_modules` install.
  // See docs/desktop-packaging.md.
  output: "standalone",
  // Pin the file-tracing root to this project so the standalone trace is
  // deterministic regardless of parent lockfiles on the build machine.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
