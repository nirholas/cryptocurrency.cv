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
 * Drizzle ORM Schema for free-crypto-news
 *
 * Tables:
 *   articles          – 662K+ enriched news articles (mirrors archive/articles/*.jsonl)
 *   prices_history    – BTC/ETH/SOL price snapshots (mirrors archive/market/*.jsonl)
 *   market_snapshots  – hourly market context snapshots (mirrors archive/snapshots/)
 *   predictions       – on-chain / social predictions (mirrors archive/predictions/)
 *   tag_scores        – computed tag relevance scores (mirrors archive/meta/tag-scores.json)
 *   user_watchlists   – per-user ticker watchlists (enables personalisation)
 *   coins             – coin metadata and CoinGecko IDs
 *   provider_health   – health monitor log for provider chains
 *   alerts            – user-defined price / sentiment / event alerts
 *   social_metrics    – social sentiment over time
 *   derivatives_snapshots – open interest & liquidation snapshots
 *   stablecoin_snapshots  – stablecoin supply & flow snapshots
 *   gas_fees_history      – Ethereum gas price history
 *   news_articles         – provider-sourced news articles (CryptoPanic, NewsData)
 */

import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ────────────────────────────────────────────────────────────────────────────
// articles
// ────────────────────────────────────────────────────────────────────────────

export const articles = pgTable(
  'articles',
  {
    /** 16-char hex content-addressed ID (same as archive id field) */
    id: varchar('id', { length: 64 }).primaryKey(),
    /** SEO-friendly slug */
    slug: varchar('slug', { length: 255 }),
    schemaVersion: varchar('schema_version', { length: 16 }).default('2.0.0'),
    title: text('title').notNull(),
    link: text('link').notNull(),
    canonicalLink: text('canonical_link'),
    description: text('description'),
    source: varchar('source', { length: 255 }).notNull(),
    sourceKey: varchar('source_key', { length: 128 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    pubDate: timestamp('pub_date', { withTimezone: true }),
    firstSeen: timestamp('first_seen', { withTimezone: true }).notNull(),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull(),
    fetchCount: integer('fetch_count').default(1),
    tickers: text('tickers').array().default(sql`'{}'::text[]`),
    tags: text('tags').array().default(sql`'{}'::text[]`),
    /** Entities extracted from article */
    entities: jsonb('entities').$type<{
      people: string[];
      companies: string[];
      protocols: string[];
    }>(),
    sentimentScore: real('sentiment_score').default(0),
    sentimentLabel: varchar('sentiment_label', { length: 32 }).default('neutral'),
    sentimentConfidence: real('sentiment_confidence').default(0.5),
    /** Snapshot of market at time of article */
    marketContext: jsonb('market_context').$type<{
      btc_price: number | null;
      eth_price: number | null;
      sol_price?: number | null;
      total_market_cap?: number | null;
      btc_dominance?: number | null;
      fear_greed_index: number | null;
    }>(),
    contentHash: varchar('content_hash', { length: 64 }),
    /** Free-form metadata bag */
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    /** Postgres generated tsvector for full-text search */
    searchVector: text('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_articles_pub_date').on(table.pubDate),
    index('idx_articles_first_seen').on(table.firstSeen),
    index('idx_articles_source_key').on(table.sourceKey),
    index('idx_articles_category').on(table.category),
    index('idx_articles_sentiment').on(table.sentimentLabel),
    index('idx_articles_tickers').using('gin', table.tickers),
    index('idx_articles_tags').using('gin', table.tags),
    uniqueIndex('idx_articles_slug').on(table.slug),
    // GIN index on the tsvector column (created via raw SQL in migration)
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// prices_history
// ────────────────────────────────────────────────────────────────────────────

export const pricesHistory = pgTable(
  'prices_history',
  {
    id: serial('id').primaryKey(),
    ticker: varchar('ticker', { length: 16 }).notNull(),
    price: real('price').notNull(),
    marketCap: real('market_cap'),
    volume24h: real('volume_24h'),
    change24h: real('change_24h'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    source: varchar('source', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_prices_ticker').on(table.ticker),
    index('idx_prices_timestamp').on(table.timestamp),
    index('idx_prices_ticker_ts').on(table.ticker, table.timestamp),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// market_snapshots
// ────────────────────────────────────────────────────────────────────────────

export const marketSnapshots = pgTable(
  'market_snapshots',
  {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    hour: integer('hour').notNull(),
    articleCount: integer('article_count').default(0),
    topArticles: text('top_articles').array().default(sql`'{}'::text[]`),
    topTickers: jsonb('top_tickers').$type<{ ticker: string; mention_count: number }[]>(),
    sourceCounts: jsonb('source_counts').$type<Record<string, number>>(),
    btcPrice: real('btc_price'),
    ethPrice: real('eth_price'),
    fearGreedIndex: real('fear_greed_index'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_snapshots_timestamp').on(table.timestamp),
    index('idx_snapshots_hour').on(table.hour),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// predictions
// ────────────────────────────────────────────────────────────────────────────

export const predictions = pgTable(
  'predictions',
  {
    id: serial('id').primaryKey(),
    ticker: varchar('ticker', { length: 16 }).notNull(),
    predictionType: varchar('prediction_type', { length: 64 }).notNull(),
    direction: varchar('direction', { length: 16 }),
    confidence: real('confidence'),
    source: varchar('source', { length: 128 }),
    reasoning: text('reasoning'),
    targetPrice: real('target_price'),
    targetDate: timestamp('target_date', { withTimezone: true }),
    outcome: varchar('outcome', { length: 32 }),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_predictions_ticker').on(table.ticker),
    index('idx_predictions_ts').on(table.timestamp),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// tag_scores
// ────────────────────────────────────────────────────────────────────────────

export const tagScores = pgTable(
  'tag_scores',
  {
    id: serial('id').primaryKey(),
    tag: varchar('tag', { length: 128 }).notNull(),
    score: real('score').notNull(),
    articleCount: integer('article_count').default(0),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_tag_scores_tag').on(table.tag),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// user_watchlists
// ────────────────────────────────────────────────────────────────────────────

export const userWatchlists = pgTable(
  'user_watchlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    tickers: text('tickers').array().default(sql`'{}'::text[]`),
    name: varchar('name', { length: 128 }).default('Default'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_watchlists_user').on(table.userId),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// coins — coin metadata & lookup table
// ────────────────────────────────────────────────────────────────────────────

export const coins = pgTable(
  'coins',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }),
    coingeckoId: varchar('coingecko_id', { length: 128 }),
    coinmarketcapId: integer('coinmarketcap_id'),
    category: varchar('category', { length: 64 }),
    chains: text('chains').array().default(sql`'{}'::text[]`),
    contractAddresses: jsonb('contract_addresses').$type<Record<string, string>>(),
    logo: text('logo'),
    website: text('website'),
    twitter: varchar('twitter', { length: 128 }),
    description: text('description'),
    launchDate: timestamp('launch_date', { withTimezone: true }),
    isStablecoin: boolean('is_stablecoin').default(false),
    isWrapped: boolean('is_wrapped').default(false),
    rank: integer('rank'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_coins_symbol').on(table.symbol),
    index('idx_coins_coingecko').on(table.coingeckoId),
    index('idx_coins_category').on(table.category),
    index('idx_coins_rank').on(table.rank),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// provider_health — health monitor log for provider chains
// ────────────────────────────────────────────────────────────────────────────

export const providerHealth = pgTable(
  'provider_health',
  {
    id: serial('id').primaryKey(),
    provider: varchar('provider', { length: 128 }).notNull(),
    chain: varchar('chain', { length: 64 }).notNull(),
    circuitState: varchar('circuit_state', { length: 16 }).notNull().default('CLOSED'),
    isHealthy: boolean('is_healthy').notNull().default(true),
    avgLatencyMs: real('avg_latency_ms'),
    p99LatencyMs: real('p99_latency_ms'),
    successRate: real('success_rate'),
    totalRequests: integer('total_requests').default(0),
    totalFailures: integer('total_failures').default(0),
    lastError: text('last_error'),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_provider_health_provider').on(table.provider),
    index('idx_provider_health_chain').on(table.chain),
    index('idx_provider_health_ts').on(table.timestamp),
    index('idx_provider_health_state').on(table.circuitState),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// alerts — user-defined price / sentiment / event alerts
// ────────────────────────────────────────────────────────────────────────────

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    ticker: varchar('ticker', { length: 32 }).notNull(),
    alertType: varchar('alert_type', { length: 32 }).notNull(),
    condition: varchar('condition', { length: 16 }).notNull(),
    threshold: real('threshold').notNull(),
    currentValue: real('current_value'),
    isActive: boolean('is_active').default(true),
    isTriggered: boolean('is_triggered').default(false),
    triggeredAt: timestamp('triggered_at', { withTimezone: true }),
    notificationChannel: varchar('notification_channel', { length: 32 }).default('webhook'),
    webhookUrl: text('webhook_url'),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_alerts_user').on(table.userId),
    index('idx_alerts_ticker').on(table.ticker),
    index('idx_alerts_active').on(table.isActive),
    index('idx_alerts_type').on(table.alertType),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// social_metrics — social sentiment over time
// ────────────────────────────────────────────────────────────────────────────

export const socialMetrics = pgTable(
  'social_metrics',
  {
    id: serial('id').primaryKey(),
    ticker: varchar('ticker', { length: 32 }).notNull(),
    source: varchar('source', { length: 64 }).notNull(),
    socialVolume: integer('social_volume'),
    socialDominance: real('social_dominance'),
    sentimentScore: real('sentiment_score'),
    sentimentLabel: varchar('sentiment_label', { length: 32 }),
    tweetVolume24h: integer('tweet_volume_24h'),
    redditVolume24h: integer('reddit_volume_24h'),
    newsVolume24h: integer('news_volume_24h'),
    galaxyScore: real('galaxy_score'),
    altRank: integer('alt_rank'),
    contributors: integer('contributors'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_social_ticker').on(table.ticker),
    index('idx_social_source').on(table.source),
    index('idx_social_ts').on(table.timestamp),
    index('idx_social_ticker_ts').on(table.ticker, table.timestamp),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// derivatives_snapshots — open interest & liquidation historical data
// ────────────────────────────────────────────────────────────────────────────

export const derivativesSnapshots = pgTable(
  'derivatives_snapshots',
  {
    id: serial('id').primaryKey(),
    ticker: varchar('ticker', { length: 32 }).notNull(),
    openInterestUsd: real('open_interest_usd'),
    openInterestCoin: real('open_interest_coin'),
    oiChange24h: real('oi_change_24h'),
    longLiquidationsUsd24h: real('long_liquidations_usd_24h'),
    shortLiquidationsUsd24h: real('short_liquidations_usd_24h'),
    liquidationCount24h: integer('liquidation_count_24h'),
    largestLiquidationUsd: real('largest_liquidation_usd'),
    fundingRate: real('funding_rate'),
    markPrice: real('mark_price'),
    source: varchar('source', { length: 64 }).notNull(),
    exchangeBreakdown: jsonb('exchange_breakdown').$type<
      { exchange: string; oiUsd: number; oiCoin: number }[]
    >(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_derivatives_ticker').on(table.ticker),
    index('idx_derivatives_ts').on(table.timestamp),
    index('idx_derivatives_ticker_ts').on(table.ticker, table.timestamp),
    index('idx_derivatives_source').on(table.source),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// stablecoin_snapshots — stablecoin supply & flow tracking
// ────────────────────────────────────────────────────────────────────────────

export const stablecoinSnapshots = pgTable(
  'stablecoin_snapshots',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    pegType: varchar('peg_type', { length: 32 }).default('peggedUSD'),
    circulatingUsd: real('circulating_usd').notNull(),
    circulatingChange24h: real('circulating_change_24h'),
    circulatingChange7d: real('circulating_change_7d'),
    price: real('price'),
    rank: integer('rank'),
    chainDistribution: jsonb('chain_distribution').$type<
      { chain: string; amount: number }[]
    >(),
    source: varchar('source', { length: 64 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_stablecoin_symbol').on(table.symbol),
    index('idx_stablecoin_ts').on(table.timestamp),
    index('idx_stablecoin_symbol_ts').on(table.symbol, table.timestamp),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// gas_fees_history — Ethereum gas price history
// ────────────────────────────────────────────────────────────────────────────

export const gasFeesHistory = pgTable(
  'gas_fees_history',
  {
    id: serial('id').primaryKey(),
    chain: varchar('chain', { length: 32 }).notNull().default('ethereum'),
    baseFeeGwei: real('base_fee_gwei'),
    priorityFeeGwei: real('priority_fee_gwei'),
    gasUsedPercent: real('gas_used_percent'),
    safeLowGwei: real('safe_low_gwei'),
    standardGwei: real('standard_gwei'),
    fastGwei: real('fast_gwei'),
    rapidGwei: real('rapid_gwei'),
    source: varchar('source', { length: 64 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_gas_chain').on(table.chain),
    index('idx_gas_ts').on(table.timestamp),
    index('idx_gas_chain_ts').on(table.chain, table.timestamp),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// news_articles — provider-sourced news articles (CryptoPanic, NewsData)
// ────────────────────────────────────────────────────────────────────────────

export const newsArticles = pgTable(
  'news_articles',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    source: varchar('source', { length: 255 }).notNull(),
    author: varchar('author', { length: 255 }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    description: text('description'),
    imageUrl: text('image_url'),
    currencies: text('currencies').array().default(sql`'{}'::text[]`),
    categories: text('categories').array().default(sql`'{}'::text[]`),
    sentiment: real('sentiment'),
    votesPositive: integer('votes_positive').default(0),
    votesNegative: integer('votes_negative').default(0),
    votesImportant: integer('votes_important').default(0),
    kind: varchar('kind', { length: 32 }).default('news'),
    provider: varchar('provider', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_news_published').on(table.publishedAt),
    index('idx_news_source').on(table.source),
    index('idx_news_provider').on(table.provider),
    index('idx_news_currencies').using('gin', table.currencies),
    index('idx_news_sentiment').on(table.sentiment),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// users — user accounts for auth & dashboard
// ────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 128 }),
    avatarUrl: text('avatar_url'),
    role: varchar('role', { length: 32 }).notNull().default('developer'),
    /** OAuth provider: 'email' (magic link), 'github', 'google' */
    provider: varchar('provider', { length: 32 }).notNull().default('email'),
    providerId: varchar('provider_id', { length: 255 }),
    emailVerified: boolean('email_verified').default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_provider').on(table.provider),
    index('idx_users_role').on(table.role),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// api_keys — persistent API key storage (mirrors Redis/KV for durability)
// ────────────────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  'api_keys',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 hash of the raw key — never store plaintext */
    keyHash: varchar('key_hash', { length: 128 }).notNull(),
    /** First 12 chars of key for display (e.g. cda_pro_xxxx) */
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
    name: varchar('name', { length: 128 }).notNull().default('Default'),
    tier: varchar('tier', { length: 32 }).notNull().default('pro'),
    permissions: text('permissions').array().default(sql`'{}'::text[]`),
    rateLimitDay: integer('rate_limit_day').notNull().default(50000),
    active: boolean('active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_apikeys_user').on(table.userId),
    uniqueIndex('idx_apikeys_hash').on(table.keyHash),
    index('idx_apikeys_tier').on(table.tier),
    index('idx_apikeys_active').on(table.active),
  ]
);

// ────────────────────────────────────────────────────────────────────────────
// auth_tokens — magic link tokens & refresh tokens
// ────────────────────────────────────────────────────────────────────────────

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    /** 'magic_link' | 'refresh' */
    type: varchar('type', { length: 32 }).notNull(),
    /** SHA-256 hash of the token */
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    /** IP address for security logging */
    ipAddress: varchar('ip_address', { length: 45 }),
  },
  (table) => [
    index('idx_authtokens_hash').on(table.tokenHash),
    index('idx_authtokens_user').on(table.userId),
    index('idx_authtokens_type').on(table.type),
    index('idx_authtokens_expires').on(table.expiresAt),
  ]
);
