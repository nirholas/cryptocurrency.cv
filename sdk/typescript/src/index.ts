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
  sentiment: 'bullish' | 'bearish' | 'neutral';
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

export interface CryptoNewsOptions {
  /** Base URL for API (default: https://cryptocurrency.cv) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom fetch function for environments without native fetch */
  fetch?: typeof fetch;
}

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
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

// Default export
export default CryptoNews;
