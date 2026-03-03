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
 * Postgres-backed query helpers that replace the JSON-file-scan approach.
 *
 * These functions are designed for the Vercel Edge runtime (Neon HTTP driver).
 * They fall back gracefully:  if DATABASE_URL is unset the callers should
 * continue to use the existing GitHub-raw / JSONL approach.
 */

import { desc, eq, and, gte, lte, ilike, sql, or, inArray, type SQL } from 'drizzle-orm';
import { getDb, articles, pricesHistory, marketSnapshots, predictions, tagScores } from './index';
import type { EnrichedArticle, ArchiveV2Stats, ArchiveV2QueryOptions } from '../archive-v2';

// Re-export for convenience
export { isDbAvailable } from './client';

// ────────────────────────────────────────────────────────────────────────────
// Full-text search
// ────────────────────────────────────────────────────────────────────────────

export interface FtsResult {
  id: string;
  title: string;
  link: string;
  description: string | null;
  source: string;
  sourceKey: string;
  pubDate: Date | null;
  firstSeen: Date;
  tickers: string[] | null;
  tags: string[] | null;
  sentimentLabel: string | null;
  rank: number;
}

/**
 * Full-text search using Postgres ts_rank + websearch_to_tsquery.
 * Returns articles ranked by relevance with optional filters.
 */
export async function pgFullTextSearch(
  query: string,
  options: { limit?: number; offset?: number; ticker?: string; source?: string } = {}
): Promise<{ results: FtsResult[]; total: number }> {
  const db = getDb();
  if (!db) return { results: [], total: 0 };

  const { limit = 20, offset = 0, ticker, source } = options;

  // Build WHERE conditions
  const conditions: SQL[] = [
    sql`${articles.searchVector} @@ websearch_to_tsquery('english', ${query})`,
  ];

  if (ticker) {
    conditions.push(sql`${ticker.toUpperCase()} = ANY(${articles.tickers})`);
  }
  if (source) {
    // Escape LIKE wildcards in user input to prevent wildcard injection
    const escapedSource = source.replace(/%/g, '\\%').replace(/_/g, '\\_');
    conditions.push(ilike(articles.sourceKey, `%${escapedSource}%`));
  }

  const where = and(...conditions);

  const rankExpr = sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('english', ${query}))`;

  // Count total matches
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(where);

  // Fetch ranked results
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      link: articles.link,
      description: articles.description,
      source: articles.source,
      sourceKey: articles.sourceKey,
      pubDate: articles.pubDate,
      firstSeen: articles.firstSeen,
      tickers: articles.tickers,
      tags: articles.tags,
      sentimentLabel: articles.sentimentLabel,
      rank: rankExpr,
    })
    .from(articles)
    .where(where)
    .orderBy(sql`${rankExpr} DESC`)
    .limit(limit)
    .offset(offset);

  return { results: rows as FtsResult[], total: count };
}

// ────────────────────────────────────────────────────────────────────────────
// Archive queries  (replaces queryArchiveV2's fetch-from-GitHub approach)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Query articles from Postgres with WHERE / ORDER BY / LIMIT.
 * Returns the same shape as the existing `queryArchiveV2`.
 */
export async function pgQueryArchive(options: ArchiveV2QueryOptions): Promise<{
  articles: EnrichedArticle[];
  total: number;
  pagination: { limit: number; offset: number; hasMore: boolean };
}> {
  const db = getDb();
  if (!db) return { articles: [], total: 0, pagination: { limit: 50, offset: 0, hasMore: false } };

  const {
    startDate,
    endDate,
    source,
    ticker,
    search,
    sentiment,
    tags: filterTags,
    limit = 50,
    offset = 0,
  } = options;

  const conditions: SQL[] = [];

  if (startDate) {
    conditions.push(gte(articles.firstSeen, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(articles.firstSeen, new Date(endDate + 'T23:59:59.999Z')));
  }
  if (source) {
    conditions.push(
      or(
        ilike(articles.source, `%${source}%`),
        ilike(articles.sourceKey, `%${source}%`)
      )!
    );
  }
  if (ticker) {
    conditions.push(sql`${ticker.toUpperCase()} = ANY(${articles.tickers})`);
  }
  if (search) {
    // Use FTS if the search_vector index is available
    conditions.push(
      sql`${articles.searchVector} @@ websearch_to_tsquery('english', ${search})`
    );
  }
  if (sentiment) {
    if (sentiment === 'positive') {
      conditions.push(
        or(eq(articles.sentimentLabel, 'positive'), eq(articles.sentimentLabel, 'very_positive'))!
      );
    } else if (sentiment === 'negative') {
      conditions.push(
        or(eq(articles.sentimentLabel, 'negative'), eq(articles.sentimentLabel, 'very_negative'))!
      );
    } else {
      conditions.push(eq(articles.sentimentLabel, 'neutral'));
    }
  }
  if (filterTags && filterTags.length > 0) {
    // articles.tags && ARRAY[...filterTags] overlap
    conditions.push(sql`${articles.tags} && ${filterTags}::text[]`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(where);

  // Paginated results
  const rows = await db
    .select()
    .from(articles)
    .where(where)
    .orderBy(desc(articles.firstSeen))
    .limit(limit)
    .offset(offset);

  // Map row → EnrichedArticle shape expected by callers
  const mapped: EnrichedArticle[] = rows.map(r => ({
    id: r.id,
    slug: r.slug ?? undefined,
    schema_version: r.schemaVersion ?? '2.0.0',
    title: r.title,
    link: r.link,
    canonical_link: r.canonicalLink ?? r.link,
    description: r.description ?? '',
    source: r.source,
    source_key: r.sourceKey,
    category: r.category,
    pub_date: r.pubDate?.toISOString() ?? null,
    first_seen: r.firstSeen.toISOString(),
    last_seen: r.lastSeen.toISOString(),
    fetch_count: r.fetchCount ?? 1,
    tickers: r.tickers ?? [],
    entities: (r.entities as EnrichedArticle['entities']) ?? { people: [], companies: [], protocols: [] },
    tags: r.tags ?? [],
    sentiment: {
      score: r.sentimentScore ?? 0,
      label: (r.sentimentLabel ?? 'neutral') as EnrichedArticle['sentiment']['label'],
      confidence: r.sentimentConfidence ?? 0.5,
    },
    market_context: (r.marketContext as EnrichedArticle['market_context']) ?? null,
    content_hash: r.contentHash ?? '',
    meta: {
      word_count: (r.meta as Record<string, unknown>)?.word_count as number ?? 0,
      has_numbers: (r.meta as Record<string, unknown>)?.has_numbers as boolean ?? false,
      is_breaking: (r.meta as Record<string, unknown>)?.is_breaking as boolean ?? false,
      is_opinion: (r.meta as Record<string, unknown>)?.is_opinion as boolean ?? false,
    },
  }));

  return {
    articles: mapped,
    total: count,
    pagination: { limit, offset, hasMore: offset + limit < count },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Stats
// ────────────────────────────────────────────────────────────────────────────

export async function pgGetArchiveStats(): Promise<ArchiveV2Stats | null> {
  const db = getDb();
  if (!db) return null;

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      firstSeen: sql<string>`min(first_seen)::text`,
      lastSeen: sql<string>`max(first_seen)::text`,
    })
    .from(articles);

  if (!totals || totals.total === 0) return null;

  // Top sources
  const sources = await db
    .select({
      sourceKey: articles.sourceKey,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .groupBy(articles.sourceKey)
    .orderBy(sql`count(*) DESC`)
    .limit(50);

  // Top tickers
  const tickers = await db
    .select({
      ticker: sql<string>`unnest(tickers)`,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .groupBy(sql`unnest(tickers)`)
    .orderBy(sql`count(*) DESC`)
    .limit(50);

  return {
    version: '2.0.0',
    total_articles: totals.total,
    total_fetches: totals.total, // approximation
    first_fetch: totals.firstSeen,
    last_fetch: totals.lastSeen,
    sources: Object.fromEntries(sources.map(s => [s.sourceKey, s.count])),
    tickers: Object.fromEntries(tickers.map(t => [t.ticker, t.count])),
    daily_counts: {}, // omit for now to keep the query fast
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Trending tickers (from article tickers in recent N hours)
// ────────────────────────────────────────────────────────────────────────────

export async function pgGetTrendingTickers(hours = 24): Promise<{ ticker: string; count: number }[]> {
  const db = getDb();
  if (!db) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await db
    .select({
      ticker: sql<string>`unnest(tickers)`,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .where(gte(articles.firstSeen, since))
    .groupBy(sql`unnest(tickers)`)
    .orderBy(sql`count(*) DESC`)
    .limit(20);

  return rows;
}

// ────────────────────────────────────────────────────────────────────────────
// Market history from prices_history table
// ────────────────────────────────────────────────────────────────────────────

export async function pgGetMarketHistory(yearMonth: string): Promise<Array<{
  timestamp: string;
  btc_price: number | null;
  eth_price: number | null;
  fear_greed_index: number | null;
}>> {
  const db = getDb();
  if (!db) return [];

  const start = new Date(`${yearMonth}-01T00:00:00Z`);
  const [y, m] = yearMonth.split('-').map(Number);
  const end = new Date(Date.UTC(y, m, 1)); // first day of next month

  const rows = await db
    .select()
    .from(pricesHistory)
    .where(and(gte(pricesHistory.timestamp, start), lte(pricesHistory.timestamp, end)))
    .orderBy(pricesHistory.timestamp);

  // Group by timestamp to emit one row per time-point
  const grouped = new Map<string, { btc_price: number | null; eth_price: number | null; fear_greed_index: number | null }>();
  for (const r of rows) {
    const ts = r.timestamp.toISOString();
    if (!grouped.has(ts)) grouped.set(ts, { btc_price: null, eth_price: null, fear_greed_index: null });
    const entry = grouped.get(ts)!;
    if (r.ticker === 'BTC') entry.btc_price = r.price;
    if (r.ticker === 'ETH') entry.eth_price = r.price;
  }

  return Array.from(grouped.entries()).map(([ts, data]) => ({ timestamp: ts, ...data }));
}
