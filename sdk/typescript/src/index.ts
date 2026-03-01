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
 * Free Crypto News TypeScript SDK
 * 
 * 100% FREE - no API keys required!
 * Full TypeScript support with type definitions.
 * 
 * @example
 * ```typescript
 * import { CryptoNews } from '@nirholas/crypto-news';
 * 
 * const client = new CryptoNews();
 * const articles = await client.getLatest(10);
 * ```
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/** 7-dimension tone/emotion analysis of an article */
export interface ArticleTone {
  /** Anger score 0–1 */
  anger: number;
  /** Fear score 0–1 */
  fear: number;
  /** Joy score 0–1 */
  joy: number;
  /** Sadness score 0–1 */
  sadness: number;
  /** Analytical writing style score 0–1 */
  analytical: number;
  /** Confident writing style score 0–1 */
  confident: number;
  /** Tentative/uncertain writing style score 0–1 */
  tentative: number;
}

/** Price movement observed within 1 hour of article publication */
export interface PriceImpact {
  /** Percentage change (positive = up, negative = down) */
  percentage: number | null;
  /** Overall impact direction */
  direction: 'positive' | 'negative' | 'neutral' | null;
  /** Raw impact score */
  score: number | null;
}

export interface NewsArticle {
  /** Article headline */
  title: string;
  /** Direct link to the article */
  link: string;
  /** Short description/excerpt */
  description?: string;
  /** ISO 8601 publication date */
  pubDate: string;
  /** Human-readable source name */
  source: string;
  /** Source key for filtering */
  sourceKey: string;
  /** Category: general, defi, bitcoin */
  category: string;
  /** Human-readable time ago string */
  timeAgo: string;
  /** Article author when available */
  author?: string;
  /** Source domain (e.g. 'cointelegraph.com') */
  domain?: string;
  /** Thumbnail image URL */
  image?: string;
  /**
   * Price impact within 1 hour of publication.
   * Inspired by executium/trending-historical-cryptocurrency-news (MIT)
   */
  price_impact?: PriceImpact;
  /**
   * 7-dimension tone analysis.
   * Inspired by executium/trending-historical-cryptocurrency-news (MIT)
   */
  tone?: ArticleTone;
}

export interface NewsResponse {
  /** Array of news articles */
  articles: NewsArticle[];
  /** Total number of articles before limit */
  totalCount: number;
  /** List of sources in response */
  sources: string[];
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: string;
}

export interface SourceInfo {
  /** Source key for filtering */
  key: string;
  /** Human-readable name */
  name: string;
  /** RSS feed URL */
  url: string;
  /** Category: general, defi, bitcoin */
  category: string;
  /** Current status */
  status: 'active' | 'unavailable';
}

export interface SourcesResponse {
  sources: SourceInfo[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  totalResponseTime: number;
  summary: {
    healthy: number;
    degraded: number;
    down: number;
    total: number;
  };
  sources: Array<{
    source: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    lastArticle?: string;
    error?: string;
  }>;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  articles: NewsArticle[];
}

export interface TrendingResponse {
  trending: TrendingTopic[];
  period: string;
  analyzedAt: string;
}

export interface StatsResponse {
  total_articles: number;
  articles_by_source: Record<string, number>;
  articles_by_category: Record<string, number>;
  last_updated: string;
}

export interface AnalyzedArticle extends NewsArticle {
  topics: string[];
  sentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  sentiment_score: number;
}

export interface AnalyzeResponse {
  articles: AnalyzedArticle[];
  summary: {
    overall_sentiment: string;
    bullish_count: number;
    bearish_count: number;
    neutral_count: number;
    top_topics: string[];
  };
}

export interface ArchiveResponse {
  articles: NewsArticle[];
  date: string;
  totalCount: number;
}

export interface OriginItem {
  title: string;
  link: string;
  source: string;
  likely_original_source: string;
  original_source_category: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface OriginsResponse {
  items: OriginItem[];
  totalCount: number;
  categories: Record<string, number>;
}

export type SourceKey = 
  | 'coindesk' 
  | 'theblock' 
  | 'decrypt' 
  | 'cointelegraph' 
  | 'bitcoinmagazine' 
  | 'blockworks' 
  | 'defiant';

/** Cryptocurrency price data */
export interface PriceData {
  /** Coin identifier */
  coin: string;
  /** Price in USD */
  usd: number;
  /** 24h change percentage */
  change24h?: number;
  /** Market cap in USD */
  marketCap?: number;
  /** 24h trading volume */
  volume24h?: number;
  /** Last updated ISO timestamp */
  updatedAt?: string;
}

/** Market overview data */
export interface MarketOverview {
  /** Total market capitalisation USD */
  totalMarketCap?: number;
  /** Total 24h trading volume */
  totalVolume?: number;
  /** BTC dominance percentage */
  btcDominance?: number;
  /** ETH dominance percentage */
  ethDominance?: number;
  /** Number of active cryptocurrencies */
  activeCurrencies?: number;
  /** ISO timestamp */
  updatedAt?: string;
  [key: string]: unknown;
}

/** Fear & Greed Index */
export interface FearGreedIndex {
  /** Current value 0–100 */
  value: number;
  /** Human-readable classification */
  classification: string;
  /** ISO timestamp */
  timestamp?: string;
  [key: string]: unknown;
}

/** Ethereum gas prices */
export interface GasPrices {
  /** Fast gas price in Gwei */
  fast?: number;
  /** Standard gas price in Gwei */
  standard?: number;
  /** Slow/safe gas price in Gwei */
  slow?: number;
  /** Base fee in Gwei */
  baseFee?: number;
  /** ISO timestamp */
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CryptoNewsOptions {
  /** Base URL for API (default: https://cryptocurrency.cv) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom fetch function for environments without native fetch */
  fetch?: typeof fetch;
}

// ═══════════════════════════════════════════════════════════════
// ERROR CLASSES
// ═══════════════════════════════════════════════════════════════

/** Base error for all Crypto News SDK errors */
export class CryptoNewsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoNewsError';
  }
}

/** Thrown on network-level failures (connection refused, timeout, DNS) */
export class NetworkError extends CryptoNewsError {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/** Thrown when the API returns a non-2xx status code */
export class APIError extends CryptoNewsError {
  public readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(`${message} (HTTP ${statusCode})`);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

/** Thrown when the API returns HTTP 429 Too Many Requests */
export class RateLimitError extends APIError {
  public readonly retryAfter?: number;
  constructor(retryAfter?: number) {
    const msg = retryAfter
      ? `Rate limit exceeded — retry after ${retryAfter}s`
      : 'Rate limit exceeded';
    super(429, msg);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 5-tier sentiment signal aligned with the API's own vocabulary.
 * Derived from graded score: very_bullish ≥ 0.5, bullish ≥ 0.15,
 * neutral > −0.15, bearish > −0.5, very_bearish ≤ −0.5.
 */
export type SentimentSignal =
  | 'very_bullish'
  | 'bullish'
  | 'neutral'
  | 'bearish'
  | 'very_bearish'
  | 'error';

/** Per-coin result from getCoinSentiment() */
export interface CoinSentimentResult {
  /** Search keyword used for this pair */
  keyword: string;
  /** Number of articles analysed */
  articles: number;
  /** Percentage of bullish/very_bullish articles */
  pos: number;
  /** Percentage of neutral articles */
  mid: number;
  /** Percentage of bearish/very_bearish articles */
  neg: number;
  /**
   * Weighted score −1.0 (strongly bearish) … +1.0 (strongly bullish).
   * very_bullish=+1, bullish=+0.5, neutral=0, bearish=−0.5, very_bearish=−1.
   */
  score: number;
  /** 5-tier signal derived from score */
  signal: SentimentSignal;
  /**
   * Composite confidence 0–100.
   * confidence = volumeWeight × marginWeight × 100
   * A single-article signal can never reach the default tradeable threshold.
   */
  confidence: number;
  /**
   * True only when articles ≥ minArticles AND confidence ≥ minConfidence.
   * Safe to use as a gate before placing a trade.
   */
  tradeable: boolean;
  /**
   * Human-readable suppression reason when tradeable=false.
   * Empty string when tradeable=true.
   */
  reason: string;
  /** Set when the fetch for this coin failed */
  error?: string;
}

/** Dict mapping exchange pair symbol → search keyword */
export type CoinPairs = Record<string, string>;

/**
 * Default set of 19 trading pairs used by getCoinSentiment().
 * Inspired by CyberPunkMetalHead/cryptocurrency-news-analysis.
 */
export const COIN_PAIRS: CoinPairs = {
  BTCUSD:   'Bitcoin',
  ETHUSD:   'Ethereum',
  LTCUSD:   'Litecoin',
  XRPUSD:   'Ripple',
  SOLUSD:   'Solana',
  BNBUSD:   'Binance',
  ADAUSD:   'Cardano',
  AVAXUSD:  'Avalanche',
  DOTUSD:   'Polkadot',
  MATICUSD: 'Polygon',
  DOGEUSD:  'Dogecoin',
  TRXUSD:   'Tron',
  XLMUSD:   'Stellar Lumens',
  XMRUSD:   'Monero',
  ZECUSD:   'Zcash',
  BATUSD:   'Basic Attention Token',
  EOSUSD:   'EOS',
  NEOUSD:   'NEO',
  ETCUSD:   'Ethereum Classic',
};

// ═══════════════════════════════════════════════════════════════
// CLIENT CLASS
// ═══════════════════════════════════════════════════════════════

export class CryptoNews {
  private baseUrl: string;
  private timeout: number;
  private fetchFn: typeof fetch;

  constructor(options: CryptoNewsOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://cryptocurrency.cv';
    this.timeout = options.timeout || 30000;
    this.fetchFn = options.fetch || fetch;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoNewsSDK/1.0',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryHeader = response.headers?.get?.('Retry-After');
          throw new RateLimitError(
            retryHeader ? parseFloat(retryHeader) : undefined
          );
        }
        throw new APIError(response.status, response.statusText);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      if (err instanceof CryptoNewsError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new NetworkError('Request timed out');
      }
      throw new NetworkError(
        err instanceof Error ? err.message : String(err),
        err instanceof Error ? err : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get latest crypto news from all sources
   * @param limit Maximum articles to return (1-50, default: 10)
   * @param source Optional source filter
   */
  async getLatest(limit: number = 10, source?: SourceKey): Promise<NewsArticle[]> {
    let endpoint = `/api/news?limit=${limit}`;
    if (source) endpoint += `&source=${source}`;
    const data = await this.request<NewsResponse>(endpoint);
    return data.articles;
  }

  /**
   * Get full response with metadata
   */
  async getLatestWithMeta(limit: number = 10, source?: SourceKey): Promise<NewsResponse> {
    let endpoint = `/api/news?limit=${limit}`;
    if (source) endpoint += `&source=${source}`;
    return this.request<NewsResponse>(endpoint);
  }

  /**
   * Search news by keywords
   * @param keywords Comma-separated search terms
   * @param limit Maximum results (1-30, default: 10)
   */
  async search(keywords: string, limit: number = 10): Promise<NewsArticle[]> {
    const encoded = encodeURIComponent(keywords);
    const data = await this.request<NewsResponse>(`/api/search?q=${encoded}&limit=${limit}`);
    return data.articles;
  }

  /**
   * Get DeFi-specific news
   * @param limit Maximum articles (1-30, default: 10)
   */
  async getDefi(limit: number = 10): Promise<NewsArticle[]> {
    const data = await this.request<NewsResponse>(`/api/defi?limit=${limit}`);
    return data.articles;
  }

  /**
   * Get Bitcoin-specific news
   * @param limit Maximum articles (1-30, default: 10)
   */
  async getBitcoin(limit: number = 10): Promise<NewsArticle[]> {
    const data = await this.request<NewsResponse>(`/api/bitcoin?limit=${limit}`);
    return data.articles;
  }

  /**
   * Get breaking news from the last 2 hours
   * @param limit Maximum articles (1-20, default: 5)
   */
  async getBreaking(limit: number = 5): Promise<NewsArticle[]> {
    const data = await this.request<NewsResponse>(`/api/breaking?limit=${limit}`);
    return data.articles;
  }

  /**
   * Get list of all news sources
   */
  async getSources(): Promise<SourceInfo[]> {
    const data = await this.request<SourcesResponse>('/api/sources');
    return data.sources;
  }

  /**
   * Check API health status
   */
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health');
  }

  /**
   * Get cryptocurrency price data
   * @param coin Optional coin filter (e.g. "bitcoin")
   */
  async getPrices(coin?: string): Promise<PriceData[] | Record<string, unknown>> {
    let endpoint = '/api/prices';
    if (coin) endpoint += `?coin=${encodeURIComponent(coin)}`;
    return this.request(endpoint);
  }

  /**
   * Get market overview (total cap, volume, dominance)
   */
  async getMarket(): Promise<MarketOverview> {
    return this.request<MarketOverview>('/api/market');
  }

  /**
   * Get Fear & Greed Index
   */
  async getFearGreed(): Promise<FearGreedIndex> {
    return this.request<FearGreedIndex>('/api/fear-greed');
  }

  /**
   * Get current Ethereum gas prices
   */
  async getGas(): Promise<GasPrices> {
    return this.request<GasPrices>('/api/gas');
  }

  /**
   * Get trending topics with sentiment analysis
   * @param limit Maximum topics (default: 10)
   * @param hours Time window in hours (default: 24)
   */
  async getTrending(limit: number = 10, hours: number = 24): Promise<TrendingResponse> {
    return this.request<TrendingResponse>(`/api/trending?limit=${limit}&hours=${hours}`);
  }

  /**
   * Get API statistics
   */
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/stats');
  }

  /**
   * Get news with topic classification and sentiment analysis
   * @param limit Maximum articles (default: 20)
   * @param topic Filter by topic
   * @param sentiment Filter by sentiment: 'bullish', 'bearish', 'neutral'
   */
  async analyze(limit: number = 20, topic?: string, sentiment?: 'bullish' | 'bearish' | 'neutral'): Promise<AnalyzeResponse> {
    let endpoint = `/api/analyze?limit=${limit}`;
    if (topic) endpoint += `&topic=${encodeURIComponent(topic)}`;
    if (sentiment) endpoint += `&sentiment=${sentiment}`;
    return this.request<AnalyzeResponse>(endpoint);
  }

  /**
   * Get archived historical news
   * @param date Date in YYYY-MM-DD format
   * @param query Search query
   * @param limit Maximum articles (default: 50)
   */
  async getArchive(date?: string, query?: string, limit: number = 50): Promise<ArchiveResponse> {
    const params = [`limit=${limit}`];
    if (date) params.push(`date=${date}`);
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    return this.request<ArchiveResponse>(`/api/archive?${params.join('&')}`);
  }

  /**
   * Find original sources of news
   * @param query Search query
   * @param category Filter by category: 'government', 'exchange', 'protocol', etc.
   * @param limit Maximum results (default: 20)
   */
  async getOrigins(query?: string, category?: string, limit: number = 20): Promise<OriginsResponse> {
    const params = [`limit=${limit}`];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (category) params.push(`category=${category}`);
    return this.request<OriginsResponse>(`/api/origins?${params.join('&')}`);
  }

  /**
   * Get RSS feed URL
   * @param feed Feed type: 'all', 'defi', 'bitcoin'
   */
  getRSSUrl(feed: 'all' | 'defi' | 'bitcoin' = 'all'): string {
    if (feed === 'all') return `${this.baseUrl}/api/rss`;
    return `${this.baseUrl}/api/rss?feed=${feed}`;
  }

  /**
   * Calculate per-coin sentiment with confidence weighting and trade filtering.
   *
   * All coins are fetched **concurrently** (Promise.all), so 19 coins take
   * ~1 round-trip of wall-clock latency rather than 19 serial requests.
   *
   * Confidence formula
   * ------------------
   * `confidence = volumeWeight × marginWeight × 100`
   * - **volumeWeight**: 0→1 as article count reaches `minArticles`. A single
   *   article can never exceed `1/minArticles` on this axis alone.
   * - **marginWeight**: normalised %-point gap between the dominant and
   *   second-highest sentiment bucket. A ~50/50 split → near-zero weight.
   *
   * Signal is derived from the graded `score`, not raw bucket counts,
   * giving 5 tiers: `very_bullish / bullish / neutral / bearish / very_bearish`.
   *
   * @param coins       Map of trading pair → search keyword (default: COIN_PAIRS)
   * @param limit       Max articles per coin (default: 30)
   * @param minArticles Minimum articles for tradeable=true (default: 5)
   * @param minConfidence  Minimum confidence score 0–100 for tradeable=true (default: 20)
   *
   * @example
   * ```ts
   * const news = new CryptoNews();
   * const report = await news.getCoinSentiment(
   *   { BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum' },
   *   30, 5, 20
   * );
   * for (const [pair, data] of Object.entries(report)) {
   *   if (data.tradeable) console.log(`TRADE ${pair}: ${data.signal} conf=${data.confidence.toFixed(1)}`);
   *   else console.log(`SKIP  ${pair}: ${data.reason}`);
   * }
   * ```
   */
  async getCoinSentiment(
    coins: CoinPairs = COIN_PAIRS,
    limit = 30,
    minArticles = 5,
    minConfidence = 20,
  ): Promise<Record<string, CoinSentimentResult>> {
    const SCORE_MAP: Record<string, number> = {
      very_bullish: +1.0,
      bullish:      +0.5,
      neutral:       0.0,
      bearish:      -0.5,
      very_bearish: -1.0,
    };
    const SIGNAL_TIERS: Array<[number, SentimentSignal]> = [
      [0.5,   'very_bullish'],
      [0.15,  'bullish'],
      [-0.15, 'neutral'],
      [-0.5,  'bearish'],
      [-999,  'very_bearish'],
    ];
    const BULLISH = new Set(['very_bullish', 'bullish']);
    const BEARISH = new Set(['very_bearish', 'bearish']);

    const entries = Object.entries(coins);
    const settled = await Promise.allSettled(
      entries.map(async ([pair, keyword]): Promise<[string, CoinSentimentResult]> => {
        const data = await this.analyze(limit, keyword);
        const articles = data.articles;
        const total = articles.length;

        if (total === 0) {
          return [pair, {
            keyword, articles: 0,
            pos: 0, mid: 0, neg: 0,
            score: 0, signal: 'neutral',
            confidence: 0, tradeable: false,
            reason: 'no articles found',
          }];
        }

        const pos = articles.filter(a => BULLISH.has(a.sentiment)).length;
        const neg = articles.filter(a => BEARISH.has(a.sentiment)).length;
        const mid = total - pos - neg;

        const posPct = (pos * 100) / total;
        const midPct = (mid * 100) / total;
        const negPct = (neg * 100) / total;

        const rawScore = articles.reduce(
          (sum, a) => sum + (SCORE_MAP[a.sentiment] ?? 0), 0
        );
        const score = Math.round((rawScore / total) * 10000) / 10000;

        const signal: SentimentSignal = (
          SIGNAL_TIERS.find(([t]) => score >= t) ?? [null, 'neutral']
        )[1] as SentimentSignal;

        const volumeWeight = Math.min(total / Math.max(minArticles, 1), 1.0);
        const pcts = [posPct, midPct, negPct].sort((a, b) => b - a);
        const marginWeight = Math.max(pcts[0] - pcts[1], 0) / 100;
        const confidence = Math.round(volumeWeight * marginWeight * 100 * 10) / 10;

        const reasons: string[] = [];
        if (total < minArticles)
          reasons.push(`only ${total} article${total === 1 ? '' : 's'} found (min ${minArticles})`);
        if (confidence < minConfidence)
          reasons.push(`confidence ${confidence.toFixed(1)} below threshold ${minConfidence}`);

        return [pair, {
          keyword,
          articles: total,
          pos:        Math.round(posPct * 10) / 10,
          mid:        Math.round(midPct * 10) / 10,
          neg:        Math.round(negPct * 10) / 10,
          score,
          signal,
          confidence,
          tradeable:  reasons.length === 0,
          reason:     reasons.join('; '),
        }];
      })
    );

    // Preserve original insertion order; map failures to error result.
    const result: Record<string, CoinSentimentResult> = {};
    for (let i = 0; i < entries.length; i++) {
      const [pair, keyword] = entries[i];
      const outcome = settled[i];
      if (outcome.status === 'fulfilled') {
        result[pair] = outcome.value[1];
      } else {
        result[pair] = {
          keyword, articles: 0,
          pos: 0, mid: 0, neg: 0,
          score: 0, signal: 'error',
          confidence: 0, tradeable: false,
          reason: String(outcome.reason),
          error: String(outcome.reason),
        };
      }
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const defaultClient = new CryptoNews();

/** Quick function to get latest news */
export async function getCryptoNews(limit: number = 10): Promise<NewsArticle[]> {
  return defaultClient.getLatest(limit);
}

/** Quick function to search news */
export async function searchCryptoNews(keywords: string, limit: number = 10): Promise<NewsArticle[]> {
  return defaultClient.search(keywords, limit);
}

/** Quick function to get DeFi news */
export async function getDefiNews(limit: number = 10): Promise<NewsArticle[]> {
  return defaultClient.getDefi(limit);
}

/** Quick function to get Bitcoin news */
export async function getBitcoinNews(limit: number = 10): Promise<NewsArticle[]> {
  return defaultClient.getBitcoin(limit);
}

/** Quick function to get breaking news */
export async function getBreakingNews(limit: number = 5): Promise<NewsArticle[]> {
  return defaultClient.getBreaking(limit);
}

/**
 * Quick function to get per-coin sentiment with trade filtering.
 * Uses the default COIN_PAIRS map.
 *
 * @param coins          Map of trading pair → keyword (default: COIN_PAIRS)
 * @param limit          Max articles per coin (default: 30)
 * @param minArticles    Min articles for tradeable=true (default: 5)
 * @param minConfidence  Min confidence 0–100 for tradeable=true (default: 20)
 */
export async function getCoinSentiment(
  coins: CoinPairs = COIN_PAIRS,
  limit = 30,
  minArticles = 5,
  minConfidence = 20,
): Promise<Record<string, CoinSentimentResult>> {
  return defaultClient.getCoinSentiment(coins, limit, minArticles, minConfidence);
}

// Default export
export default CryptoNews;
