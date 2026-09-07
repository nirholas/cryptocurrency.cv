/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * @fileoverview Whole-site page-health sweep.
 *
 * The console-error scanner answers "did this page throw?". It cannot answer
 * "is this page actually working?", and those are different questions: the
 * homepage rendered a Market Cap of $0, a 24h Volume of $0 and a BTC Dominance
 * of 0.0% for weeks with a completely silent console, because the widget asked
 * an endpoint for fields it does not return and quietly summed `undefined` to
 * zero. This sweep is the check that catches that class of failure.
 *
 * Per page it asserts:
 *   - the document answered 2xx (a 500 renders an error UI and logs nothing);
 *   - no error-boundary or crash copy is on screen;
 *   - the main region rendered substantive text rather than an empty shell;
 *   - no skeleton placeholders survive past the settle window (stuck loading);
 *   - no rendered value reads `NaN`, `undefined`, `null` or `Invalid Date`;
 *   - no statistic tile reads a zero money/percent value, which on this site
 *     always means the upstream field was missing rather than genuinely zero.
 *
 * Usage:
 *   npm run build && npm start                 # or point BASE_URL at prod
 *   npm run audit:pages
 *   BASE_URL=https://cryptocurrency.cv npm run audit:pages
 */

import { test, expect, type Page } from '@playwright/test';
import { allPages, EMBED_PAGES } from './lib/routes';

/** How long to wait for client widgets to fetch and paint (ms). */
const SETTLE_TIME = 5_000;

/** Max time to wait for the document (ms). */
const NAV_TIMEOUT = 45_000;

const PAGES = [...allPages(), ...EMBED_PAGES];

/** Copy that only appears when a page has failed to render. */
const CRASH_COPY: RegExp[] = [
  /application error:/i,
  /a client-side exception has occurred/i,
  /internal server error/i,
  /something went wrong/i,
  /this page could not be found/i,
  /unhandled runtime error/i,
];

/**
 * Placeholder values that are never a legitimate thing to show a reader. Each
 * one means a value reached the DOM without being checked first.
 */
const BROKEN_VALUES: { pattern: RegExp; label: string }[] = [
  { pattern: /\bNaN\b/, label: 'NaN' },
  { pattern: /\$NaN|NaN%/, label: 'NaN in a formatted value' },
  { pattern: /\bundefined\b/, label: 'undefined' },
  { pattern: /Invalid Date/, label: 'Invalid Date' },
  { pattern: /\[object Object\]/, label: '[object Object]' },
];

/**
 * A zero money or percentage value in a summary tile. A market aggregate is
 * never actually zero, so a rendered `$0` or `0.0%` there is a missing upstream
 * field rather than a measurement: the homepage banner read "$0 / $0 / 0.0%"
 * for weeks that way.
 *
 * Two contexts legitimately show a zero and are excluded below rather than
 * whitelisted after the fact: a row in a data table (an illiquid token really
 * can report no 24h volume) and a price (a free plan really does cost $0).
 */
const ZERO_STAT = /^(\$0(\.0+)?|0(\.0+)?%|\$0\.00)$/;

/**
 * Routes where a rendered zero is a real measurement, with the reason. Each
 * entry is a deliberate exemption, not a way to quiet a failing page.
 *
 *  - pricing, keys: the free plan costs $0. That is the product.
 *  - sources: the page exists to report feed health, and a category whose
 *    every feed is currently unreachable honestly is 0% healthy. Hiding that
 *    would defeat the page.
 */
const ZERO_IS_REAL_PAGES = ['/en/pricing', '/en/keys', '/en/sources'];

interface Finding {
  kind: 'status' | 'crash-copy' | 'empty' | 'stuck-skeleton' | 'broken-value' | 'zero-stat';
  detail: string;
}

/**
 * Text nodes that carry a rendered statistic. Restricted to short leaf
 * elements so a `$0` inside a paragraph of prose (a pricing page saying "$0
 * forever") is not mistaken for a broken tile.
 */
async function readStatValues(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const nodes = document.querySelectorAll<HTMLElement>(
      'main :is(span, div, p, dd, td, h1, h2, h3, h4, strong, b)',
    );
    for (const el of nodes) {
      if (el.children.length > 0) continue; // leaf nodes only
      // A cell in a data table reports one row's measurement, which can
      // honestly be zero. Only summary tiles are asserted on.
      if (el.closest('table')) continue;
      const text = el.textContent?.trim() ?? '';
      if (text.length === 0 || text.length > 12) continue;
      out.push(text);
    }
    return out;
  });
}

/**
 * Count loading placeholders still on screen.
 *
 * `.animate-pulse` is not only a skeleton class on this site: it also drives
 * the small "live" dot next to a status badge, a live preview and the pump
 * screener's activity indicator. Those pulse forever by design, so a bare class
 * count reports a healthy page as stuck. A real placeholder is a sizeable,
 * empty block, which is what this measures.
 */
async function countStuckSkeletons(page: Page): Promise<number> {
  return page.evaluate(() => {
    let stuck = 0;
    for (const el of document.querySelectorAll<HTMLElement>(
      '[data-testid="skeleton"], .animate-pulse',
    )) {
      if ((el.textContent ?? '').trim().length > 0) continue; // a pulsing label, not a placeholder
      const box = el.getBoundingClientRect();
      if (box.width < 24 || box.height < 8) continue; // a live dot, not a placeholder
      stuck += 1;
    }
    return stuck;
  });
}

async function auditPage(page: Page, route: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  let status = 0;
  try {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    status = response?.status() ?? 0;
  } catch (err) {
    return [{ kind: 'status', detail: `navigation failed: ${(err as Error).message}` }];
  }

  if (status >= 400 || status === 0) {
    findings.push({ kind: 'status', detail: `document answered HTTP ${status}` });
    return findings;
  }

  await page.waitForTimeout(SETTLE_TIME);

  const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';

  for (const pattern of CRASH_COPY) {
    if (pattern.test(bodyText)) {
      findings.push({ kind: 'crash-copy', detail: `page renders "${pattern.source}"` });
    }
  }

  // An embed is a bare widget with no <main>; the site pages all have one.
  const isEmbed = route.startsWith('/embed/');
  const scope = isEmbed ? page.locator('body') : page.locator('main');
  const mainText = (await scope.innerText().catch(() => '')) || '';

  if (isEmbed) {
    // A widget can legitimately carry almost no text: the chart embed is a
    // single iframe and the fear-and-greed embed is a gauge drawn in SVG.
    // What matters is that it painted something rather than nothing.
    const painted = await page
      .locator('body iframe, body svg, body canvas, body img')
      .count()
      .catch(() => 0);
    if (painted === 0 && mainText.trim().length < 40) {
      findings.push({ kind: 'empty', detail: 'widget rendered no content' });
    }
  } else if (mainText.trim().length < 120) {
    findings.push({
      kind: 'empty',
      detail: `main region rendered ${mainText.trim().length} characters of text`,
    });
  }

  // A page whose widgets are merely slow is not a broken page, and under a
  // parallel sweep every page is slower than it is on its own. Give a page
  // that still shows placeholders a second window before calling it stuck.
  let skeletons = await countStuckSkeletons(page);
  if (skeletons > 0) {
    await page.waitForTimeout(SETTLE_TIME);
    skeletons = await countStuckSkeletons(page);
  }
  if (skeletons > 0) {
    findings.push({
      kind: 'stuck-skeleton',
      detail: `${skeletons} loading placeholder(s) still on screen after ${SETTLE_TIME * 2}ms`,
    });
  }

  for (const { pattern, label } of BROKEN_VALUES) {
    if (pattern.test(mainText)) {
      findings.push({ kind: 'broken-value', detail: `rendered ${label}` });
    }
  }

  const stats = ZERO_IS_REAL_PAGES.includes(route) ? [] : await readStatValues(page);
  const zeros = stats.filter((value) => ZERO_STAT.test(value));
  if (zeros.length > 0) {
    findings.push({
      kind: 'zero-stat',
      detail: `${zeros.length} zero-valued statistic(s): ${[...new Set(zeros)].join(', ')}`,
    });
  }

  return findings;
}

test.describe('Page health sweep', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const route of PAGES) {
    test(`renders working content: ${route}`, async ({ page }) => {
      const findings = await auditPage(page, route);
      const report = findings.map((f, i) => `  ${i + 1}. [${f.kind}] ${f.detail}`).join('\n');
      expect(findings.length, `${route} has ${findings.length} problem(s):\n${report}`).toBe(0);
    });
  }
});
