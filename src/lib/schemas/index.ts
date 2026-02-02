/**
 * API Schema Definitions
 * 
 * Centralized Zod schemas for:
 * - Request validation
 * - Response validation
 * - Type generation
 * - OpenAPI generation
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Date range parameters
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * Language parameter
 */
export const languageSchema = z.enum([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar',
]);

/**
 * Coin ID parameter
 */
export const coinIdSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Coin ID must be lowercase alphanumeric with hyphens');

// =============================================================================
// NEWS API SCHEMAS
// =============================================================================

export const newsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  source: z.string().optional(),
  category: z.enum([
    'general', 'bitcoin', 'defi', 'nft', 'research', 'institutional',
    'etf', 'derivatives', 'onchain', 'fintech', 'macro', 'quant',
    'journalism', 'ethereum', 'asia', 'tradfi', 'mainstream', 'mining',
    'gaming', 'altl1', 'stablecoin',
  ]).optional(),
  lang: languageSchema.default('en'),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).optional(),
});

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  source: z.string(),
  category: z.string(),
  publishedAt: z.string().datetime(),
  imageUrl: z.string().url().nullable().optional(),
  author: z.string().nullable().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
});

export const newsResponseSchema = z.object({
  articles: z.array(articleSchema),
  total: z.number().int(),
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
  hasMore: z.boolean().optional(),
});

// =============================================================================
// V1 API SCHEMAS
// =============================================================================

export const v1CoinsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(250).default(100),
  order: z.enum([
    'market_cap_desc', 'market_cap_asc',
    'volume_desc', 'volume_asc',
    'id_asc', 'id_desc',
  ]).default('market_cap_desc'),
  ids: z.string().optional(), // Comma-separated
  sparkline: z.enum(['true', 'false']).default('false'),
});

export const coinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().nullable(),
  total_volume: z.number(),
  price_change_24h: z.number(),
  price_change_percentage_24h: z.number(),
  circulating_supply: z.number(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number(),
  atl: z.number(),
  image: z.string().url(),
});

// =============================================================================
// PREMIUM API SCHEMAS
// =============================================================================

export const aiSignalsQuerySchema = z.object({
  coin: coinIdSchema,
  timeframe: z.enum(['1h', '4h', '1d', '1w']).default('1d'),
  indicators: z.array(z.string()).optional(),
});

export const aiSignalSchema = z.object({
  coin: z.string(),
  signal: z.enum(['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']),
  confidence: z.number().min(0).max(1),
  price: z.number(),
  timestamp: z.string().datetime(),
  indicators: z.record(z.string(), z.unknown()).optional(),
  reasoning: z.string().optional(),
});

export const portfolioAnalyticsRequestSchema = z.object({
  holdings: z.array(z.object({
    coinId: z.string(),
    amount: z.number().positive(),
    purchasePrice: z.number().positive().optional(),
  })),
  currency: z.enum(['usd', 'eur', 'gbp', 'jpy']).default('usd'),
  period: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
});

// =============================================================================
// MARKET API SCHEMAS
// =============================================================================

export const marketCompareQuerySchema = z.object({
  coins: z.string().regex(/^[a-z0-9-,]+$/, 'Must be comma-separated coin IDs'),
  metrics: z.array(z.enum([
    'price', 'market_cap', 'volume', 'volatility', 'correlation',
  ])).optional(),
});

export const ohlcQuerySchema = z.object({
  coinId: coinIdSchema,
  days: z.enum(['1', '7', '14', '30', '90', '180', '365', 'max']).default('7'),
  vs_currency: z.string().default('usd'),
});

// =============================================================================
// ADMIN API SCHEMAS
// =============================================================================

export const adminStatsQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  groupBy: z.enum(['hour', 'day', 'endpoint']).optional(),
});

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

export const webhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'news.published',
    'price.alert',
    'whale.alert',
    'signal.generated',
  ])),
  secret: z.string().min(16).optional(),
  enabled: z.boolean().default(true),
});

// =============================================================================
// BREAKING NEWS SCHEMAS
// =============================================================================

export const breakingNewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  since: z.string().optional(), // ISO timestamp
  priority: z.enum(['high', 'critical']).optional(),
});

// =============================================================================
// TRENDING SCHEMAS
// =============================================================================

export const trendingQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d']).default('24h'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['coins', 'topics', 'all']).default('all'),
});

// =============================================================================
// SEARCH SCHEMAS
// =============================================================================

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500).trim(),
  type: z.enum(['news', 'coins', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  lang: languageSchema.default('en'),
});

// =============================================================================
// MARKET SCHEMAS
// =============================================================================

export const marketCoinsQuerySchema = z.object({
  type: z.enum(['list', 'top']).default('top'),
  limit: z.coerce.number().int().min(1).max(250).default(100),
});

export const marketCompareQuerySchema2 = z.object({
  ids: z.string().min(1).regex(/^[a-z0-9,-]+$/, 'Invalid coin IDs format'),
});

export const internationalNewsQuerySchema = z.object({
  language: z.enum(['ko', 'zh', 'ja', 'es', 'pt', 'de', 'fr', 'hi', 'fa', 'tr', 'ru', 'it', 'id', 'vi', 'th', 'pl', 'nl', 'ar']).optional(),
  region: z.enum(['asia', 'europe', 'latam', 'all']).default('all'),
  translate: z.enum(['true', 'false']).default('false'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// EXPORT TYPE HELPERS
// =============================================================================

// Export inferred types for TypeScript
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;
export type Article = z.infer<typeof articleSchema>;
export type NewsResponse = z.infer<typeof newsResponseSchema>;
export type V1CoinsQuery = z.infer<typeof v1CoinsQuerySchema>;
export type Coin = z.infer<typeof coinSchema>;
export type AiSignalsQuery = z.infer<typeof aiSignalsQuerySchema>;
export type AiSignal = z.infer<typeof aiSignalSchema>;
export type PortfolioAnalyticsRequest = z.infer<typeof portfolioAnalyticsRequestSchema>;
export type MarketCompareQuery = z.infer<typeof marketCompareQuerySchema>;
export type OhlcQuery = z.infer<typeof ohlcQuerySchema>;
export type AdminStatsQuery = z.infer<typeof adminStatsQuerySchema>;
export type WebhookCreate = z.infer<typeof webhookCreateSchema>;
export type BreakingNewsQuery = z.infer<typeof breakingNewsQuerySchema>;
export type TrendingQuery = z.infer<typeof trendingQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type MarketCoinsQuery = z.infer<typeof marketCoinsQuerySchema>;
export type InternationalNewsQuery = z.infer<typeof internationalNewsQuerySchema>;
