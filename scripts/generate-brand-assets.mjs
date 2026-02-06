#!/usr/bin/env node
/**
 * Generate all PNG brand assets from SVG sources.
 * 
 * Usage: node scripts/generate-brand-assets.mjs
 * 
 * Requires: sharp (npm install sharp)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const ICONS = join(PUBLIC, 'icons');
const SPLASH = join(PUBLIC, 'splash');

// Ensure sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp not found. Installing...');
  const { execSync } = await import('child_process');
  execSync('npm install sharp', { cwd: ROOT, stdio: 'inherit' });
  sharp = (await import('sharp')).default;
}

// ── SVG Templates ──────────────────────────────────────────────────────

function iconSVG(size) {
  // Simple monochrome ₿ on black rounded rect
  const rx = Math.round(size * 0.1875); // proportional corner radius
  const fontSize = Math.round(size * 0.55);
  const yPos = Math.round(size * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#000"/>
  <text x="${size/2}" y="${yPos}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
</svg>`;
}

function maskableIconSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#000"/>
  <g transform="translate(${size/2}, ${size/2}) scale(0.7) translate(-${size/2}, -${size/2})">
    <text x="${size/2}" y="${Math.round(size*0.62)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size*0.55)}" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
  </g>
</svg>`;
}

function badgeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size*0.15)}" fill="#000"/>
  <text x="${size/2}" y="${Math.round(size*0.62)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size*0.45)}" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
</svg>`;
}

function msIconSVG(w, h) {
  const size = Math.min(w, h);
  const fontSize = Math.round(size * 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#000"/>
  <text x="${w/2}" y="${Math.round(h*0.6)}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
</svg>`;
}

function shortcutSVG(size, symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size*0.2)}" fill="#000"/>
  <text x="${size/2}" y="${Math.round(size*0.63)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size*0.42)}" font-weight="700" fill="#fff" text-anchor="middle">${symbol}</text>
</svg>`;
}

function ogImageSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#000"/>
  
  <!-- Subtle grid -->
  <g opacity="0.04" stroke="#fff" stroke-width="1">
    <line x1="0" y1="157" x2="1200" y2="157"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="473" x2="1200" y2="473"/>
    <line x1="300" y1="0" x2="300" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="900" y1="0" x2="900" y2="630"/>
  </g>
  
  <!-- Bitcoin symbol -->
  <text x="600" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="200" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
  
  <!-- Brand name -->
  <text x="600" y="490" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="400" fill="#666" text-anchor="middle" letter-spacing="6">CRYPTOCURRENCY.CV</text>
  
  <!-- Tagline -->
  <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#444" text-anchor="middle" letter-spacing="2">FREE CRYPTO NEWS</text>
</svg>`;
}

function splashSVG(w, h, mode = 'dark') {
  const bg = mode === 'dark' ? '#000' : '#fff';
  const fg = mode === 'dark' ? '#fff' : '#000';
  const muted = mode === 'dark' ? '#555' : '#999';
  const symbolSize = Math.min(w, h) * 0.2;
  const textSize = Math.min(w, h) * 0.035;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <text x="${w/2}" y="${h/2}" font-family="system-ui, -apple-system, sans-serif" font-size="${symbolSize}" font-weight="700" fill="${fg}" text-anchor="middle">₿</text>
  <text x="${w/2}" y="${h/2 + symbolSize * 0.7}" font-family="system-ui, -apple-system, sans-serif" font-size="${textSize}" font-weight="400" fill="${muted}" text-anchor="middle" letter-spacing="3">CRYPTOCURRENCY.CV</text>
</svg>`;
}

function appleTouchIconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#000"/>
  <text x="90" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="100" font-weight="700" fill="#fff" text-anchor="middle">₿</text>
</svg>`;
}

// ── PNG Generation ─────────────────────────────────────────────────────

async function svgToPng(svgString, outputPath) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer).png().toFile(outputPath);
  console.log(`  ✓ ${outputPath.replace(ROOT + '/', '')}`);
}

async function svgToPngResized(svgString, outputPath, width, height) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer).resize(width, height).png().toFile(outputPath);
  console.log(`  ✓ ${outputPath.replace(ROOT + '/', '')}`);
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  await mkdir(ICONS, { recursive: true });
  await mkdir(SPLASH, { recursive: true });

  console.log('\n🔲 Generating monochrome brand assets for cryptocurrency.cv\n');

  // ── Standard icons ──
  console.log('Icons:');
  const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of iconSizes) {
    await svgToPng(iconSVG(size), join(ICONS, `icon-${size}x${size}.png`));
  }

  // ── Maskable icons ──
  console.log('\nMaskable icons:');
  for (const size of [192, 512]) {
    await svgToPng(maskableIconSVG(size), join(ICONS, `maskable-icon-${size}x${size}.png`));
  }

  // ── Badge ──
  console.log('\nBadge:');
  await svgToPng(badgeSVG(72), join(ICONS, 'badge-72x72.png'));

  // ── MS tiles ──
  console.log('\nMS tiles:');
  await svgToPng(msIconSVG(70, 70), join(ICONS, 'ms-icon-70x70.png'));
  await svgToPng(msIconSVG(150, 150), join(ICONS, 'ms-icon-150x150.png'));
  await svgToPng(msIconSVG(310, 310), join(ICONS, 'ms-icon-310x310.png'));
  await svgToPng(msIconSVG(310, 150), join(ICONS, 'ms-icon-310x150.png'));

  // ── Shortcut icons ──
  console.log('\nShortcut icons:');
  const shortcuts = [
    { name: 'latest', symbol: '↗' },
    { name: 'breaking', symbol: '!' },
    { name: 'bitcoin', symbol: '₿' },
    { name: 'api', symbol: '/' },
  ];
  for (const { name, symbol } of shortcuts) {
    await svgToPng(shortcutSVG(96, symbol), join(ICONS, `shortcut-${name}.png`));
  }

  // ── Apple touch icon ──
  console.log('\nApple touch icon:');
  await svgToPng(appleTouchIconSVG(), join(PUBLIC, 'apple-touch-icon.png'));

  // ── OG Image (social share) ──
  console.log('\nOG Image (social share):');
  await svgToPng(ogImageSVG(), join(PUBLIC, 'og-image.png'));

  // ── Favicon ICO (from 32x32 PNG) ──
  console.log('\nFavicon:');
  // Generate a 32x32 PNG then convert to ICO format
  const favicon32 = Buffer.from(iconSVG(32));
  // sharp doesn't support ICO output directly, but we can make a PNG-based favicon
  // Modern browsers support SVG favicons, so just ensure the 32x32 PNG exists
  await sharp(favicon32).png().toFile(join(PUBLIC, 'favicon-32x32.png'));
  console.log('  ✓ public/favicon-32x32.png (use favicon.svg as primary)');

  // ── Splash screens ──
  console.log('\nSplash screens:');
  const splashSizes = [
    [640, 1136],
    [750, 1334],
    [1125, 2436],
    [1242, 2688],
    [1536, 2048],
    [1668, 2388],
    [2048, 2732],
  ];
  for (const [w, h] of splashSizes) {
    await svgToPng(splashSVG(w, h, 'dark'), join(SPLASH, `apple-splash-${w}-${h}.png`));
  }
  // Dark & light theme splash (generic)
  await svgToPng(splashSVG(1125, 2436, 'dark'), join(SPLASH, 'apple-splash-dark.png'));
  await svgToPng(splashSVG(1125, 2436, 'light'), join(SPLASH, 'apple-splash-light.png'));

  console.log('\n✅ All brand assets generated!\n');
  console.log('Note: favicon.ico was not regenerated (use favicon.svg as primary).');
  console.log('To create a .ico file, use: https://realfavicongenerator.net/ or `convert favicon-32x32.png favicon.ico`\n');
}

main().catch(console.error);
