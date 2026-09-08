#!/usr/bin/env node
/**
 * check-links.mjs
 *
 * Offline relative-link checker for Markdown. Walks README.md, CONTRIBUTING.md
 * and docs/**\/*.md (plus any paths given on the command line), extracts
 * [text](target) and <a href="target"> links, and verifies that every relative
 * target resolves to a file or directory on disk. External URLs, mailto:,
 * and in-page #anchors are skipped. Exit 1 when any link is dead.
 *
 * Usage: node scripts/check-links.mjs [file-or-dir ...]
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targets = args.length ? args : ['README.md', 'CONTRIBUTING.md', 'docs', 'locales', 'scripts/README.md'];

function walk(p, out = []) {
  const abs = resolve(root, p);
  if (!existsSync(abs)) return out;
  const st = statSync(abs);
  if (st.isDirectory()) {
    for (const e of readdirSync(abs)) {
      if (e === 'node_modules' || e === 'site' || e.startsWith('.')) continue;
      walk(join(p, e), out);
    }
  } else if (extname(abs) === '.md') out.push(abs);
  return out;
}

const files = targets.flatMap((t) => walk(t));
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<a\s+[^>]*href="([^"]+)"|<img\s+[^>]*src="([^"]+)"/g;
let dead = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  // Strip fenced code blocks so example links in code are not checked.
  const stripped = text.replace(/```[\s\S]*?```/g, '');
  for (const m of stripped.matchAll(LINK_RE)) {
    const raw = (m[1] ?? m[2] ?? m[3]).trim();
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(raw)) continue;
    if (raw.startsWith('/')) continue; // site-absolute path; served by the app, not the repo
    if (raw.startsWith('<')) continue;
    const noAnchor = raw.split('#')[0].split('?')[0];
    if (!noAnchor) continue;
    const dest = resolve(dirname(file), decodeURIComponent(noAnchor));
    if (!existsSync(dest)) {
      dead++;
      console.log(`${file.replace(root + '/', '')}: dead link -> ${raw}`);
    }
  }
}
console.log(`check-links: ${files.length} files scanned, ${dead} dead relative links`);
process.exit(dead ? 1 : 0);
