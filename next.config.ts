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
  // MuPDF's WASM binary is loaded at runtime by the Aadhaar PDF decryptor and
  // isn't picked up by static import tracing — include it explicitly so it
  // ships in the standalone/packaged build.
  outputFileTracingIncludes: {
    // MuPDF (Aadhaar decrypt) + Jimp (photo optimize) are loaded at runtime and
    // aren't fully picked up by static tracing — include them explicitly.
    "/api/tenants": [
      "./node_modules/mupdf/dist/**",
      "./node_modules/jimp/**",
      "./node_modules/@jimp/**",
    ],
  },
};

export default nextConfig;
