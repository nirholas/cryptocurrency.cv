#!/usr/bin/env node
/**
 * check-scripts.mjs
 *
 * Verifies that every npm script in package.json points at a file that exists.
 * For each script it extracts the first path-like token (something containing a
 * "/" or ending in a known script extension) from the command and checks it on
 * disk. Scripts that only call binaries (next, vitest, eslint...) are skipped.
 *
 * Usage:
 *   node scripts/check-scripts.mjs          # report, exit 1 if anything is missing
 *   node scripts/check-scripts.mjs --json   # machine-readable output
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const json = process.argv.includes('--json');

const FILE_EXT = /\.(m?[jt]sx?|sh|py|json|ya?ml)$/;

/** Return the first token of a command that looks like a file path, or null. */
function firstFileArg(command) {
  // Split on shell operators so `cd mcp && npm start` is examined per segment.
  const segments = command.split(/\s*(?:&&|\|\||;|\|)\s*/);
  for (const seg of segments) {
    const tokens = seg.trim().split(/\s+/);
    for (const tok of tokens) {
      if (tok.startsWith('-') || tok.includes('=') && !tok.includes('/')) continue;
      if (tok.startsWith('http')) continue;
      const clean = tok.replace(/^["']|["']$/g, '');
      const isPath = clean.startsWith('./') || clean.startsWith('scripts/') || clean.startsWith('docs/') || clean.startsWith('e2e/') || clean.startsWith('src/');
      if (isPath || (FILE_EXT.test(clean) && clean.includes('/'))) {
        // Strip glob characters; a glob is checked by its static prefix directory.
        const globIdx = clean.search(/[*{?]/);
        return globIdx === -1 ? clean : clean.slice(0, globIdx).replace(/\/[^/]*$/, '');
      }
    }
    // `cd <dir>` segments: the directory itself must exist.
    const cd = seg.trim().match(/^cd\s+(\S+)/);
    if (cd) return cd[1];
  }
  return null;
}

const results = [];
for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
  const file = firstFileArg(command);
  if (!file) { results.push({ name, command, file: null, status: 'binary' }); continue; }
  const ok = existsSync(resolve(root, file));
  results.push({ name, command, file, status: ok ? 'ok' : 'missing' });
}

const missing = results.filter((r) => r.status === 'missing');

if (json) {
  console.log(JSON.stringify({ total: results.length, missing }, null, 2));
} else {
  const checked = results.filter((r) => r.file).length;
  console.log(`check-scripts: ${results.length} scripts, ${checked} reference a file, ${missing.length} missing`);
  for (const r of missing) console.log(`  MISSING  ${r.name.padEnd(28)} -> ${r.file}`);
  if (!missing.length) console.log('  all script targets exist');
}
process.exit(missing.length ? 1 : 0);
