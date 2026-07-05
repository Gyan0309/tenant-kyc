// Generates the SAGA app icon from an inline SVG (no design tool needed):
//   build-resources/icon.ico   -> Windows app / installer icon (electron-builder)
//   build-resources/icon.png   -> BrowserWindow / taskbar icon (512px)
//   app/favicon.ico            -> browser tab icon
//
// Re-run with: npm run gen:icon
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const root = process.cwd();

// App mark: flat blue rounded square with a white "ledger" glyph (no gradient).
const BRAND = "#2f6fd6";
function svg(size) {
  const s = size;
  const r = Math.round(size * 0.22); // corner radius
  const bx = size * 0.28; // bars left
  const bw = size * 0.44; // full bar width
  const bh = size * 0.085; // bar height
  const br = bh / 2;
  const y1 = size * 0.31;
  const gap = size * 0.145;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="${BRAND}"/>
  <rect x="${bx}" y="${y1}" width="${bw}" height="${bh}" rx="${br}" fill="#ffffff"/>
  <rect x="${bx}" y="${y1 + gap}" width="${bw}" height="${bh}" rx="${br}" fill="#ffffff" fill-opacity="0.85"/>
  <rect x="${bx}" y="${y1 + gap * 2}" width="${bw * 0.6}" height="${bh}" rx="${br}" fill="#ffffff" fill-opacity="0.6"/>
</svg>`;
}

function renderPng(size) {
  const resvg = new Resvg(svg(size), {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

const buildRes = path.join(root, "build-resources");
ensureDir(buildRes);

// Master PNG for window/taskbar.
fs.writeFileSync(path.join(buildRes, "icon.png"), renderPng(512));

// Multi-resolution ICO for Windows.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = icoSizes.map((s) => renderPng(s));
const ico = await pngToIco(icoBuffers);
fs.writeFileSync(path.join(buildRes, "icon.ico"), ico);
fs.writeFileSync(path.join(root, "app", "favicon.ico"), ico);

console.log(
  `Icon generated: build-resources/icon.ico (${icoSizes.join(",")}), icon.png (512), app/favicon.ico`,
);
