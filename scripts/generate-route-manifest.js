#!/usr/bin/env node
/**
 * Generate route manifest for OpenAPI and x402 discovery.
 *
 * Scans src/app/api/ for route.ts files, filters out internal/exempt routes,
 * and writes a TypeScript manifest to src/lib/openapi/routes.generated.ts.
 *
 * Run: node scripts/generate-route-manifest.js
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
const OUTPUT = path.join(__dirname, '..', 'src', 'lib', 'openapi', 'routes.generated.ts');

// Patterns to EXCLUDE (internal, system, exempt from x402)
const EXCLUDE_PATTERNS = [
  /\/admin/,
  /\/cron\//,
  /\/internal\//,
  /\/auth\//,
  /\/inngest/,
  /\/well-known/,
  /\/register$/,
  /\/keys\/(rotate|upgrade|usage)/,
  /\/dashboard/,
  /\/health$/,
  /\/llms/,
  /\/openapi/,
  /\/webhooks\/(queue|test)/,
  /\/sample$/,
  /\/push$/,
  /\/monitor$/,
  /\/cache$/,
  /\/providers/,
  /\/origins$/,
  /\/pipelines$/,
  /\/gateway$/,
  /\/billing/,
  /\/upgrade$/,
  /\/contact$/,
  /\/newsletter/,
  /\/notifications/,
  /\/storage/,
  /\/metrics$/,
  /\/stats$/,
  /\/docs$/,
  /\/views$/,
  /\/graphql$/,
  /\/i18n\//,
  /\/frames$/,
  /\/premium\/api-keys/,
  /\/premium\/streams/,  // use premium/stream instead
  /\/data-sources\/defi/,
  /\/defi\/protocol-health/,
  /\/defi\/yields\/stats/,
  /\/onchain\/(health|funding-metrics|lth-metrics|miner-metrics|whale-metrics)/,
  /\/bitcoin\/(network-stats|stats)/,
  /\/nft\/collections\/\[slug\]\/(stats|activity)/,
  /\/funding\/dashboard/,
];

// Dynamic segment routes to EXCLUDE (contain [param])
const HAS_DYNAMIC = /\[/;

function findRoutes(dir, prefix = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...findRoutes(fullPath, `${prefix}/${entry.name}`));
    } else if (entry.name === 'route.ts') {
      routes.push(prefix || '/');
    }
  }
  return routes;
}

// Scan filesystem
const allRoutes = findRoutes(API_DIR, '/api')
  .filter(r => !EXCLUDE_PATTERNS.some(p => p.test(r)))
  .filter(r => !HAS_DYNAMIC.test(r))
  .sort();

// Categorize routes
function categorize(route) {
  if (/\/premium\/ai\//.test(route)) return 'Premium AI';
  if (/\/premium\/whales|\/premium\/smart-money/.test(route)) return 'Premium Whales';
  if (/\/premium\/market/.test(route)) return 'Premium Market';
  if (/\/premium\/defi/.test(route)) return 'Premium DeFi';
  if (/\/premium\/alert/.test(route)) return 'Premium Alerts';
  if (/\/premium\/(stream|ws)/.test(route)) return 'Premium Streaming';
  if (/\/premium\/pass/.test(route)) return 'Premium Passes';
  if (/\/premium\/(screener|analytics|portfolio)/.test(route)) return 'Premium Analytics';
  if (/\/premium\/export/.test(route)) return 'Premium Data';
  if (/\/premium/.test(route)) return 'Premium';
  if (/\/ai\/|\/rag\/|\/ask|\/summarize|\/forecast|\/classify|\/sentiment|\/digest|\/narratives|\/detect|\/factcheck|\/clickbait|\/analyze/.test(route)) return 'AI Analysis';
  if (/\/news|\/breaking|\/categories|\/sources|\/tags|\/articles|\/academic|\/regulatory|\/press-release|\/commentary|\/podcast|\/blog|\/videos|\/rss|\/atom|\/opml|\/archive/.test(route)) return 'News & Content';
  if (/\/bitcoin/.test(route)) return 'Bitcoin';
  if (/\/defi|\/dex|\/bridges|\/yields|\/token-unlocks|\/unlocks/.test(route)) return 'DeFi';
  if (/\/derivatives|\/funding|\/liquidations|\/options|\/signals|\/arbitrage|\/backtest|\/trading|\/hyperliquid/.test(route)) return 'Trading & Derivatives';
  if (/\/onchain|\/whale|\/nansen|\/arkham|\/dune|\/flows/.test(route)) return 'On-Chain & Whales';
  if (/\/nft/.test(route)) return 'NFTs';
  if (/\/social|\/influencer|\/nostr|\/trending/.test(route)) return 'Social Intelligence';
  if (/\/solana/.test(route)) return 'Solana';
  if (/\/aptos/.test(route)) return 'Aptos';
  if (/\/sui/.test(route)) return 'Sui';
  if (/\/l2/.test(route)) return 'Layer 2';
  if (/\/macro/.test(route)) return 'Macro & Traditional';
  if (/\/gaming/.test(route)) return 'Gaming & Metaverse';
  if (/\/stablecoin/.test(route)) return 'Stablecoins';
  if (/\/oracle/.test(route)) return 'Oracles';
  if (/\/portfolio|\/watchlist|\/alerts|\/predictions/.test(route)) return 'Portfolio & Alerts';
  if (/\/analytics|\/anomalies|\/entities|\/claims|\/knowledge|\/relationships|\/citations|\/coverage|\/events/.test(route)) return 'Analytics & Intelligence';
  if (/\/export|\/historical/.test(route)) return 'Data Export';
  if (/\/market|\/coins|\/coin|\/prices|\/ohlc|\/orderbook|\/exchanges|\/gas|\/fear-greed|\/compare|\/search|\/charts|\/exchange-rate|\/global|\/coincap|\/coinmarketcap|\/coinpaprika|\/cryptocompare|\/cryptopanic|\/geckoterminal|\/tokenterminal/.test(route)) return 'Market Data';
  if (/\/v1\//.test(route)) return 'API v1';
  return 'Other';
}

// Build manifest
const manifest = allRoutes.map(route => ({
  path: route,
  category: categorize(route),
}));

const categories = [...new Set(manifest.map(r => r.category))].sort();

// Write TypeScript file
const ts = `/**
 * AUTO-GENERATED — Do not edit manually.
 * Run: node scripts/generate-route-manifest.js
 *
 * Generated: ${new Date().toISOString()}
 * Total routes: ${manifest.length}
 */

/** All discoverable API routes with their category. */
export const ROUTE_MANIFEST: { path: string; category: string }[] = ${JSON.stringify(manifest, null, 2)};

/** Total discoverable routes. */
export const ROUTE_COUNT = ${manifest.length};

/** All categories. */
export const ROUTE_CATEGORIES = ${JSON.stringify(categories, null, 2)} as const;
`;

fs.writeFileSync(OUTPUT, ts);
console.log(`Generated ${manifest.length} routes in ${categories.length} categories → ${OUTPUT}`);
categories.forEach(cat => {
  const count = manifest.filter(r => r.category === cat).length;
  console.log(`  ${cat}: ${count}`);
});
