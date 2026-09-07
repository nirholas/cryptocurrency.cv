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
 * @fileoverview Automated console-error scanner for every page.
 *
 * Instead of opening the browser DevTools on each page manually, run:
 *
 *   bunx playwright test e2e/console-errors.spec.ts --project=chromium
 *
 * For a quick scan of a single page:
 *   bunx playwright test e2e/console-errors.spec.ts --project=chromium -g "/en/markets"
 *
 * What it checks on every page:
 *   - Console errors & warnings (JS exceptions, React errors, etc.)
 *   - Uncaught page-level exceptions (window.onerror)
 *   - Failed network requests (HTTP 4xx/5xx, network failures)
 *   - Page crash events
 *
 * The test deliberately does NOT fail on warnings — only errors.
 * Failed resource loads for external services (analytics, ads) are also excluded
 * from the error count to reduce noise.
 */

import { test, expect, type Page, type ConsoleMessage, type Request } from '@playwright/test';
import { discoverStaticPages, DYNAMIC_PAGES, NON_LOCALE_PAGES } from './lib/routes';

// ─── Configuration ───────────────────────────────────────────────────────────

/** How long to wait for the page to settle after navigation (ms) */
const SETTLE_TIME = 3_000;

/** Max time to wait for page load (ms) */
const NAV_TIMEOUT = 30_000;

/**
 * Domains whose failed network requests we ignore (analytics, ads, 3rd-party
 * widgets that are expected to fail in dev/test environments).
 */
const IGNORED_DOMAINS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'plausible.io',
  'vercel-insights.com',
  'vitals.vercel-insights.com',
  'cloudflareinsights.com',
  'sentry.io',
  'hotjar.com',
  'intercom.io',
  'crisp.chat',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unsplash.com',
  // Google's favicon service 404s for any domain it has no icon for. That is
  // the service telling us it has no icon, not a fault on our side, and the
  // /sources page asks it about every feed we index.
  'gstatic.com/faviconV2',
];

/**
 * Console message text patterns to ignore. These are common harmless messages
 * from Next.js dev mode, browser extensions, or 3rd-party scripts.
 */
const IGNORED_CONSOLE_PATTERNS = [
  /download the react devtools/i,
  /third-party cookie/i,
  /deprecated.*api/i,
  /webpack/i,
  /hot module replacement/i,
  /fast refresh/i,
  /hydration/i, // Next.js hydration warnings in dev mode
  /did not expect server html/i,
  /extra attributes from the server/i,
  /punycode/i,
  /prop.*did not match/i,
  /cannot update a component/i, // React strict-mode double-render warning
  /finddomnode is deprecated/i,
  /each child in a list should have a unique/i, // key warning — useful but not a hard error
  /act\(\.\.\.\)/i, // React testing warnings leaking
  /next-intl/i, // next-intl locale messages loading
  /NEXT_REDIRECT/i, // Next.js redirect signals
  /text content does not match/i, // SSR/client date mismatch
  // Chrome hides the status text for cross-origin responses, so a bare
  // "status of 404 ()" is always a third-party resource — the response
  // listener already judges those against IGNORED_DOMAINS, but the console
  // message carries no URL to match on. A same-origin 404 reads
  // "status of 404 (Not Found)" and is still counted.
  /Failed to load resource: the server responded with a status of \d+ \(\)$/,
];

// ─── All static routes (no dynamic params) ───────────────────────────────────

/**
 * The page list is derived from the app directory by `e2e/lib/routes`, shared
 * with the page-health sweep. It used to be hand-maintained here and it rotted:
 * 58 of its entries had been deleted from the app and 33 live pages were never
 * scanned, so the run reported a wall of 404-page noise while real pages went
 * unchecked.
 */
const STATIC_PAGES: string[] = [...discoverStaticPages(), ...NON_LOCALE_PAGES];

const ALL_PAGES = [...STATIC_PAGES, ...DYNAMIC_PAGES];

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface PageError {
  type: 'console-error' | 'page-error' | 'request-failed' | 'crash';
  message: string;
  url?: string;
}

function isIgnoredDomain(url: string): boolean {
  return IGNORED_DOMAINS.some((d) => url.includes(d));
}

function isIgnoredConsoleMessage(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((p) => p.test(text));
}

/**
 * True when the request is App Router navigation plumbing rather than page
 * content: a route prefetch, or an RSC payload fetch for a navigation.
 *
 * Next fires a prefetch for every <Link> in the viewport and starts an RSC
 * fetch on hover or click, then cancels whatever is still in flight when the
 * page is torn down. Those arrive as ERR_ABORTED and say nothing about the
 * page's health — an RSC route that actually answers 4xx/5xx still surfaces
 * through the response listener.
 */
function isRouterFetch(req: Request): boolean {
  const headers = req.headers();
  if (
    headers['next-router-prefetch'] === '1' ||
    headers['purpose'] === 'prefetch' ||
    headers['sec-purpose']?.includes('prefetch') === true ||
    headers['rsc'] === '1' ||
    req.url().includes('_rsc=')
  ) {
    return true;
  }

  // A bare `fetch` for a same-origin *page* path is the router following a
  // server-side redirect: an auth-gated route calls `redirect('/login')` and the
  // router fetches it. Page paths are never fetched by application code — that
  // goes to /api — so an aborted one is always the harness tearing the page down
  // mid-redirect. A page that genuinely fails answers with a status, which the
  // response listener records.
  if (req.resourceType() !== 'fetch') return false;
  const { pathname } = new URL(req.url());
  return !pathname.startsWith('/api/') && !pathname.startsWith('/_next/');
}

async function collectPageErrors(page: Page, path: string): Promise<PageError[]> {
  const errors: PageError[] = [];

  // Listen for console errors
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isIgnoredConsoleMessage(text)) return;
    errors.push({ type: 'console-error', message: text });
  });

  // Listen for uncaught page exceptions
  page.on('pageerror', (err) => {
    const text = err.message || String(err);
    if (isIgnoredConsoleMessage(text)) return;
    errors.push({ type: 'page-error', message: text });
  });

  // Listen for failed network requests
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (isIgnoredDomain(url)) return;
    const failure = req.failure();
    // Router prefetches and RSC navigation fetches the browser cancelled on
    // teardown used to account for ~33 "errors" per page, drowning out the
    // real ones. See isRouterFetch.
    if (failure?.errorText === 'net::ERR_ABORTED') {
      // A cancelled document load is the harness closing the page mid-redirect,
      // never a page defect: an auth-gated route sends the browser to /login and
      // the test tears down before it lands. A document that genuinely fails
      // answers with a status, which the response listener below records.
      if (
        req.resourceType() === 'document' ||
        // Covers the App Router's client-side navigations too, which are
        // fetches rather than documents: an auth-gated dashboard route pushes
        // the browser to /login and the harness tears the page down before it
        // lands.
        req.isNavigationRequest() ||
        isRouterFetch(req)
      ) {
        return;
      }
    }
    errors.push({
      type: 'request-failed',
      message: `${req.method()} ${url} — ${failure?.errorText ?? 'unknown'}`,
      url,
    });
  });

  // Listen for responses with error status codes
  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !isIgnoredDomain(url)) {
      // Ignore 404s for source-maps and __nextjs_ internal routes
      if (url.includes('.map') || url.includes('__nextjs')) return;
      // Ignore 401/403 for premium/auth endpoints (expected in test env)
      if ((status === 401 || status === 403) && url.includes('/api/premium')) return;
      errors.push({
        type: 'request-failed',
        message: `HTTP ${status}: ${res.request().method()} ${url}`,
        url,
      });
    }
  });

  // Listen for page crashes
  page.on('crash', () => {
    errors.push({ type: 'crash', message: `Page crashed on ${path}` });
  });

  // Navigate
  try {
    await page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT,
    });
  } catch (navErr) {
    errors.push({
      type: 'page-error',
      message: `Navigation failed: ${navErr instanceof Error ? navErr.message : String(navErr)}`,
    });
    return errors;
  }

  // Let async scripts, lazy-loaded components, and timers settle
  await page.waitForTimeout(SETTLE_TIME);

  return errors;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Console Error Scanner', () => {
  // Run in serial so we get a clear per-page report
  test.describe.configure({ mode: 'parallel' });

  for (const path of ALL_PAGES) {
    test(`no console errors on ${path}`, async ({ page }) => {
      const errors = await collectPageErrors(page, path);

      // Build a readable report
      if (errors.length > 0) {
        const report = errors
          .map((e, i) => `  ${i + 1}. [${e.type}] ${e.message}`)
          .join('\n');

        // Fail with a clear message showing ALL errors on this page
        expect(
          errors.length,
          `Found ${errors.length} error(s) on ${path}:\n${report}`
        ).toBe(0);
      }
    });
  }
});

// ─── Summary test: scan ALL pages and print a single report ──────────────────

test('full site error report (summary)', async ({ page }) => {
  const allResults: { path: string; errors: PageError[] }[] = [];
  let totalErrors = 0;

  for (const path of ALL_PAGES) {
    // Remove all listeners from previous iteration
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.removeAllListeners('requestfailed');
    page.removeAllListeners('response');
    page.removeAllListeners('crash');

    const errors = await collectPageErrors(page, path);
    if (errors.length > 0) {
      allResults.push({ path, errors });
      totalErrors += errors.length;
    }
  }

  // Print the full report regardless of pass/fail
  if (allResults.length > 0) {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  CONSOLE ERROR REPORT');
    console.log('══════════════════════════════════════════════════════\n');

    for (const { path, errors } of allResults) {
      console.log(`❌ ${path} (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
      for (const e of errors) {
        console.log(`   [${e.type}] ${e.message}`);
      }
      console.log('');
    }

    console.log(`Total: ${totalErrors} error(s) across ${allResults.length} page(s)`);
    console.log(`Clean: ${ALL_PAGES.length - allResults.length} page(s) with no errors`);
    console.log('══════════════════════════════════════════════════════\n');
  } else {
    console.log('\n✅ All pages clean — no console errors found!\n');
  }

  // Soft-fail: report exists, but don't block CI
  // Change to expect(totalErrors).toBe(0) to make it a hard gate
  test.info().annotations.push({
    type: 'errors',
    description: `${totalErrors} error(s) across ${allResults.length}/${ALL_PAGES.length} pages`,
  });
});
