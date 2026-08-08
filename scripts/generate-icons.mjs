/**
 * Generates every icon in the project from one master SVG.
 *
 *   node scripts/generate-icons.mjs
 *
 * Run it after changing the mark below and everything stays in sync: the desktop
 * app icon, the Windows installer, the PWA icons, the favicon and the README
 * logo. Before this existed they were hand-copied and had drifted apart — the
 * app shipped a lightning bolt in the UI and a cardboard box on the taskbar.
 *
 * Requires `sharp`, which is a devDependency only used here.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ─── The mark ─────────────────────────────────────────────────────────────

/** Indigo → violet, matching --accent and the `text-gradient` utility. */
const GRADIENT_FROM = '#5b5bd6';
const GRADIENT_TO = '#8b5cf6';

/**
 * lucide's `Zap` path, in its native 24×24 box. The same glyph the sidebar and
 * mobile header render, so the installed icon matches what's inside the app.
 */
const BOLT =
  'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z';

/** Visual bounds of that path, used to centre it optically. */
const BOLT_BOX = { x: 3.2, y: 1.5, w: 17.6, h: 21 };

/**
 * @param {object} options
 * @param {number} options.size        canvas size in px
 * @param {number} options.boltScale   bolt height as a fraction of the canvas
 * @param {number} options.radius      corner radius as a fraction (0 = square)
 */
function masterSvg({ size, boltScale, radius }) {
  const scale = (size * boltScale) / BOLT_BOX.h;
  const x = size / 2 - (BOLT_BOX.x + BOLT_BOX.w / 2) * scale;
  const y = size / 2 - (BOLT_BOX.y + BOLT_BOX.h / 2) * scale;
  const r = size * radius;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GRADIENT_FROM}"/>
      <stop offset="1" stop-color="${GRADIENT_TO}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="${BOLT}" fill="#ffffff"/>
  </g>
</svg>`;
}

/** App-icon proportions: the squircle radius platforms expect, bolt at 56%. */
const standard = (size) => masterSvg({ size, boltScale: 0.56, radius: 0.225 });

/** Maskable/Apple: full bleed, smaller mark. The OS applies its own mask and
 *  can crop to a circle, so the glyph sits inside the 80% safe zone. */
const fullBleed = (size) => masterSvg({ size, boltScale: 0.44, radius: 0 });

// ─── ICO container ────────────────────────────────────────────────────────

/**
 * Pack PNG buffers into an .ico.
 *
 * PNG-compressed entries are what Vista and later expect, and are what keeps a
 * 256px icon from bloating the file. electron-builder hands this straight to
 * NSIS, which also reads them.
 */
function buildIco(images) {
  const HEADER = 6;
  const ENTRY = 16;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;
  const entries = [];

  for (const { size, data } of images) {
    const entry = Buffer.alloc(ENTRY);
    // 0 encodes 256 — the field is a single byte.
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function pngSet(svgFor, sizes) {
  return Promise.all(
    sizes.map(async (size) => ({
      size,
      data: await sharp(Buffer.from(svgFor(size))).resize(size, size).png().toBuffer(),
    })),
  );
}

// ─── Outputs ──────────────────────────────────────────────────────────────

const write = async (file, buffer) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, buffer);
  console.log(`  ${file.padEnd(34)} ${(buffer.length / 1024).toFixed(1)} KB`);
};

const png = async (file, svgFor, size) => {
  const buffer = await sharp(Buffer.from(svgFor(size))).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  await write(file, buffer);
};

console.log('\nDesktop (electron-builder reads build/):');
// 1024 is what electron-builder wants to generate a full macOS .icns from.
await png('build/icon.png', standard, 1024);

// Windows taskbar and Explorer pick different sizes out of the same file; a
// purpose-built multi-size ico stays sharp at 16px where a downscaled 1024
// would turn to mush.
const winSizes = [16, 24, 32, 48, 64, 128, 256];
await write('build/icon.ico', buildIco(await pngSet(standard, winSizes)));
await write('build/installerIcon.ico', buildIco(await pngSet(standard, winSizes)));
await write('build/uninstallerIcon.ico', buildIco(await pngSet(standard, winSizes)));

console.log('\nWeb and PWA (public/):');
await png('public/icon-192.png', standard, 192);
await png('public/icon-512.png', standard, 512);
await png('public/icon-maskable-512.png', fullBleed, 512);
// iOS ignores transparency and applies its own corner mask.
await png('public/apple-icon.png', fullBleed, 180);
await png('public/logo.png', standard, 512);
await write('public/favicon.ico', buildIco(await pngSet(standard, [16, 32, 48])));

console.log('\nBrowser tab (src/app/):');
// Next serves this directly as the SVG favicon; keep it byte-identical in shape
// to the rasters so the tab and the taskbar agree.
await write('src/app/icon.svg', Buffer.from(standard(512)));

console.log('\nDone. All icons regenerated from the same master.\n');
