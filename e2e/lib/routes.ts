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
 * Route discovery shared by the end-to-end sweeps.
 *
 * Both `console-errors.spec.ts` and `page-health.spec.ts` need the same answer
 * to "what pages does this site have?", and a hand-kept copy in each rots
 * independently: the list that used to live in the console scanner had drifted
 * to 58 dead entries and 33 unscanned live pages before it was derived from the
 * app directory. Deriving it once, here, means a page added under
 * `src/app/[locale]` is swept by every spec the moment it lands.
 *
 * @module e2e/lib/routes
 */

import fs from 'node:fs';
import path from 'node:path';

/** Locale used for the sweeps. `as-needed` prefixing redirects `/en/x` to `/x`. */
export const LOCALE = 'en';

/** Repo root's `src/app`, resolved by walking up from this file. */
export function findAppDir(startDir: string = __dirname): string {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'src', 'app');
    if (fs.existsSync(path.join(candidate, 'layout.tsx'))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`Could not locate src/app from ${startDir}`);
}

/**
 * Every locale-routed page that takes no dynamic params, read from the app
 * directory at collection time.
 */
export function discoverStaticPages(appDir: string = findAppDir()): string[] {
  const localeRoot = path.join(appDir, '[locale]');
  const routes: string[] = [];

  const walk = (dir: string, segments: string[]) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      // Dynamic segments need params, route groups add no URL segment, and
      // private folders (`_components`) are never routable.
      if (entry.name.startsWith('[') || entry.name.startsWith('_')) continue;
      const next = entry.name.startsWith('(') ? segments : [...segments, entry.name];
      walk(path.join(dir, entry.name), next);
    }
    if (fs.existsSync(path.join(dir, 'page.tsx'))) {
      routes.push(`/${LOCALE}${segments.length ? `/${segments.join('/')}` : ''}`);
    }
  };

  walk(localeRoot, []);
  return routes.sort();
}

/** Routable pages that live outside the `[locale]` segment. */
export const NON_LOCALE_PAGES: string[] = ['/api-reference'];

/**
 * Dynamic routes with sample params for smoke testing.
 * One entry per `[param]` route that exists under `[locale]`.
 */
export const DYNAMIC_PAGES: string[] = [
  '/en/coin/bitcoin',
  '/en/coin/ethereum',
  '/en/source/coindesk',
  '/en/tags/bitcoin',
  '/en/category/markets',
  '/en/learn/what-is-bitcoin',
  '/en/videos/coindesk',
];

/**
 * Embeddable widget routes. They render outside the site chrome and are the
 * surface third parties actually iframe, so a sweep that skips them misses
 * breakage nobody on the site itself would ever see.
 */
export const EMBED_PAGES: string[] = [
  '/embed/ticker',
  '/embed/news',
  '/embed/market',
  '/embed/fear-greed',
  '/embed/coin?id=bitcoin',
  '/embed/chart?symbol=BTCUSD',
];

/** Every page a sweep should visit. */
export function allPages(appDir?: string): string[] {
  return [...discoverStaticPages(appDir), ...NON_LOCALE_PAGES, ...DYNAMIC_PAGES];
}
