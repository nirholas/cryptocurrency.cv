/**
 * Free Crypto News API - TypeScript SDK
 * 
 * Complete type-safe SDK for all API endpoints.
 * No API key required.
 * 
 * @example
 * ```typescript
 * import { CryptoNewsAPI } from './crypto-news-sdk';
 * 
 * const api = new CryptoNewsAPI();
 * const news = await api.news.getLatest({ limit: 10 });
 * ```
 */

const BASE_URL = "https://cryptocurrency.cv";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Article {
    title: string;
    link: string;
    description?: string;
    pubDate: string;
    source: string;
    sourceKey: string;
    category?: string;
    timeAgo?: string;
    image?: string;
    sentiment?: SentimentResult;
}

export interface NewsResponse {
    articles: Article[];
    totalCount: number;
    sources: string[];
    fetchedAt: string;
    pagination: Pagination;
    lang: string;
    availableLanguages?: string[];
    responseTime: string;
}

export interface Pagination {
    page: number;
    perPage: number;
    totalPages: number;
    hasMore: boolean;
}

export interface SentimentResult {
    label: string;
    score: number;
    confidence?: number;
}

export interface MarketSentiment {
    overall: string;
    score: number;
    confidence: number;
    breakdown: {
        bullish: number;
        neutral: number;
        bearish: number;
    };
}

export interface FearGreedIndex {
    value: number;
    classification: string;
    history?: Array<{ date: string; value: number }>;
    components?: Record<string, number>;
}

export interface TradingSignal {
    asset?: string;
    signal: string;
    direction?: string;
    confidence: number;
    entry?: number;
    priceTarget?: number;
    stopLoss?: number;
    factors?: Array<{ name: string; weight?: number }>;
}

export interface ArbitrageOpportunity {
    pair: string;
    buyExchange: string;
    sellExchange: string;
    buyPrice: number;
    sellPrice: number;
    spread: number;
}

export interface WhaleAlert {
    asset: string;
    amount: number;
    value: number;
    from: string;
    to: string;
    type: string;
    timestamp: string;
}

export interface Liquidation {
    symbol: string;
    side: string;
    value: number;
    price: number;
    exchange: string;
    timestamp: string;
}

export interface OrderBook {
    symbol: string;
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
    spread: number;
    spreadPercent: number;
    imbalance: number;
}

export interface AlertRule {
    id?: string;
    name: string;
    condition: AlertCondition;
    channels: string[];
    webhookUrl?: string;
    cooldown: number;
    active?: boolean;
}

export interface AlertCondition {
    type: 'keyword' | 'price' | 'sentiment' | 'breaking' | 'whale' | 'liquidation' | 'source';
    keywords?: string[];
    operator?: string;
    asset?: string;
    value?: number;
    threshold?: number;
    sources?: string[];
    minValue?: number;
}

export interface Webhook {
    id?: string;
    url: string;
    events: string[];
    secret?: string;
    filters?: Record<string, any>;
}

// Options interfaces
export interface NewsOptions {
    limit?: number;
    source?: string;
    category?: string;
    page?: number;
    perPage?: number;
    from?: string;
    to?: string;
    lang?: string;
}

export interface InternationalNewsOptions {
    language?: string;
    region?: string;
    translate?: boolean;
    limit?: number;
    sources?: string;
}

export interface SignalOptions {
    asset?: string;
    timeframe?: '1h' | '4h' | '1d';
}

export interface ArbitrageOptions {
    pairs?: string[];
    minSpread?: number;
    exchanges?: string[];
}

export interface WhaleOptions {
    asset?: string;
    minValue?: number;
    type?: 'transfer' | 'exchange_inflow' | 'exchange_outflow';
}

export interface LiquidationOptions {
    symbol?: string;
    side?: 'long' | 'short';
    minValue?: number;
    period?: '1h' | '4h' | '24h';
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string = BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    url.searchParams.set(key, value.join(','));
                } else {
                    url.searchParams.set(key, String(value));
                }
            }
        });

        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }

    async post<T>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async put<T>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }
}

// =============================================================================
// API MODULES
// =============================================================================

class NewsAPI {
    constructor(private http: HttpClient) {}

    /** Get aggregated news from all sources */
    async getLatest(options: NewsOptions = {}): Promise<NewsResponse> {
        return this.http.get('/api/news', {
            limit: options.limit,
            source: options.source,
            category: options.category,
            page: options.page,
            per_page: options.perPage,
            from: options.from,
            to: options.to,
            lang: options.lang
        });
    }

    /** Get international news from 75+ sources */
    async getInternational(options: InternationalNewsOptions = {}): Promise<NewsResponse> {
        return this.http.get('/api/news/international', options);
    }

    /** Extract full article content from URL */
    async extractArticle(url: string): Promise<Article> {
        return this.http.post('/api/news/extract', { url });
    }

    /** Get available categories */
    async getCategories(): Promise<{ categories: any[]; totalCategories: number }> {
        return this.http.get('/api/news/categories');
    }

    /** Get Bitcoin-specific news */
    async getBitcoin(options: { limit?: number; lang?: string } = {}): Promise<NewsResponse> {
        return this.http.get('/api/bitcoin', options);
    }

    /** Get DeFi news */
    async getDefi(options: { limit?: number; lang?: string } = {}): Promise<NewsResponse> {
        return this.http.get('/api/defi', options);
    }

    /** Get breaking news */
    async getBreaking(options: { limit?: number; lang?: string } = {}): Promise<NewsResponse> {
        return this.http.get('/api/breaking', options);
    }

    /** Search news articles */
    async search(query: string, options: { limit?: number; from?: string; to?: string } = {}): Promise<NewsResponse & { query: string; searchTime: string }> {
        return this.http.get('/api/search', { q: query, ...options });
    }

    /** Get trending topics */
    async getTrending(limit: number = 10): Promise<{ topics: any[] }> {
        return this.http.get('/api/trending', { limit });
    }

    /** Get all available sources */
    async getSources(): Promise<{ sources: any[]; count: number }> {
        return this.http.get('/api/sources');
    }
}

class AIAPI {
    constructor(private http: HttpClient) {}

    /** Get AI-generated daily digest */
    async getDigest(options: { period?: string; format?: string } = {}): Promise<any> {
        return this.http.get('/api/digest', options);
    }

    /** Get sentiment analysis */
    async getSentiment(options: { asset?: string; limit?: number } = {}): Promise<{ market: MarketSentiment; articles: Article[] }> {
        return this.http.get('/api/sentiment', options);
    }

    /** Summarize an article by URL */
    async summarize(url: string): Promise<{ summary: string }> {
        return this.http.get('/api/summarize', { url });
    }

    /** Ask AI questions */
    async ask(question: string, context?: string): Promise<{ answer: string }> {
        return this.http.get('/api/ask', { q: question, context });
    }

    /** Unified AI request */
    async request(action: string, options: Record<string, any> = {}): Promise<any> {
        return this.http.post('/api/ai', { action, ...options });
    }

    /** Get AI market brief */
    async getBrief(options: { date?: string; format?: string } = {}): Promise<any> {
        return this.http.get('/api/ai/brief', options);
    }

    /** Generate AI debate */
    async debate(topic: string, article?: any): Promise<any> {
        return this.http.post('/api/ai/debate', { topic, article });
    }

    /** Generate counter-arguments */
    async counter(claim: string, context?: string): Promise<any> {
        return this.http.post('/api/ai/counter', { claim, context });
    }

    /** AI Agent query */
    async agent(options: { format?: string } = {}): Promise<any> {
        return this.http.get('/api/ai/agent', options);
    }

    /** Query AI Agent with natural language */
    async queryAgent(question: string, options: { assets?: string[]; timeHorizon?: string; focusAreas?: string[] } = {}): Promise<any> {
        return this.http.post('/api/ai/agent', { question, ...options });
    }

    /** Detect AI-generated content */
    async detectAIContent(text: string | string[], quick?: boolean): Promise<any> {
        const body = Array.isArray(text) ? { texts: text, quick } : { text, quick };
        return this.http.post('/api/detect/ai-content', body);
    }
}

class TradingAPI {
    constructor(private http: HttpClient) {}

    /** Get arbitrage opportunities */
    async getArbitrage(options: ArbitrageOptions = {}): Promise<{ opportunities: ArbitrageOpportunity[]; scanTime: string }> {
        return this.http.get('/api/arbitrage', {
            pairs: options.pairs,
            minSpread: options.minSpread,
            exchanges: options.exchanges
        });
    }

    /** Get AI trading signals */
    async getSignals(options: SignalOptions = {}): Promise<{ signal: TradingSignal }> {
        return this.http.get('/api/signals', options);
    }

    /** Get perpetual funding rates */
    async getFunding(options: { symbol?: string; exchanges?: string[] } = {}): Promise<any> {
        return this.http.get('/api/funding', options);
    }

    /** Get options flow data */
    async getOptions(options: { asset?: string; exchange?: string; type?: string } = {}): Promise<any> {
        return this.http.get('/api/options', { asset: options.asset || 'BTC', ...options });
    }

    /** Get liquidation data */
    async getLiquidations(options: LiquidationOptions = {}): Promise<{ liquidations: Liquidation[]; summary: any }> {
        return this.http.get('/api/liquidations', options);
    }

    /** Get whale alerts */
    async getWhaleAlerts(options: WhaleOptions = {}): Promise<{ alerts: WhaleAlert[]; hourlyFlow: any }> {
        return this.http.get('/api/whale-alerts', options);
    }

    /** Get order book */
    async getOrderbook(options: { symbol?: string; depth?: number; exchanges?: string[] } = {}): Promise<OrderBook> {
        return this.http.get('/api/orderbook', { symbol: options.symbol || 'BTCUSDT', ...options });
    }

    /** Get Fear & Greed Index */
    async getFearGreed(days: number = 7): Promise<FearGreedIndex> {
        return this.http.get('/api/fear-greed', { days });
    }
}

class MarketAPI {
    constructor(private http: HttpClient) {}

    /** Get coin market data */
    async getCoins(options: { ids?: string; vsCurrency?: string; order?: string; perPage?: number } = {}): Promise<any> {
        return this.http.get('/api/market/coins', {
            ids: options.ids,
            vs_currency: options.vsCurrency || 'usd',
            order: options.order,
            per_page: options.perPage
        });
    }

    /** Get OHLC candlestick data */
    async getOHLC(coinId: string, options: { days?: number; interval?: string } = {}): Promise<any> {
        return this.http.get(`/api/market/ohlc/${coinId}`, options);
    }

    /** Get exchange data */
    async getExchanges(): Promise<any> {
        return this.http.get('/api/market/exchanges');
    }

    /** Get derivatives data */
    async getDerivatives(): Promise<any> {
        return this.http.get('/api/market/derivatives');
    }

    /** Get market categories */
    async getCategories(): Promise<any> {
        return this.http.get('/api/market/categories');
    }

    /** Search market data */
    async search(query: string): Promise<any> {
        return this.http.get('/api/market/search', { q: query });
    }
}

class AnalyticsAPI {
    constructor(private http: HttpClient) {}

    /** Detect narrative clusters */
    async getNarratives(options: { period?: string; limit?: number } = {}): Promise<any> {
        return this.http.get('/api/narratives', options);
    }

    /** Get regulatory intelligence */
    async getRegulatory(options: { jurisdiction?: string; type?: string } = {}): Promise<any> {
        return this.http.get('/api/regulatory', options);
    }

    /** Get influencer data */
    async getInfluencers(options: { platform?: string; limit?: number; sortBy?: string } = {}): Promise<any> {
        return this.http.get('/api/influencers', options);
    }

    /** Detect anomalies */
    async getAnomalies(options: { hours?: number; severity?: string } = {}): Promise<any> {
        return this.http.get('/api/analytics/anomalies', options);
    }

    /** Get headline tracking */
    async getHeadlines(options: { hours?: number; changesOnly?: boolean } = {}): Promise<any> {
        return this.http.get('/api/analytics/headlines', options);
    }

    /** Get source credibility */
    async getCredibility(options: { source?: string; sortBy?: string } = {}): Promise<any> {
        return this.http.get('/api/analytics/credibility', options);
    }

    /** Get causal analysis */
    async getCausality(options: { eventId?: string; type?: string; asset?: string } = {}): Promise<any> {
        return this.http.get('/api/analytics/causality', options);
    }
}

class SocialAPI {
    constructor(private http: HttpClient) {}

    /** Get aggregated social sentiment */
    async getSentiment(options: { asset?: string; platforms?: string } = {}): Promise<any> {
        return this.http.get('/api/social', options);
    }

    /** Get Twitter/X sentiment */
    async getTwitterSentiment(options: { query?: string; accounts?: string } = {}): Promise<any> {
        return this.http.get('/api/social/x/sentiment', options);
    }

    /** Get community monitoring data */
    async getMonitor(options: { platform?: string; hours?: number } = {}): Promise<any> {
        return this.http.get('/api/social/monitor', options);
    }

    /** Get influencer scores */
    async getInfluencerScores(options: { username?: string; platform?: string } = {}): Promise<any> {
        return this.http.get('/api/social/influencer-score', options);
    }
}

class AlertsAPI {
    constructor(private http: HttpClient) {}

    /** Create an alert */
    async create(alert: AlertRule): Promise<{ alert: AlertRule }> {
        return this.http.post('/api/alerts', alert);
    }

    /** List alerts */
    async list(userId?: string): Promise<{ alerts: AlertRule[]; total: number }> {
        return this.http.get('/api/alerts', { userId });
    }

    /** Get alert by ID */
    async get(id: string): Promise<AlertRule> {
        return this.http.get(`/api/alerts/${id}`);
    }

    /** Update alert */
    async update(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
        return this.http.put(`/api/alerts/${id}`, updates);
    }

    /** Delete alert */
    async delete(id: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/alerts/${id}`);
    }

    /** Test alert */
    async test(id: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/alerts/${id}?action=test`, {});
    }
}

class WebhooksAPI {
    constructor(private http: HttpClient) {}

    /** Register webhook */
    async register(webhook: Webhook): Promise<{ webhook: Webhook }> {
        return this.http.post('/api/webhooks', webhook);
    }

    /** Test webhook */
    async test(webhookId: string): Promise<{ success: boolean }> {
        return this.http.post('/api/webhooks/test', { webhookId });
    }

    /** Get queue status */
    async getQueue(): Promise<any> {
        return this.http.get('/api/webhooks/queue');
    }
}

class ArchiveAPI {
    constructor(private http: HttpClient) {}

    /** Query historical archive */
    async query(options: { date?: string; start?: string; end?: string; source?: string; ticker?: string; limit?: number } = {}): Promise<any> {
        return this.http.get('/api/archive', options);
    }

    /** Query archive with advanced filters (same as query, v2 now redirects here) */
    async queryV2(options: { start_date?: string; end_date?: string; source?: string; q?: string; sentiment?: string } = {}): Promise<any> {
        return this.http.get('/api/archive', options);
    }

    /** Get archive status */
    async getStatus(): Promise<any> {
        return this.http.get('/api/archive/status');
    }
}

class UtilityAPI {
    constructor(private http: HttpClient) {}

    /** Health check */
    async getHealth(): Promise<any> {
        return this.http.get('/api/health');
    }

    /** Get API statistics */
    async getStats(): Promise<any> {
        return this.http.get('/api/stats');
    }

    /** Get cache status */
    async getCacheStatus(): Promise<any> {
        return this.http.get('/api/cache');
    }

    /** Clear cache */
    async clearCache(): Promise<any> {
        return this.http.delete('/api/cache');
    }

    /** Get OpenAPI specification */
    async getOpenAPI(): Promise<any> {
        return this.http.get('/api/openapi.json');
    }
}

// =============================================================================
// MAIN SDK CLASS
// =============================================================================

export class CryptoNewsAPI {
    private http: HttpClient;

    public news: NewsAPI;
    public ai: AIAPI;
    public trading: TradingAPI;
    public market: MarketAPI;
    public analytics: AnalyticsAPI;
    public social: SocialAPI;
    public alerts: AlertsAPI;
    public webhooks: WebhooksAPI;
    public archive: ArchiveAPI;
    public utility: UtilityAPI;

    constructor(baseUrl: string = BASE_URL) {
        this.http = new HttpClient(baseUrl);

        this.news = new NewsAPI(this.http);
        this.ai = new AIAPI(this.http);
        this.trading = new TradingAPI(this.http);
        this.market = new MarketAPI(this.http);
        this.analytics = new AnalyticsAPI(this.http);
        this.social = new SocialAPI(this.http);
        this.alerts = new AlertsAPI(this.http);
        this.webhooks = new WebhooksAPI(this.http);
        this.archive = new ArchiveAPI(this.http);
        this.utility = new UtilityAPI(this.http);
    }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function examples() {
    const api = new CryptoNewsAPI();

    console.log("=".repeat(60));
    console.log("🚀 CRYPTO NEWS API - TypeScript SDK Examples");
    console.log("=".repeat(60));

    try {
        // News
        console.log("\n📰 Latest News:");
        const news = await api.news.getLatest({ limit: 3 });
        news.articles.forEach(a => console.log(`   - ${a.title.slice(0, 50)}...`));

        // Fear & Greed
        console.log("\n😨 Fear & Greed Index:");
        const fg = await api.trading.getFearGreed();
        console.log(`   Value: ${fg.value}/100 - ${fg.classification}`);

        // Sentiment
        console.log("\n📊 Market Sentiment:");
        const sentiment = await api.ai.getSentiment({ limit: 20 });
        console.log(`   Overall: ${sentiment.market?.overall}`);

        // Whale Alerts
        console.log("\n🐋 Whale Alerts:");
        const whales = await api.trading.getWhaleAlerts({ minValue: 5000000 });
        whales.alerts?.slice(0, 3).forEach(w => {
            console.log(`   - ${w.asset}: $${w.value?.toLocaleString()}`);
        });

        console.log("\n" + "=".repeat(60));
        console.log("✅ All examples completed!");

    } catch (error) {
        console.error("Error:", error);
    }
}

// Export default instance
export default new CryptoNewsAPI();
