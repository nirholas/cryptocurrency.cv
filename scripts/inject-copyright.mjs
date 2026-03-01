#!/usr/bin/env node
/**
 * inject-copyright.mjs — Adds copyright/license headers to ALL project source files.
 * Safe to re-run: skips files that already contain the marker.
 *
 * Usage: node scripts/inject-copyright.mjs [--dry-run]
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DRY_RUN = process.argv.includes('--dry-run');

const OWNER = 'nirholas';
const YEARS = '2024-2026';
const REPO = 'https://github.com/nirholas/free-crypto-news';
const MARKER = 'This file is part of free-crypto-news';

// ── Directories to skip (exact folder names) ────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'coverage',
  '.turbo', '.vercel', '__pycache__', '.cache', '.output',
]);

// ── File patterns to skip ────────────────────────────────────────────────────
const SKIP_FILE_PATTERNS = [
  /\.d\.ts$/,
  /\.min\.(js|css)$/,
  /\.map$/,
  /\.snap$/,
  /pnpm-lock\.yaml$/,
  /package-lock\.json$/,
];

// ── Headers by file extension ────────────────────────────────────────────────
const JS_HEADER = `/**
 * @copyright ${YEARS} ${OWNER}. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see ${REPO}
 *
 * ${MARKER}.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */`;

const HASH_HEADER = `# Copyright ${YEARS} ${OWNER}. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# ${REPO}
#
# ${MARKER}.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com`;

const SLASH_HEADER = `// Copyright ${YEARS} ${OWNER}. All rights reserved.
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// ${REPO}
//
// ${MARKER}.
// Unauthorized copying, modification, or distribution is strictly prohibited.
// For licensing inquiries: nirholas@users.noreply.github.com`;

const CSS_HEADER = `/*
 * @copyright ${YEARS} ${OWNER}. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see ${REPO}
 *
 * ${MARKER}.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */`;

const SQL_HEADER = `-- Copyright ${YEARS} ${OWNER}. All rights reserved.
-- SPDX-License-Identifier: SEE LICENSE IN LICENSE
-- ${REPO}
--
-- ${MARKER}.
-- Unauthorized copying, modification, or distribution is strictly prohibited.`;

const SOL_HEADER = `// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// Copyright ${YEARS} ${OWNER}. All rights reserved.
// ${REPO}
//
// ${MARKER}.
// Unauthorized copying, modification, or distribution is strictly prohibited.`;

const HEADERS = {
  '.ts':  JS_HEADER,
  '.tsx': JS_HEADER,
  '.js':  JS_HEADER,
  '.jsx': JS_HEADER,
  '.mjs': JS_HEADER,
  '.py':  HASH_HEADER,
  '.sh':  HASH_HEADER,
  '.go':  SLASH_HEADER,
  '.php': JS_HEADER,
  '.css': CSS_HEADER,
  '.sql': SQL_HEADER,
  '.sol': SOL_HEADER,
};

let injected = 0;
let skipped = 0;
let errors = 0;

// ── Walk the file tree ───────────────────────────────────────────────────────
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const promises = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      promises.push(walk(fullPath));
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (!HEADERS[ext]) continue;
      if (SKIP_FILE_PATTERNS.some(p => p.test(entry.name))) continue;

      promises.push(processFile(fullPath, ext));
    }
  }

  await Promise.all(promises);
}

// ── Process a single file ────────────────────────────────────────────────────
async function processFile(filePath, ext) {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Already has our header
    if (content.includes(MARKER)) {
      skipped++;
      return;
    }

    const header = HEADERS[ext];
    const newContent = injectHeader(content, header, ext);

    if (!DRY_RUN) {
      await writeFile(filePath, newContent, 'utf-8');
    }
    injected++;
    if (DRY_RUN) {
      console.log(`  [dry-run] ${relative(ROOT, filePath)}`);
    }
  } catch (err) {
    console.error(`  ERROR: ${relative(ROOT, filePath)}: ${err.message}`);
    errors++;
  }
}

// ── Insert header respecting shebangs, 'use client', PHP tags, etc. ──────────
function injectHeader(content, header, ext) {
  const lines = content.split('\n');
  const firstLine = lines[0] || '';

  // Shebang — must stay on line 1
  if (firstLine.startsWith('#!')) {
    return firstLine + '\n\n' + header + '\n\n' + lines.slice(1).join('\n');
  }

  // 'use client' / 'use server' directives (Next.js) — must stay on line 1
  if (/^['"]use (client|server)['"];?\s*$/.test(firstLine)) {
    return firstLine + '\n\n' + header + '\n\n' + lines.slice(1).join('\n');
  }

  // PHP opening tag
  if (ext === '.php' && firstLine.startsWith('<?php')) {
    return firstLine + '\n\n' + header + '\n\n' + lines.slice(1).join('\n');
  }

  // Python encoding declaration
  if (ext === '.py' && /^# -\*-/.test(firstLine)) {
    return firstLine + '\n\n' + header + '\n\n' + lines.slice(1).join('\n');
  }

  // Default: header at top
  return header + '\n\n' + content;
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`🔒 Injecting copyright headers${DRY_RUN ? ' (DRY RUN)' : ''}...`);
console.log(`   Root: ${ROOT}\n`);

await walk(ROOT);

console.log(`\n✅ Done!`);
console.log(`   Injected: ${injected}`);
console.log(`   Skipped (already had header): ${skipped}`);
if (errors > 0) console.log(`   Errors: ${errors}`);
