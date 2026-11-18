#!/usr/bin/env node
/**
 * Regenerate the tool table in README.md from the tool registry.
 *
 * The table lives between the TOOLS:START and TOOLS:END markers, so the docs
 * can never drift from the code: add a tool in src/tools.ts, run
 * `npm run docs:tools`, and the README follows.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const readmePath = path.join(root, 'README.md');

const START = '<!-- TOOLS:START -->';
const END = '<!-- TOOLS:END -->';

const { TOOLS, TOOL_GROUPS } = await import(path.join(root, 'dist/tools.js'));

function escapeCell(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

const lines = [`**${TOOLS.length} tools.** Every tool maps onto one real REST route of the API.`, ''];

for (const group of TOOL_GROUPS) {
  const inGroup = TOOLS.filter((tool) => tool.group === group);
  if (inGroup.length === 0) continue;
  lines.push(`### ${group} (${inGroup.length})`, '');
  lines.push('| Tool | Does | Calls |');
  lines.push('| --- | --- | --- |');
  for (const tool of inGroup) {
    lines.push(
      `| \`${tool.name}\` | ${escapeCell(tool.description)} | \`${escapeCell(tool.endpoint)}\` |`,
    );
  }
  lines.push('');
}

const readme = await readFile(readmePath, 'utf8');
const startAt = readme.indexOf(START);
const endAt = readme.indexOf(END);
if (startAt === -1 || endAt === -1) {
  console.error(`README.md is missing the ${START} / ${END} markers.`);
  process.exit(1);
}

const next =
  readme.slice(0, startAt + START.length) +
  '\n\n' +
  lines.join('\n').trimEnd() +
  '\n\n' +
  readme.slice(endAt);

if (next === readme) {
  console.log(`README.md already lists all ${TOOLS.length} tools.`);
} else {
  await writeFile(readmePath, next);
  console.log(`README.md updated: ${TOOLS.length} tools across ${TOOL_GROUPS.length} groups.`);
}
