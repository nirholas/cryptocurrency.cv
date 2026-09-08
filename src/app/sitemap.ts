/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Sitemap
 *
 * Every URL here resolves to a real route without a redirect:
 * - next-intl runs with localePrefix 'as-needed', so the default locale is served
 *   at the bare path and `/en/<path>` only 307s there. URLs are therefore emitted
 *   unprefixed, with hreflang alternates for the other locales.
 * - Static pages are discovered from the route tree on disk, so a page that is
 *   deleted or renamed drops out of the sitemap instead of turning into a 404.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * @see src/__tests__/sitemap.test.ts
 */

import { type MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { getAllPostsMeta, getActiveCategories } from '@/lib/blog';
import { getAllTags } from '@/lib/tags';
import { categories as newsCategories } from '@/lib/categories';
import { TRANSLATED_LOCALES, defaultLocale } from '@/i18n/config';
import { SITE_URL } from '@/lib/constants';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** Where the localized page tree lives, relative to the repo root */
export const LOCALE_APP_DIR = path.join('src', 'app', '[locale]');

/**
 * Top-level segments that exist but are private, account-bound, or utility
 * pages search engines should not be pointed at.
 */
export const PRIVATE_SEGMENTS = new Set([
  'dashboard',
  'settings',
  'login',
  'keys',
  'bookmarks',
  'notifications',
  'watchlist',
  'portfolio',
  'alerts',
  'export',
]);

/** Per-path crawl hints; anything not listed gets the default below */
const PAGE_HINTS: Record<string, { changeFrequency: ChangeFrequency; priority: number }> = {
  '': { changeFrequency: 'always', priority: 1.0 },
  '/markets': { changeFrequency: 'hourly', priority: 0.9 },
  '/heatmap': { changeFrequency: 'hourly', priority: 0.8 },
  '/sentiment': { changeFrequency: 'hourly', priority: 0.8 },
  '/defi': { changeFrequency: 'hourly', priority: 0.8 },
  '/gas': { changeFrequency: 'always', priority: 0.7 },
  '/whales': { changeFrequency: 'hourly', priority: 0.8 },
  '/fear-greed': { changeFrequency: 'hourly', priority: 0.9 },
  '/screener': { changeFrequency: 'daily', priority: 0.7 },
  '/pump-screener': { changeFrequency: 'hourly', priority: 0.7 },
  '/calculator': { changeFrequency: 'monthly', priority: 0.5 },
  '/compare': { changeFrequency: 'daily', priority: 0.6 },
  '/arbitrage': { changeFrequency: 'hourly', priority: 0.7 },
  '/digest': { changeFrequency: 'daily', priority: 0.7 },
  '/sources': { changeFrequency: 'weekly', priority: 0.6 },
  '/predictions': { changeFrequency: 'daily', priority: 0.7 },
  '/business': { changeFrequency: 'hourly', priority: 0.8 },
  '/tech': { changeFrequency: 'hourly', priority: 0.8 },
  '/web3': { changeFrequency: 'hourly', priority: 0.8 },
  '/defi-news': { changeFrequency: 'hourly', priority: 0.8 },
  '/bitcoin': { changeFrequency: 'hourly', priority: 0.9 },
  '/ethereum': { changeFrequency: 'hourly', priority: 0.9 },
  '/solana': { changeFrequency: 'hourly', priority: 0.9 },
  '/derivatives': { changeFrequency: 'hourly', priority: 0.8 },
  '/nft': { changeFrequency: 'hourly', priority: 0.7 },
  '/stablecoins': { changeFrequency: 'daily', priority: 0.7 },
  '/l2': { changeFrequency: 'daily', priority: 0.7 },
  '/exchanges': { changeFrequency: 'daily', priority: 0.7 },
  '/macro': { changeFrequency: 'daily', priority: 0.7 },
  '/unlocks': { changeFrequency: 'daily', priority: 0.7 },
  '/events': { changeFrequency: 'daily', priority: 0.7 },
  '/regulation': { changeFrequency: 'daily', priority: 0.7 },
  '/research': { changeFrequency: 'daily', priority: 0.7 },
  '/intelligence': { changeFrequency: 'daily', priority: 0.7 },
  '/opinion': { changeFrequency: 'daily', priority: 0.7 },
  '/podcast': { changeFrequency: 'weekly', priority: 0.6 },
  '/videos': { changeFrequency: 'daily', priority: 0.6 },
  '/newsletters': { changeFrequency: 'weekly', priority: 0.6 },
  '/airdrops': { changeFrequency: 'daily', priority: 0.7 },
  '/learn': { changeFrequency: 'weekly', priority: 0.6 },
  '/developers': { changeFrequency: 'weekly', priority: 0.6 },
  '/widgets': { changeFrequency: 'monthly', priority: 0.5 },
  '/x402': { changeFrequency: 'weekly', priority: 0.6 },
  '/x402/conformance': { changeFrequency: 'weekly', priority: 0.7 },
  '/about': { changeFrequency: 'monthly', priority: 0.5 },
  '/pricing': { changeFrequency: 'monthly', priority: 0.6 },
  '/status': { changeFrequency: 'hourly', priority: 0.5 },
  '/contact': { changeFrequency: 'monthly', priority: 0.4 },
  '/privacy': { changeFrequency: 'monthly', priority: 0.3 },
  '/terms': { changeFrequency: 'monthly', priority: 0.3 },
  '/blog': { changeFrequency: 'daily', priority: 0.8 },
  '/tags': { changeFrequency: 'daily', priority: 0.8 },
};

const DEFAULT_HINT = { changeFrequency: 'weekly' as ChangeFrequency, priority: 0.6 };

/** Dynamic (`[param]`) and route-group (`(group)`) segments */
function isSpecialSegment(name: string): boolean {
  return name.startsWith('[') || name.startsWith('(') || name.startsWith('_') || name.startsWith('@');
}

/**
 * Walk src/app/[locale] and return every public route path ('' for the root)
 * that has a page.tsx. Dynamic segments are handled separately with real data.
 */
export function discoverStaticRoutes(rootDir = process.cwd()): string[] {
  const base = path.join(rootDir, LOCALE_APP_DIR);
  const routes: string[] = [];

  const walk = (dir: string, routePath: string) => {
    if (fs.existsSync(path.join(dir, 'page.tsx'))) routes.push(routePath);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || isSpecialSegment(entry.name)) continue;
      if (routePath === '' && PRIVATE_SEGMENTS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), `${routePath}/${entry.name}`);
    }
  };

  walk(base, '');
  return routes.sort();
}

/** Canonical URL for a path: bare for the default locale, prefixed otherwise */
export function localizedUrl(locale: string, pathSuffix: string): string {
  return locale === defaultLocale ? `${SITE_URL}${pathSuffix}` : `${SITE_URL}/${locale}${pathSuffix}`;
}

/**
 * hreflang map for a path; x-default points at the unprefixed default-locale URL.
 * Only locales with a real messages/<locale>.json are advertised (TRANSLATED_LOCALES):
 * routing accepts more, but an untranslated locale is a duplicate English page.
 */
function buildAlternates(pathSuffix: string): Record<string, string> {
  const langs: Record<string, string> = { 'x-default': localizedUrl(defaultLocale, pathSuffix) };
  for (const locale of TRANSLATED_LOCALES) {
    langs[locale] = localizedUrl(locale, pathSuffix);
  }
  return langs;
}

function entry(
  pathSuffix: string,
  hint: { changeFrequency: ChangeFrequency; priority: number },
  lastModified: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl(defaultLocale, pathSuffix),
    lastModified,
    changeFrequency: hint.changeFrequency,
    priority: hint.priority,
    alternates: { languages: buildAlternates(pathSuffix) },
  };
}

/** Top 100 coins by market cap (CoinGecko IDs) for /coin/[id] */
const topCoins = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'usd-coin', 'staked-ether',
  'dogecoin', 'cardano', 'tron', 'avalanche-2', 'shiba-inu', 'chainlink', 'polkadot', 'bitcoin-cash',
  'dai', 'uniswap', 'litecoin', 'near', 'leo-token', 'polygon', 'internet-computer', 'cosmos',
  'ethereum-classic', 'arbitrum', 'optimism', 'aptos', 'sui', 'injective', 'render-token',
  'immutable-x', 'stellar', 'monero', 'filecoin', 'hedera-hashgraph', 'vechain', 'the-graph',
  'algorand', 'quant-network', 'aave', 'maker', 'elrond-erd-2', 'flow', 'theta-token',
  'axie-infinity', 'decentraland', 'the-sandbox', 'gala', 'enjincoin', 'lido-dao', 'rocket-pool',
  'frax-share', 'curve-dao-token', 'convex-finance', 'yearn-finance', 'compound-governance-token',
  'balancer', 'synthetix-network-token', 'gmx', 'dydx', 'sushi', '1inch', 'pancakeswap-token',
  'blur', 'blur-2', 'kaspa', 'sei-network', 'celestia', 'pyth-network', 'jito-governance-token',
  'ondo-finance', 'starknet', 'worldcoin-wld', 'pendle', 'thorchain', 'kava', 'oasis-network',
  'harmony', 'band-protocol', 'ocean-protocol', 'fetch-ai', 'singularitynet', 'numeraire',
  'basic-attention-token', 'civic', 'golem', 'loopring', 'zilliqa', 'iota', 'ontology', 'icon',
  'wanchain', 'status', 'power-ledger', 'storj', 'request-network', 'ankr', 'ssv-network', 'ethena',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of discoverStaticRoutes()) {
    entries.push(entry(route, PAGE_HINTS[route] ?? DEFAULT_HINT, now));
  }

  for (const coin of topCoins) {
    entries.push(entry(`/coin/${coin}`, { changeFrequency: 'hourly', priority: 0.7 }, now));
  }

  for (const category of newsCategories) {
    entries.push(entry(`/category/${category.slug}`, { changeFrequency: 'hourly', priority: 0.8 }, now));
  }

  const blogPosts = getAllPostsMeta();
  for (const post of blogPosts) {
    entries.push(entry(`/blog/${post.slug}`, { changeFrequency: 'weekly', priority: 0.9 }, new Date(post.date)));
  }
  for (const category of getActiveCategories()) {
    entries.push(entry(`/blog/category/${category}`, { changeFrequency: 'weekly', priority: 0.7 }, now));
  }

  for (const tag of getAllTags()) {
    entries.push(
      entry(
        `/tags/${tag.slug}`,
        { changeFrequency: 'hourly', priority: Math.round(Math.min(0.9, 0.6 + tag.priority / 250) * 1000) / 1000 },
        now,
      ),
    );
  }

  return entries;
}
