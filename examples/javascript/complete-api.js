/**
 * Free Crypto News API - Complete JavaScript SDK Examples
 * 
 * This file contains working examples for ALL API endpoints.
 * No API key required - all endpoints are free and open.
 * 
 * Base URL: https://cryptocurrency.cv
 * 
 * @author Free Crypto News
 * @license MIT
 */

const BASE_URL = "https://cryptocurrency.cv";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Make a GET request to the API.
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
async function get(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });
    
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Make a POST request to the API.
 * @param {string} endpoint - API endpoint path
 * @param {Object} body - Request body
 * @returns {Promise<Object>} API response
 */
async function post(endpoint, body = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

// =============================================================================
// 📰 NEWS ENDPOINTS
// =============================================================================

/** Get aggregated news from all sources */
export async function getNews(options = {}) {
    const { limit = 20, source, category, page, perPage, from, to, lang } = options;
    return get("/api/news", { limit, source, category, page, per_page: perPage, from, to, lang });
}

/** Get international news from 75+ sources */
export async function getInternationalNews(options = {}) {
    const { language, region, translate, limit, sources } = options;
    return get("/api/news/international", { language, region, translate, limit, sources });
}

/** Extract full article content from URL */
export async function extractArticle(url) {
    return post("/api/news/extract", { url });
}

/** Get available news categories */
export async function getCategories() {
    return get("/api/news/categories");
}

/** Get Bitcoin-specific news */
export async function getBitcoinNews(options = {}) {
    const { limit = 20, lang } = options;
    return get("/api/bitcoin", { limit, lang });
}

/** Get DeFi news */
export async function getDefiNews(options = {}) {
    const { limit = 20, lang } = options;
    return get("/api/defi", { limit, lang });
}

/** Get breaking news (1-min cache) */
export async function getBreakingNews(options = {}) {
    const { limit, lang } = options;
    return get("/api/breaking", { limit, lang });
}

/** Search news articles */
export async function searchNews(query, options = {}) {
    const { limit = 20, lang, from, to } = options;
    return get("/api/search", { q: query, limit, lang, from, to });
}

/** Get trending topics */
export async function getTrending(limit = 10) {
    return get("/api/trending", { limit });
}

/** Get all available sources */
export async function getSources() {
    return get("/api/sources");
}

// =============================================================================
// 🤖 AI-POWERED ENDPOINTS
// =============================================================================

/** Get AI-generated daily digest */
export async function getDigest(options = {}) {
    const { period = "24h", format = "full" } = options;
    return get("/api/digest", { period, format });
}

/** Get sentiment analysis */
export async function getSentiment(options = {}) {
    const { asset, limit = 20 } = options;
    return get("/api/sentiment", { asset, limit });
}

/** Summarize an article by URL */
export async function summarizeArticle(url) {
    return get("/api/summarize", { url });
}

/** Ask AI questions about crypto news */
export async function askAI(question, context) {
    return get("/api/ask", { q: question, context });
}

/** Unified AI endpoint for various actions */
export async function aiRequest(action, options = {}) {
    return post("/api/ai", { action, ...options });
}

/** Get AI market brief */
export async function getAIBrief(options = {}) {
    const { date, format } = options;
    return get("/api/ai/brief", { date, format });
}

/** Generate AI debate (bull vs bear) */
export async function aiDebate(topic, article) {
    return post("/api/ai/debate", { topic, article });
}

/** Generate counter-arguments */
export async function aiCounter(claim, context) {
    return post("/api/ai/counter", { claim, context });
}

/** AI Market Intelligence Agent */
export async function aiAgent(options = {}) {
    const { format = "full" } = options;
    return get("/api/ai/agent", { format });
}

/** Query AI Agent with natural language */
export async function queryAIAgent(question, options = {}) {
    const { assets, timeHorizon, focusAreas } = options;
    return post("/api/ai/agent", { question, assets, timeHorizon, focusAreas });
}

/** Natural language oracle queries */
export async function queryOracle(question, options = {}) {
    const { context, format } = options;
    return get("/api/oracle", { q: question, context, format });
}

/** Detect AI-generated content */
export async function detectAIContent(text, quick = false) {
    return post("/api/detect/ai-content", { text, quick });
}

// =============================================================================
// 📊 TRADING & MARKET APIs
// =============================================================================

/** Get arbitrage opportunities */
export async function getArbitrage(options = {}) {
    const { pairs, minSpread = 0.5, exchanges } = options;
    const params = { minSpread };
    if (pairs) params.pairs = Array.isArray(pairs) ? pairs.join(",") : pairs;
    if (exchanges) params.exchanges = Array.isArray(exchanges) ? exchanges.join(",") : exchanges;
    return get("/api/arbitrage", params);
}

/** Get AI trading signals */
export async function getSignals(options = {}) {
    const { asset, timeframe = "1h" } = options;
    return get("/api/signals", { asset, timeframe });
}

/** Get perpetual funding rates */
export async function getFundingRates(options = {}) {
    const { symbol, exchanges } = options;
    return get("/api/funding", { symbol, exchanges });
}

/** Get options flow data */
export async function getOptionsFlow(options = {}) {
    const { asset = "BTC", exchange, type } = options;
    return get("/api/options", { asset, exchange, type });
}

/** Get liquidation data */
export async function getLiquidations(options = {}) {
    const { symbol, side, minValue = 100000, period = "24h" } = options;
    return get("/api/liquidations", { symbol, side, minValue, period });
}

/** Get whale alerts */
export async function getWhaleAlerts(options = {}) {
    const { asset, minValue = 1000000, type } = options;
    return get("/api/whale-alerts", { asset, minValue, type });
}

/** Get order book data */
export async function getOrderbook(options = {}) {
    const { symbol = "BTCUSDT", depth = 20, exchanges } = options;
    return get("/api/orderbook", { symbol, depth, exchanges });
}

/** Get Fear & Greed Index */
export async function getFearGreed(days = 7) {
    return get("/api/fear-greed", { days });
}

// =============================================================================
// 📈 MARKET DATA APIs
// =============================================================================

/** Get coin market data */
export async function getCoins(options = {}) {
    const { ids, vsCurrency = "usd", order, perPage } = options;
    return get("/api/market/coins", { ids, vs_currency: vsCurrency, order, per_page: perPage });
}

/** Get OHLC candlestick data */
export async function getOHLC(coinId, options = {}) {
    const { days = 30, interval } = options;
    return get(`/api/market/ohlc/${coinId}`, { days, interval });
}

/** Get exchange data */
export async function getExchanges() {
    return get("/api/market/exchanges");
}

/** Get derivatives market data */
export async function getDerivatives() {
    return get("/api/market/derivatives");
}

/** Get market categories */
export async function getMarketCategories() {
    return get("/api/market/categories");
}

/** Search market data */
export async function searchMarket(query) {
    return get("/api/market/search", { q: query });
}

// =============================================================================
// 🔬 AI ANALYSIS APIs
// =============================================================================

/** Detect narrative clusters */
export async function getNarratives(options = {}) {
    const { period, limit } = options;
    return get("/api/narratives", { period, limit });
}

/** Extract named entities */
export async function getEntities(options = {}) {
    const { url, text } = options;
    return get("/api/entities", { url, text });
}

/** Extract and verify claims */
export async function getClaims(url) {
    return get("/api/claims", { url });
}

/** Detect clickbait headlines */
export async function detectClickbait(headline) {
    return get("/api/clickbait", { headline });
}

/** Detect original news source */
export async function getOrigins(url) {
    return get("/api/origins", { url });
}

/** Extract relationships from article */
export async function getRelationships(url) {
    return get("/api/relationships", { url });
}

// =============================================================================
// 📊 RESEARCH & ANALYTICS APIs
// =============================================================================

/** Get regulatory intelligence */
export async function getRegulatoryNews(options = {}) {
    const { jurisdiction, type } = options;
    return get("/api/regulatory", { jurisdiction, type });
}

/** Get/submit predictions */
export async function getPredictions(options = {}) {
    const { action, asset, predictor } = options;
    return get("/api/predictions", { action, asset, predictor });
}

/** Submit a prediction */
export async function submitPrediction(prediction) {
    return post("/api/predictions", prediction);
}

/** Get influencer tracking data */
export async function getInfluencers(options = {}) {
    const { platform, limit, sortBy, minCalls, ticker } = options;
    return get("/api/influencers", { platform, limit, sortBy, minCalls, ticker });
}

/** Detect anomalies in news flow */
export async function getAnomalies(options = {}) {
    const { hours = 24, severity } = options;
    return get("/api/analytics/anomalies", { hours, severity });
}

/** Track headline changes */
export async function getHeadlineTracking(options = {}) {
    const { hours = 24, changesOnly } = options;
    return get("/api/analytics/headlines", { hours, changesOnly });
}

/** Get source credibility scores */
export async function getCredibilityScores(options = {}) {
    const { source, sortBy } = options;
    return get("/api/analytics/credibility", { source, sortBy });
}

/** Causal analysis */
export async function getCausality(options = {}) {
    const { eventId, type, asset, limit } = options;
    return get("/api/analytics/causality", { eventId, type, asset, limit });
}

// =============================================================================
// 📱 SOCIAL INTELLIGENCE APIs
// =============================================================================

/** Get aggregated social sentiment */
export async function getSocialSentiment(options = {}) {
    const { asset, platforms } = options;
    return get("/api/social", { asset, platforms });
}

/** Get Twitter/X sentiment */
export async function getTwitterSentiment(options = {}) {
    const { query, accounts } = options;
    return get("/api/social/x/sentiment", { query, accounts });
}

/** Monitor Discord/Telegram */
export async function getSocialMonitor(options = {}) {
    const { platform, hours, sentiment } = options;
    return get("/api/social/monitor", { platform, hours, sentiment });
}

/** Get influencer reliability scores */
export async function getInfluencerScores(options = {}) {
    const { username, platform, limit, sort } = options;
    return get("/api/social/influencer-score", { username, platform, limit, sort });
}

// =============================================================================
// 💎 PREMIUM ENDPOINTS
// =============================================================================

/** Get premium subscription status */
export async function getPremiumStatus() {
    return get("/api/premium");
}

/** Get advanced AI signals (premium) */
export async function getPremiumSignals(options = {}) {
    const { assets, strategy, backtest } = options;
    return get("/api/premium/ai/signals", { assets, strategy, backtest });
}

/** Get whale transactions (premium) */
export async function getPremiumWhales(options = {}) {
    const { minValue, assets, realtime } = options;
    return get("/api/premium/whales/transactions", { minValue, assets, realtime });
}

/** Advanced token screener (premium) */
export async function getPremiumScreener(options = {}) {
    const { filters, sort, limit } = options;
    return get("/api/premium/screener/advanced", { filters, sort, limit });
}

/** Smart money wallet tracking (premium) */
export async function getSmartMoney() {
    return get("/api/premium/smart-money");
}

// =============================================================================
// 👤 USER FEATURES
// =============================================================================

/** Create an alert */
export async function createAlert(alert) {
    return post("/api/alerts", alert);
}

/** List alerts */
export async function listAlerts(userId) {
    return get("/api/alerts", { userId });
}

/** Get alert by ID */
export async function getAlert(id) {
    return get(`/api/alerts/${id}`);
}

/** Update alert */
export async function updateAlert(id, updates) {
    const response = await fetch(`${BASE_URL}/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    });
    return response.json();
}

/** Delete alert */
export async function deleteAlert(id) {
    const response = await fetch(`${BASE_URL}/api/alerts/${id}`, {
        method: "DELETE"
    });
    return response.json();
}

/** Register webhook */
export async function registerWebhook(options) {
    return post("/api/webhooks", options);
}

/** Test webhook */
export async function testWebhook(webhookId) {
    return post("/api/webhooks/test", { webhookId });
}

/** Get webhook queue status */
export async function getWebhookQueue() {
    return get("/api/webhooks/queue");
}

/** Subscribe to newsletter */
export async function subscribeNewsletter(email, options = {}) {
    const { frequency, categories } = options;
    return post("/api/newsletter", { action: "subscribe", email, frequency, categories });
}

// =============================================================================
// 💼 PORTFOLIO APIs
// =============================================================================

/** Create/update portfolio */
export async function updatePortfolio(options) {
    return post("/api/portfolio", options);
}

/** Get portfolio */
export async function getPortfolio(id) {
    return get("/api/portfolio", { id });
}

/** Get portfolio performance */
export async function getPortfolioPerformance() {
    return get("/api/portfolio/performance");
}

/** Get portfolio tax report */
export async function getPortfolioTax(options = {}) {
    const { year, jurisdiction } = options;
    return get("/api/portfolio/tax", { year, jurisdiction });
}

// =============================================================================
// 🗄️ ARCHIVE & EXPORT
// =============================================================================

/** Query historical archive */
export async function getArchive(options = {}) {
    const { date, start, end, source, ticker, search, limit, offset } = options;
    return get("/api/archive", { date, start, end, source, ticker, search, limit, offset });
}

/** Query archive with advanced filtering (v2 now redirects to main archive) */
export async function getArchiveV2(options = {}) {
    const { start_date, end_date, source, ticker, q, sentiment, tags, limit, offset, format, lang } = options;
    return get("/api/archive", { start_date, end_date, source, ticker, q, sentiment, tags, limit, offset, format, lang });
}

/** Get archive health status */
export async function getArchiveStatus() {
    return get("/api/archive/status");
}

/** Export data */
export async function exportData(options = {}) {
    const { type, format = "json", from, to } = options;
    return get("/api/export", { type, format, from, to });
}

/** List export jobs */
export async function listExports(options = {}) {
    const { schema, archives } = options;
    return get("/api/exports", { schema, archives });
}

/** Get export job status */
export async function getExportJob(id, download = false) {
    return get(`/api/exports/${id}`, { download });
}

// =============================================================================
// 📡 FEED FORMATS
// =============================================================================

/** Get RSS feed */
export async function getRSSFeed(options = {}) {
    const { feed, limit } = options;
    return get("/api/rss", { feed, limit });
}

/** Get Atom feed */
export async function getAtomFeed(options = {}) {
    const { feed, limit } = options;
    return get("/api/atom", { feed, limit });
}

/** Get OPML export */
export async function getOPML() {
    return get("/api/opml");
}

// =============================================================================
// 🏷️ TAGS & DISCOVERY
// =============================================================================

/** Get all tags */
export async function getTags(category) {
    return get("/api/tags", { category });
}

/** Get tag details with articles */
export async function getTagArticles(slug, limit) {
    return get(`/api/tags/${slug}`, { limit });
}

// =============================================================================
// 🔧 UTILITY ENDPOINTS
// =============================================================================

/** Health check */
export async function getHealth() {
    return get("/api/health");
}

/** Get API statistics */
export async function getStats() {
    return get("/api/stats");
}

/** Get cache status */
export async function getCacheStatus() {
    return get("/api/cache");
}

/** Clear cache */
export async function clearCache() {
    const response = await fetch(`${BASE_URL}/api/cache`, { method: "DELETE" });
    return response.json();
}

/** Get OpenAPI specification */
export async function getOpenAPISpec() {
    return get("/api/openapi.json");
}

// =============================================================================
// 📺 TRADINGVIEW UDF API
// =============================================================================

/** TradingView config */
export async function getTradingViewConfig() {
    return get("/api/tradingview", { action: "config" });
}

/** TradingView symbol search */
export async function searchTradingViewSymbols(query) {
    return get("/api/tradingview", { action: "search", query });
}

/** TradingView history */
export async function getTradingViewHistory(options) {
    const { symbol, from, to, resolution } = options;
    return get("/api/tradingview", { action: "history", symbol, from, to, resolution });
}

// =============================================================================
// 🏛️ DEFI APIs
// =============================================================================

/** Get DeFi protocol health */
export async function getProtocolHealth(options = {}) {
    const { protocol, chain } = options;
    return get("/api/defi/protocol-health", { protocol, chain });
}

/** Get on-chain events */
export async function getOnchainEvents(options = {}) {
    const { chain, type } = options;
    return get("/api/onchain/events", { chain, type });
}

// =============================================================================
// 📊 VIEWS & ANALYTICS TRACKING
// =============================================================================

/** Get article view counts */
export async function getViews(options = {}) {
    const { ids, limit, sort } = options;
    return get("/api/views", { ids, limit, sort });
}

/** Record article view */
export async function recordView(articleId) {
    return post("/api/views", { articleId });
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
    console.log("=".repeat(60));
    console.log("🚀 FREE CRYPTO NEWS API - JAVASCRIPT EXAMPLES");
    console.log("=".repeat(60));
    
    try {
        // 1. News
        console.log("\n📰 1. Latest News");
        const news = await getNews({ limit: 5 });
        news.articles?.slice(0, 3).forEach(a => console.log(`   - ${a.title.slice(0, 50)}...`));
        
        // 2. Bitcoin News
        console.log("\n₿ 2. Bitcoin News");
        const btc = await getBitcoinNews({ limit: 3 });
        (btc.articles || btc).slice(0, 3).forEach(a => console.log(`   - ${a.title.slice(0, 50)}...`));
        
        // 3. Trending
        console.log("\n🔥 3. Trending Topics");
        const trending = await getTrending(5);
        (trending.topics || trending).slice(0, 5).forEach(t => {
            console.log(`   - ${t.keyword || t}`);
        });
        
        // 4. Fear & Greed
        console.log("\n😨 4. Fear & Greed Index");
        const fg = await getFearGreed();
        console.log(`   Value: ${fg.value}/100 - ${fg.classification}`);
        
        // 5. Sentiment
        console.log("\n📊 5. Market Sentiment");
        const sentiment = await getSentiment({ limit: 20 });
        console.log(`   Overall: ${sentiment.market?.overall || 'N/A'}`);
        
        // 6. Whale Alerts
        console.log("\n🐋 6. Whale Alerts");
        const whales = await getWhaleAlerts({ minValue: 5000000 });
        (whales.alerts || []).slice(0, 3).forEach(w => {
            console.log(`   - ${w.asset}: $${(w.value || 0).toLocaleString()}`);
        });
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ All examples completed!");
        console.log("=".repeat(60));
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runExamples();
}

// Export for module usage
export default {
    getNews,
    getInternationalNews,
    extractArticle,
    getCategories,
    getBitcoinNews,
    getDefiNews,
    getBreakingNews,
    searchNews,
    getTrending,
    getSources,
    getDigest,
    getSentiment,
    summarizeArticle,
    askAI,
    aiRequest,
    getAIBrief,
    aiDebate,
    aiCounter,
    aiAgent,
    queryAIAgent,
    queryOracle,
    detectAIContent,
    getArbitrage,
    getSignals,
    getFundingRates,
    getOptionsFlow,
    getLiquidations,
    getWhaleAlerts,
    getOrderbook,
    getFearGreed,
    getCoins,
    getOHLC,
    getExchanges,
    getDerivatives,
    getMarketCategories,
    searchMarket,
    getNarratives,
    getEntities,
    getClaims,
    detectClickbait,
    getOrigins,
    getRelationships,
    getRegulatoryNews,
    getPredictions,
    submitPrediction,
    getInfluencers,
    getAnomalies,
    getHeadlineTracking,
    getCredibilityScores,
    getCausality,
    getSocialSentiment,
    getTwitterSentiment,
    getSocialMonitor,
    getInfluencerScores,
    getPremiumStatus,
    getPremiumSignals,
    getPremiumWhales,
    getPremiumScreener,
    getSmartMoney,
    createAlert,
    listAlerts,
    getAlert,
    updateAlert,
    deleteAlert,
    registerWebhook,
    testWebhook,
    getWebhookQueue,
    subscribeNewsletter,
    updatePortfolio,
    getPortfolio,
    getPortfolioPerformance,
    getPortfolioTax,
    getArchive,
    getArchiveV2,
    getArchiveStatus,
    exportData,
    listExports,
    getExportJob,
    getRSSFeed,
    getAtomFeed,
    getOPML,
    getTags,
    getTagArticles,
    getHealth,
    getStats,
    getCacheStatus,
    clearCache,
    getOpenAPISpec,
    getTradingViewConfig,
    searchTradingViewSymbols,
    getTradingViewHistory,
    getProtocolHealth,
    getOnchainEvents,
    getViews,
    recordView
};
