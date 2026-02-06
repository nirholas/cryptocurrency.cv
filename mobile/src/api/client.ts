/**
 * Free Crypto News API Client for React Native
 */

const BASE_URL = 'https://cryptocurrency.cv';

export interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
  ticker?: string;
  image?: string;
}

export interface NewsResponse {
  articles: Article[];
  totalCount: number;
  fetchedAt: string;
}

export interface Sentiment {
  overall: string;
  score: number;
  label: 'bullish' | 'bearish' | 'neutral';
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image?: string;
}

export interface FearGreed {
  value: number;
  classification: string;
  timestamp: string;
}

class CryptoNewsClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoNews-Mobile/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // News endpoints
  async getNews(limit: number = 20, source?: string, ticker?: string): Promise<NewsResponse> {
    const params: Record<string, string> = { limit: limit.toString() };
    if (source) params.source = source;
    if (ticker) params.ticker = ticker;
    return this.fetch('/api/news', params);
  }

  async getBreakingNews(limit: number = 10): Promise<NewsResponse> {
    return this.fetch('/api/breaking', { limit: limit.toString() });
  }

  async getTrending(limit: number = 10): Promise<NewsResponse> {
    return this.fetch('/api/trending', { limit: limit.toString() });
  }

  async search(query: string, limit: number = 20): Promise<NewsResponse> {
    return this.fetch('/api/search', { q: query, limit: limit.toString() });
  }

  async getBitcoinNews(limit: number = 20): Promise<NewsResponse> {
    return this.fetch('/api/news', { ticker: 'BTC', limit: limit.toString() });
  }

  async getEthereumNews(limit: number = 20): Promise<NewsResponse> {
    return this.fetch('/api/news', { ticker: 'ETH', limit: limit.toString() });
  }

  async getDeFiNews(limit: number = 20): Promise<NewsResponse> {
    return this.fetch('/api/defi', { limit: limit.toString() });
  }

  // AI endpoints
  async getSentiment(asset?: string): Promise<Sentiment> {
    const params: Record<string, string> = {};
    if (asset) params.asset = asset;
    return this.fetch('/api/ai/sentiment', params);
  }

  async askQuestion(question: string): Promise<{ response: string }> {
    return this.fetch('/api/ask', { q: question });
  }

  async getDigest(): Promise<{ summary: string; topStories: Article[] }> {
    return this.fetch('/api/digest');
  }

  // Market endpoints
  async getMarketCoins(limit: number = 20): Promise<{ coins: MarketCoin[] }> {
    return this.fetch('/api/market/coins', { limit: limit.toString() });
  }

  async getFearGreed(): Promise<FearGreed> {
    return this.fetch('/api/market/fear-greed');
  }

  async getCoinPrice(symbol: string): Promise<MarketCoin> {
    return this.fetch(`/api/market/coins/${symbol.toLowerCase()}`);
  }

  // Utility
  async healthCheck(): Promise<{ status: string }> {
    return this.fetch('/api/health');
  }
}

export const api = new CryptoNewsClient();
export default api;
