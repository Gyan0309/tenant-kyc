import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Electron main-process + packaging tooling. These run in Node's CommonJS
    // context (require/module.exports), not the Next.js app bundle, so the
    // app's TS/Next lint rules do not apply.
    "electron/**",
    "scripts/postbuild-standalone.mjs",
    "dist-desktop/**",
  ]),
]);

export default eslintConfig;
