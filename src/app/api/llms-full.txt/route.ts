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
 * Dynamic llms-full.txt API Route
 *
 * Returns a nightly-rebuilt, AI-friendly reference document. Combines:
 *  - Rich API documentation with examples for core endpoints
 *  - Auto-discovered complete endpoint registry (scanned from src/app/api/)
 *  - 500 most recent archived articles grouped by category
 *
 * Follows the llms.txt standard: https://llmstxt.org
 * Cache: public, 1 h at the edge (s-maxage=3600) + 1 h at clients.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchiveArticle {
  id: string;
  title: string;
  pub_date: string;
  source: string;
  source_key: string;
  category: string;
  tickers?: string[];
  tags?: string[];
  sentiment?: { label: string };
}

// ---------------------------------------------------------------------------
// Archive metadata
// ---------------------------------------------------------------------------

interface ArchiveIndex {
  lastUpdated?: string;
  totalArticles?: number;
  dateRange?: { earliest?: string; latest?: string };
}

async function loadArchiveIndex(): Promise<ArchiveIndex | null> {
  try {
    const raw = await readFile(join(process.cwd(), 'archive', 'index.json'), 'utf-8');
    return JSON.parse(raw) as ArchiveIndex;
  } catch {
    return null;
  }
}

/** Read only the top-level keys of by-source.json (named source identifiers). */
async function loadSourceKeys(): Promise<string[]> {
  try {
    const filePath = join(process.cwd(), 'archive', 'indexes', 'by-source.json');
    const raw = await readFile(filePath, 'utf-8');
    // Parse only enough to get top-level keys — avoid holding 157K-line object in memory.
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(parsed)
      .filter((k) => /^[a-z][a-z0-9-]+$/.test(k)) // named keys only, not numeric IDs
      .sort();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Route auto-discovery
// ---------------------------------------------------------------------------

/** Top-level namespaces that are operational/internal — listed in a separate section. */
const INTERNAL_PREFIXES = new Set([
  'cron', 'admin', 'webhooks', 'billing', 'frames', 'push',
  '.well-known', 'register', 'keys', 'upgrade', 'views', 'cache',
  'storage', 'ws', 'gateway', 'metrics', 'stats',
]);

async function walkApiDir(dir: string, prefix: string, out: string[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const hasRoute = entries.some(
    (e) => e.isFile() && (e.name === 'route.ts' || e.name === 'route.tsx'),
  );
  if (hasRoute && prefix) out.push(prefix);
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walkApiDir(join(dir, entry.name), `${prefix}/${entry.name}`, out);
    }
  }
}

async function discoverApiRoutes(): Promise<{ public: string[]; internal: string[] }> {
  const apiDir = join(process.cwd(), 'src', 'app', 'api');
  try {
    await stat(apiDir);
  } catch {
    return { public: [], internal: [] };
  }
  const all: string[] = [];
  await walkApiDir(apiDir, '', all);

  const publicRoutes: string[] = [];
  const internalRoutes: string[] = [];

  for (const r of all.sort()) {
    if (r === '/llms.txt' || r === '/llms-full.txt') continue; // skip meta routes
    const topLevel = r.split('/')[1];
    if (topLevel && INTERNAL_PREFIXES.has(topLevel)) {
      internalRoutes.push('/api' + r);
    } else {
      publicRoutes.push('/api' + r);
    }
  }
  return { public: publicRoutes, internal: internalRoutes };
}

// ---------------------------------------------------------------------------
// Route grouping helpers
// ---------------------------------------------------------------------------

const NAMESPACE_LABELS: Record<string, string> = {
  ai: 'AI & Intelligence',
  'ai-anchor': 'AI Anchor',
  rag: 'RAG (Retrieval-Augmented Generation)',
  market: 'Market Data',
  social: 'Social & Sentiment',
  analytics: 'Analytics',
  portfolio: 'Portfolio',
  premium: 'Premium',
  trading: 'Trading',
  onchain: 'On-Chain',
  signals: 'Signals',
  v1: 'v1 (Versioned)',
  archive: 'Archive',
  search: 'Search',
  news: 'News (extended)',
  predictions: 'Predictions',
  oracle: 'Oracle',
  'whale-alerts': 'Whale Alerts',
  'defi': 'DeFi (extended)',
};

function groupRoutesByNamespace(routes: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const r of routes) {
    const ns = r.replace('/api/', '').split('/')[0];
    if (!groups.has(ns)) groups.set(ns, []);
    groups.get(ns)!.push(r);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Article loading
// ---------------------------------------------------------------------------

function parseJsonl(text: string): ArchiveArticle[] {
  const results: ArchiveArticle[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    try {
      results.push(JSON.parse(line) as ArchiveArticle);
    } catch {
      // skip malformed lines
    }
  }
  return results;
}

async function loadRecentArticles(target = 500): Promise<ArchiveArticle[]> {
  const articlesDir = join(process.cwd(), 'archive', 'articles');
  const all = await readdir(articlesDir);
  const monthly = all
    .filter((f) => /^\d{4}-\d{2}\.jsonl$/.test(f))
    .sort()
    .reverse();

  const collected: ArchiveArticle[] = [];
  for (const file of monthly) {
    if (collected.length >= target * 2) break; // over-fetch then sort+slice
    try {
      const content = await readFile(join(articlesDir, file), 'utf-8');
      collected.push(...parseJsonl(content));
    } catch {
      // skip unreadable files
    }
  }
  collected.sort((a, b) => {
    const ta = a.pub_date ? new Date(a.pub_date).getTime() : 0;
    const tb = b.pub_date ? new Date(b.pub_date).getTime() : 0;
    return tb - ta;
  });
  return collected.slice(0, target);
}

// ---------------------------------------------------------------------------
// Category label helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  bitcoin: 'Bitcoin', ethereum: 'Ethereum', defi: 'DeFi', nft: 'NFTs',
  regulation: 'Regulation', altcoin: 'Altcoins', general: 'General',
  solana: 'Solana', layer2: 'Layer 2', stablecoin: 'Stablecoins',
  mining: 'Mining', exchange: 'Exchanges',
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ---------------------------------------------------------------------------
// Document builder
// ---------------------------------------------------------------------------

function buildDocument(
  articles: ArchiveArticle[],
  publicRoutes: string[],
  internalRoutes: string[],
  generatedAt: Date,
  archiveAvailable: boolean,
  archiveIndex: ArchiveIndex | null,
  sourceKeys: string[],
): string {
  const iso = generatedAt.toISOString();
  const L: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  L.push(
    '# free-crypto-news — Full LLM Reference (Dynamic)',
    '',
    '> Free, real-time cryptocurrency news API aggregating 300+ sources.',
    '> No API key required. REST JSON, RSS/Atom, WebSocket, AI analysis,',
    '> historical archive, MCP server, ChatGPT plugin. Open source (MIT).',
    '> https://cryptocurrency.cv',
    '',
    'This document is rebuilt on every cache miss (~hourly) and is intended for AI',
    'assistants and LLMs. It contains rich API docs, a complete auto-discovered',
    'endpoint registry, and the 500 most recent archived articles by category.',
    '',
    '---',
    '',
    '## Data Freshness',
    '',
    `- **Generated:** ${iso}`,
    `- **Articles listed:** ${articles.length}`,
    `- **Public API endpoints discovered:** ${publicRoutes.length > 0 ? publicRoutes.length : 'n/a (src/ not available)'}`,
    `- **Archive available in this env:** ${archiveAvailable}`,
    ...(archiveIndex ? [
      `- **Total archived articles:** ${archiveIndex.totalArticles?.toLocaleString() ?? 'unknown'}`,
      `- **Archive date range:** ${archiveIndex.dateRange?.earliest ?? '?'} → ${archiveIndex.dateRange?.latest ?? '?'}`,
      `- **Archive last updated:** ${archiveIndex.lastUpdated ?? 'unknown'}`,
    ] : []),
    '- **Cache-Control:** public, max-age=3600, s-maxage=3600',
    '',
    '---',
    '',
    '## Site Description',
    '',
    '**free-crypto-news** is an open-source project by nirholas (https://github.com/nirholas)',
    'deployed at https://cryptocurrency.cv.',
    '',
    'Aggregates cryptocurrency news from 300+ sources including CoinDesk, The Block,',
    'Decrypt, CoinTelegraph, Bitcoin Magazine, Blockworks, The Defiant, BeInCrypto,',
    'NewsBTC, CryptoSlate, Messari, Bankless, Unchained, and 115+ more.',
    '',
    '**Key properties:**',
    '- Base URL: `https://cryptocurrency.cv`',
    '- Authentication: none — all endpoints are public',
    '- CORS: open (`Access-Control-Allow-Origin: *`)',
    '- Rate limiting: fair-use, no hard limits for reasonable use',
    '- License: MIT',
    '',
    '---',
    '',
    '## Core Endpoint Documentation',
    '',
    '### GET /api/news',
    'Returns latest cryptocurrency news from all sources.',
    'Params: `limit` (1–100, default 20), `source`, `page`, `category` (bitcoin|defi|ethereum|altcoin|nft|regulation|general), `lang`',
    '',
    'Response shape:',
    '```json',
    '{',
    '  "articles": [{',
    '    "id": "coindesk-1234",',
    '    "title": "Bitcoin Hits New ATH",',
    '    "link": "https://coindesk.com/...",',
    '    "description": "Bitcoin surged past...",',
    '    "pubDate": "2026-02-21T10:30:00Z",',
    '    "source": "CoinDesk", "sourceKey": "coindesk",',
    '    "category": "bitcoin", "timeAgo": "2h ago",',
    '    "sentiment": "bullish", "tags": ["bitcoin","price","ath"]',
    '  }],',
    '  "totalCount": 1, "fetchedAt": "2026-02-21T12:00:00Z", "cached": false',
    '}',
    '```',
    '',
    '### GET /api/search',
    'Full-text search across all aggregated news.',
    'Params: `q` (required), `limit`, `from` (ISO date), `to` (ISO date), `source`',
    'Example: `GET /api/search?q=ethereum+ETF&limit=5`',
    '',
    '### GET /api/bitcoin',
    'Bitcoin-specific news. Params: `limit`, `page`',
    '',
    '### GET /api/defi',
    'DeFi news: yield farming, DEXs, lending protocols, hacks. Params: `limit`, `page`',
    '',
    '### GET /api/breaking',
    'Articles from the last 2 hours. Params: `limit` (default 5)',
    '',
    '### GET /api/trending',
    'Trending keywords and topics across all sources.',
    '',
    '### GET /api/sources',
    'All 300+ news sources with status, RSS URL, language. Returns `sources[]`, `totalActive`.',
    '',
    '### GET /api/sentiment',
    'AI-powered sentiment aggregated from news.',
    'Params: `asset` (BTC|ETH|SOL|...), `period` (1h|24h|7d|30d)',
    '',
    '### GET /api/fear-greed',
    'Crypto Fear & Greed index. Returns `value`, `classification`, `timestamp`.',
    '',
    '### GET /api/market/coins',
    'Full coin list with prices, market caps, 24h changes.',
    '',
    '### GET /api/market/history/[coinId]',
    'Historical OHLCV for a coin. Params: `days`, `interval`',
    '',
    '### GET /api/market/exchanges',
    'Exchange list with volume and trust score.',
    '',
    '### GET /api/market/defi',
    'DeFi protocol stats: TVL, APY, protocol counts.',
    '',
    '### GET /api/gas',
    'Current gas prices (Ethereum, other chains).',
    '',
    '### GET /api/global',
    'Global market stats: total market cap, BTC dominance, active coins.',
    '',
    '### GET /api/ask',
    'Natural language Q&A about crypto news.',
    'Params: `q` (required). Example: `GET /api/ask?q=What+happened+to+Bitcoin+this+week`',
    '',
    '### POST /api/ai',
    'AI analysis of article content.',
    '```json',
    '{',
    '  "action": "summarize|sentiment|facts|factcheck|questions|categorize|translate",',
    '  "title": "Article headline",',
    '  "content": "Article body...",',
    '  "options": { "length": "short|medium|long", "targetLanguage": "es" }',
    '}',
    '```',
    '',
    '### GET /api/ai/research',
    'Deep multi-source research on a topic. Params: `q` (required)',
    '',
    '### GET /api/ai/narratives',
    'Emerging market narratives detected from news patterns.',
    '',
    '### GET /api/ai/brief',
    'AI-generated short briefing / digest of recent news.',
    '',
    '### GET /api/ai/debate',
    'Bull vs bear debate format for a given topic or asset.',
    '',
    '### GET /api/ai/counter',
    'Counter-argument generation for a given claim or headline.',
    '',
    '### GET /api/ai/digest',
    'Daily AI digest summary.',
    '',
    '### GET /api/ai/flash-briefing',
    'Short AI flash briefing (smart speaker / widget compatible).',
    '',
    '### GET /api/ai/correlation',
    'AI correlation analysis between tokens/narratives.',
    '',
    '### GET /api/ai/entities',
    'Named-entity extraction from news.',
    '',
    '### GET /api/ai/explain',
    'Plain-English explanation of a crypto concept or headline.',
    '',
    '### GET /api/ai/social',
    'AI summary of social sentiment for an asset.',
    '',
    '### GET /api/ai/synthesize',
    'Synthesise multiple articles into a unified narrative.',
    '',
    '### GET /api/ai/oracle',
    'AI predictions as a news-backed oracle.',
    '',
    '### GET /api/ai/portfolio-news',
    'News filtered and summarised for a given portfolio of assets.',
    '',
    '### GET /api/ai/relationships',
    'Token/entity relationship graph derived from news.',
    '',
    '### GET /api/ai/source-quality',
    'AI credibility scoring for news sources.',
    '',
    '### GET /api/ai/cross-lingual',
    'Cross-lingual news comparison for a topic.',
    '',
    '### GET /api/ai/blog-generator',
    'AI-powered crypto blog post generator.',
    '',
    '### GET /api/predictions',
    'AI-generated market predictions from news analysis.',
    '',
    '### GET /api/predictions/history',
    'Historical AI predictions with outcome tracking.',
    '',
    '### GET /api/predictions/markets',
    'Prediction market data aggregation.',
    '',
    '### GET /api/rag',
    'Retrieval-Augmented Generation over the news archive.',
    '',
    '### GET /api/rag/ask',
    'RAG-powered natural language Q&A. Params: `q`',
    '',
    '### GET /api/rag/search',
    'Semantic search over archived articles. Params: `q`, `limit`',
    '',
    '### GET /api/rag/stream',
    'Streaming RAG response (SSE). Params: `q`',
    '',
    '### GET /api/rag/summary/[crypto]',
    'AI summary for a specific cryptocurrency using RAG over recent news.',
    '',
    '### GET /api/rag/timeline',
    'Chronological RAG timeline for a topic or asset.',
    '',
    '### GET /api/rag/stats',
    'RAG index statistics (article count, last update, coverage).',
    '',
    '### GET /api/rss',
    'RSS 2.0 feed. Params: `limit`, `source`, `category`',
    '',
    '### GET /api/atom',
    'Atom 1.0 feed.',
    '',
    '### GET /api/sse',
    'Server-Sent Events real-time stream. Usage: `new EventSource("/api/sse")`',
    '',
    '### GET /api/archive',
    'Historical news by date. Params: `date` (YYYY-MM-DD), `year`, `month`',
    'Archive covers 2010–present with full metadata and market context.',
    '',
    '### GET /api/archive/v2',
    'Enhanced archive API with richer filtering.',
    '',
    '### GET /api/social/x/sentiment',
    'X (Twitter) sentiment analysis for crypto assets.',
    '',
    '### GET /api/social/trending-narratives',
    'Trending narratives across social platforms.',
    '',
    '### GET /api/liquidations',
    'Liquidation data: long/short liquidations by exchange and asset.',
    '',
    '### GET /api/whale-alerts',
    'On-chain large-transaction news and alerts.',
    '',
    '### GET /api/whale-alerts/context',
    'AI-generated context for whale transactions.',
    '',
    '### GET /api/whales',
    'Whale wallet activity aggregation.',
    '',
    '### GET /api/signals',
    'Trading signals derived from news sentiment and on-chain data.',
    '',
    '### GET /api/signals/narrative',
    'Narrative-based trading signals.',
    '',
    '### GET /api/oracle',
    'News-backed on-chain oracle data.',
    '',
    '### GET /api/oracle/chainlink',
    'Chainlink-compatible oracle news feed.',
    '',
    '### GET /api/onchain/events',
    'On-chain events correlated with news.',
    '',
    '### GET /api/onchain/correlate',
    'Correlation between on-chain metrics and news sentiment.',
    '',
    '### GET /api/factcheck',
    'AI fact-checking of crypto news claims. Params: `claim` or article body',
    '',
    '### GET /api/translate',
    'Translate news articles. Params: `text`, `to` (language code)',
    '',
    '### GET /api/classify',
    'Classify news articles by category and topic.',
    '',
    '### GET /api/entities',
    'Entity extraction across recent news.',
    '',
    '### GET /api/relationships',
    'Entity relationship graph from news.',
    '',
    '### GET /api/claims',
    'Claim extraction from news articles.',
    '',
    '### GET /api/compare',
    'Compare two assets or topics by news coverage and sentiment.',
    '',
    '### GET /api/coverage-gap',
    'Detect under-covered stories in the crypto news cycle.',
    '',
    '### GET /api/academic',
    'Academic/research articles related to crypto topics.',
    '',
    '### GET /api/analytics/anomalies',
    'Anomaly detection in news volume and sentiment.',
    '',
    '### GET /api/analytics/causality',
    'Granger causality between news events and price.',
    '',
    '### GET /api/analytics/credibility',
    'Source credibility scoring.',
    '',
    '### GET /api/analytics/forensics',
    'News forensics: manipulation detection, astroturfing signals.',
    '',
    '### GET /api/analytics/headlines',
    'Headline analysis and pattern detection.',
    '',
    '### GET /api/analytics/influencers',
    'Top news influencers by topic.',
    '',
    '### GET /api/analytics/news-onchain',
    'Cross-correlation of news events with on-chain activity.',
    '',
    '### GET /api/portfolio',
    'Portfolio news feed. Params: `coins` (comma-separated tickers)',
    '',
    '### GET /api/portfolio/performance',
    'Portfolio performance vs. news sentiment.',
    '',
    '### GET /api/portfolio/tax',
    'Tax-relevant news and events for a portfolio.',
    '',
    '### GET /api/watchlist',
    'Watchlist news feed.',
    '',
    '### GET /api/alerts',
    'Alert management for keyword/asset news triggers.',
    '',
    '### GET /api/tags',
    'Tag-based news browse. Params: `tag`',
    '',
    '### GET /api/digest',
    'Daily/weekly news digest.',
    '',
    '### GET /api/newsletter/subscribe',
    'Subscribe to the email newsletter.',
    '',
    '### GET /api/search/semantic',
    'Semantic (vector) search over news archive. Params: `q`',
    '',
    '### GET /api/nostr',
    'Nostr protocol integration: crypto news as Nostr events.',
    '',
    '### GET /api/graphql',
    'GraphQL interface for flexible news queries.',
    '',
    '### GET /api/openapi.json',
    'Machine-readable OpenAPI 3.1 specification for all endpoints.',
    '',
    '---',
    '',
    '## Common Use Cases for AI Assistants',
    '',
    '1. **Current crypto news** → `GET /api/breaking` + `GET /api/sentiment`',
    '2. **Bitcoin news** → `GET /api/bitcoin?limit=10`',
    '3. **Search a topic** → `GET /api/search?q=defi+hack&limit=10`',
    '4. **Sentiment** → `GET /api/sentiment?asset=BTC&period=24h`',
    '5. **Trending topics** → `GET /api/trending`',
    '6. **Market overview** → `GET /api/market/coins` + `GET /api/fear-greed`',
    '7. **Ask a question** → `GET /api/ask?q=What+is+happening+with+Ethereum`',
    '8. **AI briefing** → `GET /api/ai/brief`',
    '9. **RAG answer** → `GET /api/rag/ask?q=Why+did+BTC+drop`',
    '10. **Whale activity** → `GET /api/whale-alerts`',
    '11. **DeFi research** → `GET /api/ai/research?q=DeFi+TVL+trends`',
    '12. **Token narratives** → `GET /api/ai/narratives`',
    '',
    '---',
    '',
    '## Response Common Fields',
    '',
    'All news endpoints return articles with:',
    '- `id` — unique article identifier',
    '- `title` — article headline',
    '- `link` — canonical URL',
    '- `description` — article summary (≤ 500 chars)',
    '- `pubDate` — ISO 8601 publication timestamp',
    '- `source` / `sourceKey` — human/machine-readable source name',
    '- `category` — general|bitcoin|defi|ethereum|nft|regulation|altcoin',
    '- `timeAgo` — human-readable recency ("2h ago")',
    '- `sentiment` — bullish|bearish|neutral (optional)',
    '- `tags` — extracted topic tags array',
    '',
    '---',
    '',
    '## Integrations',
    '',
    '### MCP Server (Claude)',
    '```json',
    '{',
    '  "mcpServers": {',
    '    "free-crypto-news": {',
    '      "command": "node",',
    '      "args": ["/path/to/free-crypto-news/mcp/index.js"]',
    '    }',
    '  }',
    '}',
    '```',
    'MCP tools: get_latest_news, search_news, get_sentiment, get_trending,',
    'get_bitcoin_news, get_defi_news',
    '',
    '### ChatGPT Plugin',
    'Manifest: https://cryptocurrency.cv/.well-known/ai-plugin.json',
    'OpenAPI spec: https://cryptocurrency.cv/api/openapi.json',
    '',
    '### SDKs',
    '- TypeScript/JS + React hooks: https://github.com/nirholas/free-crypto-news/tree/main/sdk',
    '- Python: https://github.com/nirholas/free-crypto-news/tree/main/sdk',
    '- CLI: https://github.com/nirholas/free-crypto-news/tree/main/cli',
    '- Embeddable widget: https://github.com/nirholas/free-crypto-news/tree/main/widget',
    '',
    '---',
    '',
  );

  // ── Auto-discovered endpoint registry ────────────────────────────────────

  if (publicRoutes.length > 0) {
    L.push(
      `## Complete Public API Registry (${publicRoutes.length} endpoints, auto-discovered)`,
      '',
      '_This section is generated at runtime by scanning the live codebase._',
      '',
    );

    const groups = groupRoutesByNamespace(publicRoutes);
    const ungrouped: string[] = [];

    for (const [ns, routes] of [...groups.entries()].sort()) {
      if (routes.length === 1 && !NAMESPACE_LABELS[ns]) {
        ungrouped.push(...routes);
        continue;
      }
      const label = NAMESPACE_LABELS[ns] ?? ns.charAt(0).toUpperCase() + ns.slice(1);
      L.push(`### ${label}`);
      for (const r of routes) L.push(`- \`${r}\``);
      L.push('');
    }

    if (ungrouped.length > 0) {
      L.push('### Miscellaneous');
      for (const r of ungrouped.sort()) L.push(`- \`${r}\``);
      L.push('');
    }

    if (internalRoutes.length > 0) {
      L.push(
        `### Internal / Operational (${internalRoutes.length} endpoints)`,
        '_Not intended for external use: cron jobs, admin, webhooks, billing._',
        '',
      );
      for (const r of internalRoutes) L.push(`- \`${r}\``);
      L.push('');
    }

    L.push('---', '');
  }

  // ── Article sections grouped by category ─────────────────────────────────

  if (articles.length === 0) {
    L.push('## Recent Articles', '', '_Archive not available in this environment._', '');
  } else {
    L.push(
      `## Recent Articles (${articles.length} latest, grouped by category)`,
      '',
      'Format: `[YYYY-MM-DD] Title — Source {TICKERS} [sentiment]`',
      'Followed by live search URL for each article.',
      '',
    );

    const catGroups = new Map<string, ArchiveArticle[]>();
    for (const a of articles) {
      const cat = (a.category ?? 'general').toLowerCase();
      if (!catGroups.has(cat)) catGroups.set(cat, []);
      catGroups.get(cat)!.push(a);
    }
    const sortedCats = [...catGroups.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [cat, items] of sortedCats) {
      L.push(`### ${categoryLabel(cat)} (${items.length})`, '');
      for (const art of items) {
        const date = art.pub_date ? art.pub_date.slice(0, 10) : 'unknown';
        const title = (art.title ?? '(no title)').replace(/\n/g, ' ').trim();
        const source = art.source ?? art.source_key ?? 'unknown';
        const sentiment = art.sentiment?.label ?? '';
        const sentimentSuffix = sentiment && sentiment !== 'neutral' ? ` [${sentiment}]` : '';
        const tickers =
          art.tickers && art.tickers.length > 0 ? ` {${art.tickers.join(', ')}}` : '';
        const searchSlug = encodeURIComponent(title.slice(0, 80).replace(/['"]/g, ''));
        L.push(
          `- [${date}] ${title} — ${source}${tickers}${sentimentSuffix}`,
          `  https://cryptocurrency.cv/api/search?q=${searchSlug}&limit=1`,
        );
      }
      L.push('');
    }
  }

  // ── Source Keys ───────────────────────────────────────────────────────────

  if (sourceKeys.length > 0) {
    L.push(
      '---',
      '',
      '## Valid Source Keys',
      '',
      'Use these values with the `?source=` query parameter on any news endpoint.',
      'Example: `GET /api/news?source=coindesk&limit=10`',
      '',
      sourceKeys.join(', '),
      '',
    );
  }

  // ── MCP Tool Signatures ────────────────────────────────────────────────────

  L.push(
    '---',
    '',
    '## MCP Tool Signatures',
    '',
    'The Claude MCP server (`mcp/`) exposes these tools. Each tool maps to a',
    'REST endpoint. Install via: `npx -y @smithery/cli install cryptocurrency-news`',
    '',
    '### get_crypto_news',
    'Fetch the latest crypto news. Args: category (bitcoin|ethereum|defi|solana|nft|',
    'altcoin|regulation|exchange|whale|general), limit (1-50, default 10),',
    'ticker (filter by asset e.g. BTC).',
    '',
    '### search_crypto_news',
    'Full-text search the archive. Args: query (required), limit (1-50), category.',
    '',
    '### get_defi_news',
    'DeFi-specific news feed. Args: limit (1-50, default 10).',
    '',
    '### get_bitcoin_news',
    'Bitcoin-only news. Args: limit (1-50, default 10).',
    '',
    '### get_breaking_news',
    'Latest breaking articles (newest first). Args: limit (1-50, default 5).',
    '',
    '### get_market_data',
    'Current crypto market data (prices, market caps, 24h change).',
    'Args: coins (comma-separated list, e.g. "bitcoin,ethereum"), currency (default usd).',
    '',
    '### get_fear_greed_index',
    'Crypto Fear & Greed Index. Args: days (number of historical points, default 1).',
    '',
    '### get_gas_prices',
    'Ethereum gas prices (slow/standard/fast in gwei). No args.',
    '',
    '### get_regulatory_news',
    'Regulatory and legal crypto news. Args: limit (1-50, default 10).',
    '',
    '### get_whale_alerts',
    'Large on-chain transactions (whale movements). Args: limit (1-50, default 10),',
    'min_value_usd (minimum USD value, default 1000000).',
    '',
    '### get_funding_rates',
    'Perpetual futures funding rates. Args: symbols (comma-separated, default "BTC,ETH").',
    '',
    '### get_liquidations',
    'Recent liquidation events. Args: limit (1-50, default 20).',
    '',
    '### get_defi_yields',
    'DeFi protocol yield rates. Args: limit (1-50, default 10), min_apy (minimum APY filter).',
    '',
    '### get_ai_market_brief',
    'AI-generated market summary (sentiment, key themes, recent headlines). No args.',
    '',
    '### compare_coins',
    'Compare two or more coins. Args: coins (comma-separated, required),',
    'metric (price|volume|market_cap|change, default price).',
    '',
    '### get_exchange_flows',
    'Exchange inflow/outflow data. Args: exchange (optional, e.g. "binance"), limit (default 10).',
    '',
    '### get_token_unlocks',
    'Upcoming token unlock schedules. Args: limit (1-50, default 10).',
    '',
    '### get_social_sentiment',
    'Social-media sentiment for a coin. Args: coin (required, e.g. "bitcoin"), days (default 7).',
    '',
    '### get_news_sources',
    'List all available news sources with metadata. No args.',
    '',
  );

  // ── OpenAPI Schemas ────────────────────────────────────────────────────────

  L.push(
    '---',
    '',
    '## OpenAPI Schemas',
    '',
    'Canonical response shapes for all news endpoints.',
    '',
    '### NewsArticle',
    '```',
    'title:       string   — Headline text',
    'link:        string   — Original article URL',
    'description: string   — Short summary / lede',
    'pubDate:     string   — ISO 8601 publication date',
    'source:      string   — Human-readable source name (e.g. "CoinDesk")',
    'sourceKey:   string   — Machine key (e.g. "coindesk") for ?source= filter',
    'category:    string   — Enum: general | bitcoin | defi',
    'timeAgo:     string   — Human-readable relative time (e.g. "2 hours ago")',
    '```',
    '',
    '### NewsResponse',
    '```',
    'articles: NewsArticle[]  — Array of article objects',
    'total:    integer        — Total matches available',
    'page:     integer        — Current page (1-based)',
    'limit:    integer        — Page size used',
    '```',
    '',
    '### SourceInfo',
    '```',
    'name:        string   — Human-readable source name',
    'key:         string   — Machine identifier (use with ?source=)',
    'url:         string   — Source homepage',
    'category:    string   — Primary content category',
    'articleCount:integer  — Number of articles in archive',
    'lastSeen:    string   — ISO date of most recent article',
    '```',
    '',
    '### SourcesResponse',
    '```',
    'sources:    SourceInfo[]  — Array of source objects',
    'total:      integer       — Total number of sources',
    '```',
    '',
  );

  // ── Footer ────────────────────────────────────────────────────────────────

  L.push(
    '---',
    '',
    '## Project Information',
    '',
    '- **GitHub:** https://github.com/nirholas/free-crypto-news',
    '- **Live site:** https://cryptocurrency.cv',
    '- **Author:** nirholas (https://github.com/nirholas)',
    '- **Language:** TypeScript (Next.js)',
    '- **License:** MIT',
    `- **Document generated:** ${iso}`,
    '- **Compact reference:** https://cryptocurrency.cv/llms.txt',
    '',
  );

  return L.join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  const generatedAt = new Date();
  let articles: ArchiveArticle[] = [];
  let publicRoutes: string[] = [];
  let internalRoutes: string[] = [];
  let archiveAvailable = false;
  let archiveIndex: ArchiveIndex | null = null;
  let sourceKeys: string[] = [];

  // Discover routes (requires src/ present — available in dev / Codespaces)
  try {
    const discovered = await discoverApiRoutes();
    publicRoutes = discovered.public;
    internalRoutes = discovered.internal;
  } catch {
    // src/ not available in production build — registry section omitted
  }

  // Load archive articles (requires archive/ present)
  try {
    await stat(join(process.cwd(), 'archive', 'articles'));
    articles = await loadRecentArticles(500);
    archiveAvailable = true;
    archiveIndex = await loadArchiveIndex();
    sourceKeys = await loadSourceKeys();
  } catch {
    // archive/ excluded from production build via outputFileTracingExcludes
  }

  const body = buildDocument(articles, publicRoutes, internalRoutes, generatedAt, archiveAvailable, archiveIndex, sourceKeys);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex',
      'X-Generated-At': generatedAt.toISOString(),
      'X-Article-Count': String(articles.length),
      'X-Endpoint-Count': String(publicRoutes.length),
    },
  });
}
