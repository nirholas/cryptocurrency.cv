#!/usr/bin/env node
/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Regenerates the community credits from src/data/contributors.json:
 *   - the README section between the contributors markers
 *   - CONTRIBUTORS.md
 *   - the THANKS block of public/humans.txt
 *
 * Usage:
 *   node scripts/generate-contributors.mjs          write the files
 *   node scripts/generate-contributors.mjs --check  exit 1 if any is stale
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  README_END,
  README_START,
  applyHumansThanks,
  renderContributorsMd,
  renderReadmeSection,
  replaceBetween,
} from './lib/contributors.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const data = JSON.parse(read('src/data/contributors.json'));

const outputs = {
  'README.md': replaceBetween(read('README.md'), README_START, README_END, renderReadmeSection(data)),
  'CONTRIBUTORS.md': renderContributorsMd(data),
  'public/humans.txt': applyHumansThanks(read('public/humans.txt'), data),
};

const check = process.argv.includes('--check');
let stale = 0;
for (const [path, next] of Object.entries(outputs)) {
  let current = '';
  try {
    current = read(path);
  } catch {
    // A missing file is simply stale.
  }
  if (current === next) continue;
  stale++;
  if (check) console.error(`stale: ${path}`);
  else writeFileSync(resolve(root, path), next);
}

if (check && stale) {
  console.error('Run `npm run contributors:generate` and commit the result.');
  process.exit(1);
}
console.log(check ? 'contributors: up to date' : `contributors: wrote ${stale} file(s)`);
