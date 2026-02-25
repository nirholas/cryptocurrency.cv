/**
 * Database Schema — Drizzle ORM PostgreSQL schema
 *
 * Tables:
 *  1. articles       — News archive (replaces archive/*.json)
 *  2. coins          — Coin metadata
 *  3. prices         — Time-series price snapshots
 *  4. market_snapshots — Periodic full market state
 *  5. provider_health — Health monitor log
 *  6. alerts         — User-defined alerts
 *  7. predictions    — AI predictions archive
 *  8. social_metrics — Social sentiment over time
 *
 * All timestamps use `timestamp with time zone`.
 * Uses PostgreSQL GIN indexes for full-text search on articles.
 *
 * @module database/schema
 */

import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  real,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// 1. ARTICLES — News archive
// =============================================================================

export const articles = pgTable(
  'articles',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    source: varchar('source', { length: 128 }).notNull(),
    author: varchar('author', { length: 256 }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    content: text('content'),
    summary: text('summary'),
    sentiment: real('sentiment'), // -1.0 to 1.0
    coins: jsonb('coins').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    category: varchar('category', { length: 64 }),
    imageUrl: text('image_url'),
    language: varchar('language', { length: 10 }).default('en'),
    sourceReliability: real('source_reliability'),
  },
  (t) => [
    uniqueIndex('articles_url_idx').on(t.url),
    index('articles_published_idx').on(t.publishedAt),
    index('articles_source_idx').on(t.source),
    index('articles_category_idx').on(t.category),
    // GIN index for full-text search created via raw SQL migration
  ],
);

// =============================================================================
// 2. COINS — Coin metadata
// =============================================================================

export const coins = pgTable(
  'coins',
  {
    id: varchar('id', { length: 128 }).primaryKey(), // coingecko_id
    symbol: varchar('symbol', { length: 32 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    marketCapRank: integer('market_cap_rank'),
    categories: jsonb('categories').$type<string[]>().default([]),
    platforms: jsonb('platforms').$type<Record<string, string>>().default({}),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('coins_symbol_idx').on(t.symbol),
    index('coins_rank_idx').on(t.marketCapRank),
  ],
);

// =============================================================================
// 3. PRICES — Time-series price snapshots
// =============================================================================

export const prices = pgTable(
  'prices',
  {
    id: serial('id').primaryKey(),
    coinId: varchar('coin_id', { length: 128 })
      .notNull()
      .references(() => coins.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    price: doublePrecision('price').notNull(),
    volume24h: doublePrecision('volume_24h'),
    marketCap: doublePrecision('market_cap'),
    priceChange24h: real('price_change_24h'),
    provider: varchar('provider', { length: 64 }),
    confidence: real('confidence'),
  },
  (t) => [
    index('prices_coin_ts_idx').on(t.coinId, t.timestamp),
    index('prices_timestamp_idx').on(t.timestamp),
  ],
);

// =============================================================================
// 4. MARKET SNAPSHOTS — Periodic full market state
// =============================================================================

export const marketSnapshots = pgTable(
  'market_snapshots',
  {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    totalMarketCap: doublePrecision('total_market_cap'),
    totalVolume: doublePrecision('total_volume'),
    btcDominance: real('btc_dominance'),
    ethDominance: real('eth_dominance'),
    fearGreedIndex: integer('fear_greed_index'),
    fearGreedLabel: varchar('fear_greed_label', { length: 32 }),
    topMovers: jsonb('top_movers').$type<{
      gainers: { symbol: string; changePct: number }[];
      losers: { symbol: string; changePct: number }[];
    }>(),
    activeCryptos: integer('active_cryptos'),
    stablecoinMcap: doublePrecision('stablecoin_mcap'),
  },
  (t) => [
    index('market_snapshots_ts_idx').on(t.timestamp),
  ],
);

// =============================================================================
// 5. PROVIDER HEALTH — Health monitor log
// =============================================================================

export const providerHealth = pgTable(
  'provider_health',
  {
    id: serial('id').primaryKey(),
    provider: varchar('provider', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    successRate: real('success_rate'),
    avgLatencyMs: real('avg_latency_ms'),
    circuitState: varchar('circuit_state', { length: 16 }), // 'closed' | 'open' | 'half-open'
    totalRequests: integer('total_requests'),
    errorCount: integer('error_count'),
    p99LatencyMs: real('p99_latency_ms'),
  },
  (t) => [
    index('provider_health_provider_ts_idx').on(t.provider, t.timestamp),
  ],
);

// =============================================================================
// 6. ALERTS — User-defined alerts
// =============================================================================

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 128 }),
    type: varchar('type', { length: 32 }).notNull(), // 'price' | 'volume' | 'sentiment' | 'whale'
    coinId: varchar('coin_id', { length: 128 }),
    condition: varchar('condition', { length: 16 }).notNull(), // 'above' | 'below' | 'cross'
    threshold: doublePrecision('threshold').notNull(),
    channel: varchar('channel', { length: 32 }).default('webhook'), // 'webhook' | 'email' | 'ws'
    webhookUrl: text('webhook_url'),
    active: boolean('active').default(true),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('alerts_user_idx').on(t.userId),
    index('alerts_coin_idx').on(t.coinId),
    index('alerts_active_idx').on(t.active),
  ],
);

// =============================================================================
// 7. PREDICTIONS — AI predictions archive
// =============================================================================

export const predictions = pgTable(
  'predictions',
  {
    id: serial('id').primaryKey(),
    coinId: varchar('coin_id', { length: 128 }).notNull(),
    predictedAt: timestamp('predicted_at', { withTimezone: true }).notNull().defaultNow(),
    targetDate: timestamp('target_date', { withTimezone: true }).notNull(),
    priceTarget: doublePrecision('price_target').notNull(),
    confidence: real('confidence'), // 0-1
    model: varchar('model', { length: 64 }),
    reasoning: text('reasoning'),
    outcome: varchar('outcome', { length: 16 }), // 'pending' | 'correct' | 'incorrect'
    actualPrice: doublePrecision('actual_price'),
  },
  (t) => [
    index('predictions_coin_idx').on(t.coinId),
    index('predictions_target_date_idx').on(t.targetDate),
  ],
);

// =============================================================================
// 8. SOCIAL METRICS — Social sentiment over time
// =============================================================================

export const socialMetrics = pgTable(
  'social_metrics',
  {
    id: serial('id').primaryKey(),
    coinId: varchar('coin_id', { length: 128 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    twitterVolume: integer('twitter_volume'),
    redditPosts: integer('reddit_posts'),
    sentimentScore: real('sentiment_score'), // -1.0 to 1.0
    socialVolume: integer('social_volume'),
    socialDominance: real('social_dominance'),
    source: varchar('source', { length: 64 }),
  },
  (t) => [
    index('social_metrics_coin_ts_idx').on(t.coinId, t.timestamp),
  ],
);

// =============================================================================
// SQL HELPERS — Full-text search index (applied in migration)
// =============================================================================

/**
 * Raw SQL for creating the GIN full-text search index on articles.
 * Run this in the migration after table creation.
 */
export const createArticlesSearchIndex = sql`
  CREATE INDEX IF NOT EXISTS articles_fts_idx
  ON articles
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
`;

/**
 * Full-text search query helper
 */
export function articleSearchQuery(query: string) {
  return sql`
    to_tsvector('english', coalesce(${articles.title}, '') || ' ' || coalesce(${articles.content}, ''))
    @@ plainto_tsquery('english', ${query})
  `;
}

/**
 * Full-text search rank helper
 */
export function articleSearchRank(query: string) {
  return sql<number>`
    ts_rank(
      to_tsvector('english', coalesce(${articles.title}, '') || ' ' || coalesce(${articles.content}, '')),
      plainto_tsquery('english', ${query})
    )
  `;
}
