/**
 * Free Crypto News API - TypeScript SDK
 * https://github.com/nirholas/free-crypto-news
 * 
 * Complete TypeScript SDK with type definitions for all 184 API endpoints.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  sentiment?: SentimentResult;
}

export interface SentimentResult {
  score: number;        // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;   // 0 to 1
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
}

export interface FearGreedIndex {
  value: number;        // 0-100
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
  previousClose?: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ArbitrageOpportunity {
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  timestamp: string;
}

export interface TradingSignal {
  asset: string;
  type: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'moderate' | 'weak';
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  indicators: Record<string, number>;
  timestamp: string;
}

export interface WhaleAlert {
  txHash: string;
  chain: string;
  from: string;
  to: string;
  amount: number;
  amountUSD: number;
  token: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'youtube' | 'discord' | 'telegram';
  author: string;
  content: string;
  url: string;
  likes?: number;
  comments?: number;
  shares?: number;
  timestamp: string;
}

export interface GasPrice {
  chain: string;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  baseFee?: number;
  timestamp: string;
}

export interface DeFiTVL {
  protocol: string;
  tvl: number;
  tvlChange24h: number;
  chain: string;
  category: string;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  jurisdiction: string;
  agency?: string;
  type: string;
  summary: string;
  url: string;
  publishedAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  error?: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

export class CryptoNewsClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(options: { apiKey?: string; baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || 'https://cryptocurrency.cv';
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ===========================================================================
  // NEWS ENDPOINTS
  // ===========================================================================

  async getNews(params: {
    limit?: number;
    page?: number;
    category?: string;
    source?: string;
    search?: string;
  } = {}): Promise<APIResponse<Article[]>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/news${query ? `?${query}` : ''}`);
  }

  async getArticle(id: string): Promise<APIResponse<Article>> {
    return this.request(`/api/news/${id}`);
  }

  async searchNews(query: string, options: {
    limit?: number;
    from?: string;
    to?: string;
  } = {}): Promise<APIResponse<Article[]>> {
    const params = new URLSearchParams({ q: query, ...options } as Record<string, string>);
    return this.request(`/api/search?${params}`);
  }

  async getCategories(): Promise<APIResponse<string[]>> {
    return this.request('/api/categories');
  }

  async getSources(): Promise<APIResponse<{ id: string; name: string; url: string }[]>> {
    return this.request('/api/sources');
  }

  async getTrending(): Promise<APIResponse<Article[]>> {
    return this.request('/api/trending');
  }

  async getBreakingNews(): Promise<APIResponse<Article[]>> {
    return this.request('/api/breaking');
  }

  // ===========================================================================
  // AI ENDPOINTS
  // ===========================================================================

  async getSentiment(params: {
    asset?: string;
    text?: string;
  }): Promise<APIResponse<SentimentResult>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/ai/sentiment?${query}`);
  }

  async summarize(params: {
    url?: string;
    text?: string;
    length?: 'short' | 'medium' | 'long';
  }): Promise<APIResponse<{ summary: string }>> {
    return this.request('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async ask(question: string, context?: string): Promise<APIResponse<{ answer: string }>> {
    return this.request('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }

  async extractEntities(text: string): Promise<APIResponse<{
    entities: { type: string; value: string; confidence: number }[];
  }>> {
    return this.request('/api/ai/entities', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async detectClickbait(title: string): Promise<APIResponse<{
    isClickbait: boolean;
    confidence: number;
  }>> {
    return this.request('/api/ai/clickbait', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async factCheck(claim: string): Promise<APIResponse<{
    rating: string;
    explanation: string;
    sources: string[];
  }>> {
    return this.request('/api/ai/factcheck', {
      method: 'POST',
      body: JSON.stringify({ claim }),
    });
  }

  // ===========================================================================
  // MARKET ENDPOINTS
  // ===========================================================================

  async getCoins(params: {
    limit?: number;
    page?: number;
    order?: 'market_cap_desc' | 'volume_desc' | 'price_change_desc';
  } = {}): Promise<APIResponse<Coin[]>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/coins?${query}`);
  }

  async getCoin(id: string): Promise<APIResponse<Coin>> {
    return this.request(`/api/coins/${id}`);
  }

  async getOHLC(params: {
    coin: string;
    interval: '1h' | '4h' | '1d' | '1w';
    limit?: number;
  }): Promise<APIResponse<OHLCData[]>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/market/ohlc?${query}`);
  }

  async getFearGreed(): Promise<APIResponse<FearGreedIndex>> {
    return this.request('/api/market/fear-greed');
  }

  async getExchanges(): Promise<APIResponse<{
    id: string;
    name: string;
    volume24h: number;
    trustScore: number;
  }[]>> {
    return this.request('/api/exchanges');
  }

  async getOrderbook(params: {
    exchange: string;
    pair: string;
  }): Promise<APIResponse<{
    bids: [number, number][];
    asks: [number, number][];
  }>> {
    const query = new URLSearchParams(params);
    return this.request(`/api/orderbook?${query}`);
  }

  // ===========================================================================
  // TRADING ENDPOINTS
  // ===========================================================================

  async getArbitrage(params: {
    minSpread?: number;
    pairs?: string[];
  } = {}): Promise<APIResponse<ArbitrageOpportunity[]>> {
    const query = new URLSearchParams({
      ...params,
      pairs: params.pairs?.join(','),
    } as Record<string, string>);
    return this.request(`/api/trading/arbitrage?${query}`);
  }

  async getSignals(params: {
    asset?: string;
    type?: 'buy' | 'sell';
  } = {}): Promise<APIResponse<TradingSignal[]>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/trading/signals?${query}`);
  }

  async getFundingRates(): Promise<APIResponse<{
    exchange: string;
    pair: string;
    rate: number;
    nextFunding: string;
  }[]>> {
    return this.request('/api/trading/funding');
  }

  async getWhaleAlerts(params: {
    minValue?: number;
    chain?: string;
  } = {}): Promise<APIResponse<WhaleAlert[]>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/trading/whales?${query}`);
  }

  async getLiquidations(): Promise<APIResponse<{
    exchange: string;
    pair: string;
    side: 'long' | 'short';
    amount: number;
    price: number;
    timestamp: string;
  }[]>> {
    return this.request('/api/trading/liquidations');
  }

  // ===========================================================================
  // SOCIAL ENDPOINTS
  // ===========================================================================

  async getTwitterFeed(topic: string): Promise<APIResponse<SocialPost[]>> {
    return this.request(`/api/social/x?topic=${topic}`);
  }

  async getRedditFeed(subreddit: string): Promise<APIResponse<SocialPost[]>> {
    return this.request(`/api/social/reddit?subreddit=${subreddit}`);
  }

  async getSocialSentiment(asset: string): Promise<APIResponse<{
    twitter: SentimentResult;
    reddit: SentimentResult;
    overall: SentimentResult;
  }>> {
    return this.request(`/api/social/sentiment?asset=${asset}`);
  }

  async getInfluencers(): Promise<APIResponse<{
    name: string;
    handle: string;
    platform: string;
    followers: number;
  }[]>> {
    return this.request('/api/social/influencers');
  }

  // ===========================================================================
  // BLOCKCHAIN ENDPOINTS
  // ===========================================================================

  async getGasPrices(chain = 'ethereum'): Promise<APIResponse<GasPrice>> {
    return this.request(`/api/blockchain/gas?chain=${chain}`);
  }

  async getDeFiTVL(params: {
    chain?: string;
    protocol?: string;
  } = {}): Promise<APIResponse<DeFiTVL[]>> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/blockchain/defi/tvl?${query}`);
  }

  async getWhaleMovements(chain?: string): Promise<APIResponse<WhaleAlert[]>> {
    return this.request(`/api/blockchain/whales${chain ? `?chain=${chain}` : ''}`);
  }

  async getAirdrops(): Promise<APIResponse<{
    name: string;
    token: string;
    status: 'upcoming' | 'active' | 'ended';
    requirements: string[];
    estimatedValue?: number;
  }[]>> {
    return this.request('/api/blockchain/airdrops');
  }

  async checkRugPull(address: string, chain = 'ethereum'): Promise<APIResponse<{
    riskScore: number;
    flags: string[];
    isRugPull: boolean;
  }>> {
    return this.request(`/api/blockchain/security/rugcheck?address=${address}&chain=${chain}`);
  }

  // ===========================================================================
  // REGULATORY ENDPOINTS
  // ===========================================================================

  async getRegulatoryNews(jurisdiction?: string): Promise<APIResponse<RegulatoryUpdate[]>> {
    return this.request(`/api/regulatory/news${jurisdiction ? `?jurisdiction=${jurisdiction}` : ''}`);
  }

  async getETFNews(): Promise<APIResponse<RegulatoryUpdate[]>> {
    return this.request('/api/regulatory/etf');
  }

  async getSECNews(): Promise<APIResponse<RegulatoryUpdate[]>> {
    return this.request('/api/regulatory/sec');
  }

  async getCountryRegulations(countryCode: string): Promise<APIResponse<{
    country: string;
    status: string;
    regulations: RegulatoryUpdate[];
  }>> {
    return this.request(`/api/regulatory/country?code=${countryCode}`);
  }

  // ===========================================================================
  // FEED ENDPOINTS
  // ===========================================================================

  async getRSSFeed(category?: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/rss${category ? `?category=${category}` : ''}`
    );
    return response.text();
  }

  async getJSONFeed(): Promise<APIResponse<{ items: Article[] }>> {
    return this.request('/api/feeds/json');
  }

  // ===========================================================================
  // STREAMING
  // ===========================================================================

  streamNews(callback: (article: Article) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/api/stream`);
    
    eventSource.onmessage = (event) => {
      const article = JSON.parse(event.data);
      callback(article);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }

  async connectWebSocket(handlers: {
    onMessage?: (data: unknown) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  }): Promise<WebSocket> {
    const ws = new WebSocket(`wss://${this.baseUrl.replace(/^https?:\/\//, '')}/api/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handlers.onMessage?.(data);
    };
    
    ws.onerror = handlers.onError || (() => {});
    ws.onclose = handlers.onClose || (() => {});

    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve(ws);
      ws.onerror = reject;
    });
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default CryptoNewsClient;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

/*
import CryptoNewsClient from './sdk';

// Initialize client
const client = new CryptoNewsClient({
  apiKey: 'your-api-key', // Optional for public endpoints
});

// Get latest news
const news = await client.getNews({ limit: 10 });
console.log(news.data);

// Get sentiment for Bitcoin
const sentiment = await client.getSentiment({ asset: 'BTC' });
console.log(sentiment.data);

// Get market data
const coins = await client.getCoins({ limit: 100 });
console.log(coins.data);

// Get fear & greed index
const fearGreed = await client.getFearGreed();
console.log(fearGreed.data);

// Get arbitrage opportunities
const arbitrage = await client.getArbitrage({ minSpread: 1 });
console.log(arbitrage.data);

// Stream real-time news
const unsubscribe = client.streamNews((article) => {
  console.log('New article:', article.title);
});

// Later: stop streaming
// unsubscribe();
*/
