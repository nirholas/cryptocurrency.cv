/**
 * Renders the toolbar icon set (16/32/48/128 px PNG) from an inline SVG with
 * sharp. Runs as the first step of `pnpm run build` so a fresh clone always
 * has icons; the output directory is gitignored.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../public/icons');
const sizes = [16, 32, 48, 128] as const;

/** Orange rounded square with a white "newspaper" glyph and a bitcoin-orange accent bar. */
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb347"/>
      <stop offset="1" stop-color="#f7931a"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="120" height="120" rx="26" fill="url(#g)"/>
  <rect x="26" y="30" width="76" height="68" rx="8" fill="#ffffff"/>
  <rect x="36" y="42" width="30" height="22" rx="3" fill="#f7931a"/>
  <rect x="72" y="42" width="20" height="5" rx="2.5" fill="#1a1a1a" opacity="0.75"/>
  <rect x="72" y="51" width="20" height="5" rx="2.5" fill="#1a1a1a" opacity="0.55"/>
  <rect x="72" y="60" width="14" height="5" rx="2.5" fill="#1a1a1a" opacity="0.35"/>
  <rect x="36" y="72" width="56" height="5" rx="2.5" fill="#1a1a1a" opacity="0.55"/>
  <rect x="36" y="82" width="42" height="5" rx="2.5" fill="#1a1a1a" opacity="0.35"/>
</svg>`;

await mkdir(outDir, { recursive: true });
await Promise.all(
  sizes.map(async (size) => {
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    await writeFile(resolve(outDir, `icon${size}.png`), png);
  }),
);
console.log(`icons written to ${outDir}: ${sizes.map((s) => `icon${s}.png`).join(', ')}`);
