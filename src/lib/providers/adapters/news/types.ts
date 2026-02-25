/**
 * News Types — Shared types for news data adapters
 *
 * @module providers/adapters/news/types
 */

/** A news article from any provider */
export interface NewsArticle {
  /** Unique article ID */
  id: string;
  /** Article title */
  title: string;
  /** Article URL */
  url: string;
  /** Source name (e.g., 'CoinDesk', 'The Block') */
  source: string;
  /** Author name if available */
  author?: string;
  /** Publication timestamp (ISO 8601) */
  publishedAt: string;
  /** Short description / excerpt */
  description?: string;
  /** Featured image URL */
  imageUrl?: string;
  /** Related cryptocurrency symbols */
  currencies: string[];
  /** Content categories / tags */
  categories: string[];
  /** Sentiment score (-1 to 1) if available */
  sentiment?: number;
  /** Community votes / engagement */
  votes?: { positive: number; negative: number; important: number };
  /** Article kind (news, media, analysis, etc.) */
  kind: 'news' | 'media' | 'analysis' | 'government' | 'opinion';
  /** Data provider name */
  provider: string;
}

/** News feed summary / aggregate */
export interface NewsFeedSummary {
  /** Total articles in response */
  count: number;
  /** Articles per source breakdown */
  sourceCounts: Record<string, number>;
  /** Trending currencies (by mention count) */
  trendingCurrencies: { symbol: string; mentions: number }[];
  /** Average sentiment across articles */
  averageSentiment: number;
  /** Articles */
  articles: NewsArticle[];
  /** Feed timestamp */
  timestamp: string;
}
