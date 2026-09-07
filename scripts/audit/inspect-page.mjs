/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 *
 * Diagnostic companion to `e2e/page-health.spec.ts`.
 *
 * The sweep says a page has 54 stuck skeletons or a rendered NaN; this says
 * WHICH widget and WHICH request produced it, which is the part you need to
 * fix it. Prints every non-2xx or empty API response the page made, the
 * nearest labelled ancestor of each surviving loading placeholder, and the
 * elements holding a broken value.
 *
 * Usage: node scripts/audit/inspect-page.mjs <url> [settleMs]
 */
import { chromium } from '@playwright/test';

const url = process.argv[2];
const settle = Number(process.argv[3] ?? 6000);
if (!url) {
  console.error('usage: node scripts/audit/inspect-page.mjs <url> [settleMs]');
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const api = [];
page.on('response', async (res) => {
  const u = new URL(res.url());
  if (!u.pathname.startsWith('/api/')) return;
  let size = 0;
  let preview = '';
  try {
    const body = await res.text();
    size = body.length;
    preview = body.slice(0, 160).replace(/\s+/g, ' ');
  } catch {
    preview = '<unreadable>';
  }
  api.push({ path: u.pathname + u.search, status: res.status(), size, preview });
});

const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`[uncaught] ${e.message}`));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(settle);

const dom = await page.evaluate(() => {
  const labelFor = (el) => {
    let node = el;
    for (let i = 0; i < 8 && node; i++) {
      const heading = node.querySelector?.('h1, h2, h3, h4, [data-widget]');
      if (heading?.textContent?.trim()) return heading.textContent.trim().slice(0, 60);
      node = node.parentElement;
    }
    return el.className?.toString().slice(0, 70) ?? '<unlabelled>';
  };

  // `.animate-pulse` also drives live-status dots, which pulse by design.
  // Only sizeable, empty blocks are loading placeholders.
  const skeletons = [...document.querySelectorAll('.animate-pulse, [data-testid="skeleton"]')]
    .filter((el) => {
      if ((el.textContent ?? '').trim().length > 0) return false;
      const box = el.getBoundingClientRect();
      return box.width >= 24 && box.height >= 8;
    })
    .map(labelFor);

  const broken = [];
  // Skip <script>/<style>: the RSC payload is full of the literal word
  // "undefined" and is never rendered text.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(node.parentElement?.tagName ?? '')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent?.trim() ?? '';
    if (!/\bNaN\b|\bundefined\b|Invalid Date|\[object Object\]/.test(text)) continue;
    broken.push({ text: text.slice(0, 80), where: labelFor(n.parentElement) });
  }

  const zeros = [];
  for (const el of document.querySelectorAll('main :is(span,div,p,dd,td,h1,h2,h3,h4,strong,b)')) {
    if (el.children.length) continue;
    const text = el.textContent?.trim() ?? '';
    if (/^(\$0(\.0+)?|0(\.0+)?%|\$0\.00)$/.test(text)) zeros.push({ text, where: labelFor(el) });
  }

  return { skeletons, broken, zeros };
});

const tally = (rows) =>
  [...rows.reduce((m, r) => m.set(r, (m.get(r) ?? 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `  ${n}x ${k}`)
    .join('\n');

console.log(`\n=== ${url} ===`);
console.log(`\nAPI calls (${api.length}):`);
for (const r of api) {
  const flag = r.status >= 400 ? 'FAIL' : r.size < 60 ? 'THIN' : 'ok  ';
  console.log(`  ${flag} ${r.status} ${r.size}b ${r.path}\n       ${r.preview}`);
}
if (dom.skeletons.length) console.log(`\nStuck skeletons (${dom.skeletons.length}):\n${tally(dom.skeletons)}`);
if (dom.broken.length) {
  console.log(`\nBroken values (${dom.broken.length}):`);
  for (const b of dom.broken) console.log(`  "${b.text}"  in  ${b.where}`);
}
if (dom.zeros.length) {
  console.log(`\nZero stats (${dom.zeros.length}):`);
  for (const z of dom.zeros) console.log(`  ${z.text}  in  ${z.where}`);
}
if (consoleErrors.length) {
  console.log(`\nConsole errors (${consoleErrors.length}):`);
  for (const e of consoleErrors.slice(0, 15)) console.log(`  ${e.slice(0, 200)}`);
}

await browser.close();
