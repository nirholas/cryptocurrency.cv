#!/usr/bin/env node
/**
 * Patch Next.js writeFileAtomic to create parent directories before writing.
 *
 * Turbopack's writeFileAtomic creates a temp file in the same directory as the
 * target, but sometimes the directory (.next/static/<buildId>/) doesn't yet
 * exist at that point, causing ENOENT. This patch adds a mkdirSync call.
 *
 * @see https://github.com/vercel/next.js/issues/XXXXX (upstream bug)
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_PATCH = [
  'node_modules/next/dist/lib/fs/write-atomic.js',
  'node_modules/next/dist/esm/lib/fs/write-atomic.js',
];

let patched = 0;

for (const relPath of FILES_TO_PATCH) {
  const filePath = path.resolve(__dirname, '..', relPath);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') continue;
    throw err;
  }

  // Skip if already patched
  if (content.includes('mkdirSync')) {
    continue;
  }

  // CJS version
  content = content.replace(
    /const _fs = require\("fs"\);\nconst _rename = require\("\.\/rename"\);/,
    'const _fs = require("fs");\nconst _path = require("path");\nconst _rename = require("./rename");'
  );

  // ESM version
  content = content.replace(
    /import \{ unlinkSync, writeFileSync \} from 'fs';/,
    "import { mkdirSync, unlinkSync, writeFileSync } from 'fs';\nimport { dirname } from 'path';"
  );

  // CJS: add mkdirSync before writeFileSync
  content = content.replace(
    /(\s+try \{\n\s+)\(0, _fs\.writeFileSync\)\(tempPath,/,
    '$1const dir = _path.dirname(tempPath);\n        (0, _fs.mkdirSync)(dir, { recursive: true });\n        (0, _fs.writeFileSync)(tempPath,'
  );

  // ESM: add mkdirSync before writeFileSync
  content = content.replace(
    /(\s+try \{\n\s+)writeFileSync\(tempPath,/,
    '$1mkdirSync(dirname(tempPath), { recursive: true });\n        writeFileSync(tempPath,'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  patched++;
  console.log(`[patch-next] Patched ${relPath}`);
}

if (patched > 0) {
  console.log(`[patch-next] ${patched} file(s) patched successfully`);
} else {
  console.log('[patch-next] No files needed patching (already patched or not found)');
}
