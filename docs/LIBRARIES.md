# 📚 Library Modules Documentation

Documentation for the core library modules in Free Crypto News.

**Location:** `src/lib/`

---

## Table of Contents

- [News & Content](#news-content)
  - [crypto-news.ts](#crypto-newsts)
  - [international-sources.ts](#international-sourcests)
  - [x-scraper.ts](#x-scraperts)
- [Trading & Market Data](#trading-market-data)
  - [arbitrage-scanner.ts](#arbitrage-scannerts)
  - [funding-rates.ts](#funding-ratests)
  - [options-flow.ts](#options-flowts)
  - [order-book.ts](#order-bookts)
  - [derivatives.ts](#derivativests)
- [AI & Analysis](#ai-analysis)
  - [alpha-signal-engine.ts](#alpha-signal-enginets)
  - [ai-enhanced.ts](#ai-enhancedts)
  - [ai-market-agent.ts](#ai-market-agentts)
  - [claim-extractor.ts](#claim-extractorts)
  - [anomaly-detector.ts](#anomaly-detectorts)
  - [causal-inference.ts](#causal-inferencets)
- [Social & Sentiment](#social-sentiment)
  - [social-intelligence.ts](#social-intelligencets)
  - [influencer-tracker.ts](#influencer-trackerts)
- [Research & Analytics](#research-analytics)
  - [regulatory-intelligence.ts](#regulatory-intelligencets)
  - [academic-access.ts](#academic-accessts)
  - [citation-network.ts](#citation-networkts)
  - [coverage-gap.ts](#coverage-gapts)
  - [predictions.ts](#predictionsts)
- [Blockchain & On-Chain](#blockchain-on-chain)
  - [bitcoin-onchain.ts](#bitcoin-onchaints)
  - [protocol-health.ts](#protocol-healthts)
- [Infrastructure](#infrastructure)
  - [cache.ts](#cachets)
  - [rate-limit.ts](#rate-limitts)
  - [webhooks.ts](#webhooksts)
  - [x402.ts](#x402ts)

---

## News & Content

### crypto-news.ts

Core RSS news aggregation from 120+ sources across 21 categories.

```typescript
import { getLatestNews, getAllSources, CATEGORIES } from '@/lib/crypto-news';
```

#### Functions

##### `getLatestNews(options?)`

Fetch aggregated news from all configured RSS sources.

```typescript
const news = await getLatestNews({
  limit: 20,
  source: 'coindesk',      // Filter by source
  category: 'defi',        // Filter by category
  search: 'ethereum',      // Search in title/description
  lang: 'en',              // Language filter
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | number | 10 | Max articles to return |
| `source` | string | - | Filter by source key |
| `category` | string | - | Filter by category |
| `search` | string | - | Search query |
| `lang` | string | 'en' | Language code |
| `from` | Date | - | Start date filter |
| `to` | Date | - | End date filter |

**Returns:**

```typescript
interface NewsResult {
  articles: Article[];
  totalCount: number;
  sources: string[];
  fetchedAt: Date;
}

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
}
```

##### `getAllSources()`

Get list of all news sources with metadata.

```typescript
const sources = getAllSources();
// Returns: Array<{ name, key, url, category, region }>
```

##### `CATEGORIES`

Available news categories:

```typescript
const CATEGORIES = [
  'general', 'bitcoin', 'defi', 'nft', 'research', 
  'institutional', 'etf', 'derivatives', 'onchain',
  'fintech', 'macro', 'quant', 'journalism', 'ethereum',
  'asia', 'tradfi', 'mainstream', 'mining', 'gaming',
  'altl1', 'stablecoin'
];
```

---

### international-sources.ts

Multi-language news aggregation with translation support.

```typescript
import { 
  getInternationalNews, 
  translateArticle,
  SUPPORTED_LANGUAGES 
} from '@/lib/international-sources';
```

#### Functions

##### `getInternationalNews(options)`

```typescript
const news = await getInternationalNews({
  language: 'ko',           // ko, zh, ja, es
  region: 'asia',           // asia, latam
  translate: true,          // Translate to English
  limit: 20,
});
```

##### `translateArticle(article, targetLang)`

```typescript
const translated = await translateArticle(article, 'en');
// Returns article with titleEnglish, descriptionEnglish
```

---

### x-scraper.ts

X (Twitter) sentiment analysis via Nitter RSS (no API key required).

```typescript
import { 
  scrapeXSentiment,
  getAccountTweets,
  searchTweets 
} from '@/lib/x-scraper';
```

#### Functions

##### `scrapeXSentiment(query)`

Scrape X for sentiment on a topic.

```typescript
const sentiment = await scrapeXSentiment('bitcoin');

// Returns:
{
  query: 'bitcoin',
  sentiment: {
    overall: 0.68,
    bullish: 0.45,
    bearish: 0.12,
    neutral: 0.43
  },
  volume: 15000,
  trending: true,
  topTweets: [...],
  scrapedAt: Date
}
```

##### `getAccountTweets(accounts)`

Get tweets from specific accounts.

```typescript
const tweets = await getAccountTweets([
  'saborlarckham',
  'caboroletti',
  'wikicrpito',
]);
```

#### Configuration

Uses in-memory cache fallback when Vercel KV is not configured:

```typescript
// Environment variables (optional)
KV_URL=redis://...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

---

## Trading & Market Data

### arbitrage-scanner.ts

Cross-exchange arbitrage opportunity detection.

```typescript
import { 
  scanArbitrage,
  getHistoricalSpreads,
  calculateFees 
} from '@/lib/arbitrage-scanner';
```

#### Functions

##### `scanArbitrage(options)`

```typescript
const opportunities = await scanArbitrage({
  pairs: ['BTC/USDT', 'ETH/USDT'],
  exchanges: ['binance', 'coinbase', 'kraken'],
  minSpread: 0.5,
  includeFees: true,
});

// Returns:
{
  opportunities: [
    {
      pair: 'BTC/USDT',
      buyExchange: 'Binance',
      sellExchange: 'Coinbase',
      buyPrice: 98500,
      sellPrice: 99200,
      spreadPercent: 0.71,
      netProfit: 650,  // After fees
      volume24h: 15000000
    }
  ],
  scanTime: '145ms'
}
```

---

### funding-rates.ts

Perpetual futures funding rate aggregation.

```typescript
import { 
  getFundingRates,
  getHistoricalFunding,
  predictFunding 
} from '@/lib/funding-rates';
```

#### Functions

##### `getFundingRates(symbol?)`

```typescript
const rates = await getFundingRates('BTCUSDT');

// Returns:
{
  rates: [
    { exchange: 'Binance', rate: 0.0012, nextFunding: Date },
    { exchange: 'Bybit', rate: 0.0015, nextFunding: Date },
    { exchange: 'OKX', rate: 0.0010, nextFunding: Date }
  ],
  average: 0.00123,
  sentiment: 'bullish'
}
```

---

### options-flow.ts

Options flow data from Deribit, OKX, and Bybit.

```typescript
import { 
  getOptionsFlow,
  getMaxPain,
  getImpliedVolatility 
} from '@/lib/options-flow';
```

#### Functions

##### `getOptionsFlow(options)`

```typescript
const flow = await getOptionsFlow({
  asset: 'BTC',
  exchange: 'deribit',
  type: 'call',        // call, put, all
  minPremium: 10000,
});

// Returns:
{
  flows: [...],
  putCallRatio: 0.65,
  maxPain: 95000,
  totalVolume: 125000000,
  impliedVol: 65.5
}
```

---

### order-book.ts

Aggregated order book depth across exchanges.

```typescript
import { 
  getAggregatedOrderbook,
  getOrderbookImbalance,
  streamOrderbook 
} from '@/lib/order-book';
```

#### Functions

##### `getAggregatedOrderbook(symbol, depth?)`

```typescript
const orderbook = await getAggregatedOrderbook('BTCUSDT', 20);

// Returns:
{
  bids: [{ price, quantity, exchanges: [] }],
  asks: [{ price, quantity, exchanges: [] }],
  spread: 0.05,
  imbalance: 0.12,   // Positive = more bids
  midPrice: 98525
}
```

---

### derivatives.ts

Derivatives market overview including futures and options.

```typescript
import { 
  getDerivativesOverview,
  getOpenInterest,
  getLiquidations 
} from '@/lib/derivatives';
```

---

## AI & Analysis

### alpha-signal-engine.ts

AI-powered trading signal generation.

```typescript
import { 
  generateSignals,
  analyzeNarratives,
  getLeaderboard 
} from '@/lib/alpha-signal-engine';
```

#### Functions

##### `generateSignals(options)`

```typescript
const signals = await generateSignals({
  assets: ['BTC', 'ETH'],
  sources: ['sentiment', 'technical', 'onchain'],
  minConfidence: 0.7,
});

// Returns:
{
  signals: [
    {
      asset: 'BTC',
      type: 'buy',
      confidence: 0.82,
      reasoning: 'Strong sentiment + accumulation pattern',
      priceTarget: 105000,
      stopLoss: 94000,
      timeHorizon: '4h'
    }
  ]
}
```

##### `analyzeNarratives(period)`

```typescript
const narratives = await analyzeNarratives('24h');

// Returns emerging narrative clusters
{
  narratives: [
    {
      title: 'ETF Institutional Adoption',
      sentiment: 'bullish',
      strength: 0.89,
      articleCount: 45,
      tickers: ['BTC', 'GBTC']
    }
  ]
}
```

---

### ai-enhanced.ts

Enhanced AI analysis pipeline for articles.

```typescript
import { 
  analyzeArticle,
  extractFacts,
  detectBias 
} from '@/lib/ai-enhanced';
```

#### Functions

##### `analyzeArticle(article)`

```typescript
const analysis = await analyzeArticle({
  title: 'Bitcoin Hits New ATH',
  content: '...',
});

// Returns comprehensive analysis
{
  sentiment: 'bullish',
  confidence: 0.92,
  facts: [...],
  claims: [...],
  bias: 'neutral',
  readingLevel: 'intermediate',
  keyEntities: [...]
}
```

---

### ai-market-agent.ts

Autonomous AI agent for market analysis.

```typescript
import { 
  MarketAgent,
  createAgent 
} from '@/lib/ai-market-agent';
```

#### Usage

```typescript
const agent = createAgent({
  model: 'gpt-4',
  tools: ['news', 'prices', 'onchain'],
});

const analysis = await agent.analyze('What is driving BTC price today?');
```

---

### claim-extractor.ts

Extract and classify claims from articles.

```typescript
import { extractClaims } from '@/lib/claim-extractor';

const claims = await extractClaims(articleContent);

// Returns:
{
  claims: [
    {
      text: 'Bitcoin hash rate hit ATH',
      type: 'factual',
      verifiable: true,
      confidence: 0.95
    },
    {
      text: 'BTC will reach $200K',
      type: 'prediction',
      verifiable: false
    }
  ]
}
```

---

### anomaly-detector.ts

Detect anomalies in news patterns and market data.

```typescript
import { detectAnomalies } from '@/lib/anomaly-detector';

const anomalies = await detectAnomalies({
  type: 'news_volume',
  period: '24h',
  threshold: 2.0,  // Standard deviations
});
```

---

### causal-inference.ts

Analyze causal relationships between news and price movements.

```typescript
import { analyzeCausality } from '@/lib/causal-inference';

const causality = await analyzeCausality({
  event: 'ETF Approval',
  asset: 'BTC',
  window: '7d',
});

// Returns:
{
  priceImpact: 0.15,  // 15% price change
  confidence: 0.85,
  lag: '2h',          // Time lag to impact
  correlation: 0.78
}
```

---

## Social & Sentiment

### social-intelligence.ts

Aggregated social media monitoring.

```typescript
import { 
  getSocialSentiment,
  getViralContent,
  trackMentions 
} from '@/lib/social-intelligence';
```

#### Functions

##### `getSocialSentiment(asset)`

```typescript
const sentiment = await getSocialSentiment('BTC');

// Returns:
{
  overall: 0.72,
  platforms: {
    twitter: { sentiment: 0.75, volume: 125000 },
    discord: { sentiment: 0.68, messages: 45000 },
    telegram: { sentiment: 0.70, messages: 32000 },
    reddit: { sentiment: 0.65, posts: 1200 }
  },
  trending: true
}
```

---

### influencer-tracker.ts

Crypto influencer monitoring and accuracy tracking.

```typescript
import { 
  getInfluencers,
  trackPredictions,
  calculateAccuracy 
} from '@/lib/influencer-tracker';
```

#### Functions

##### `getInfluencers(options)`

```typescript
const influencers = await getInfluencers({
  platform: 'twitter',
  minFollowers: 100000,
  sortBy: 'accuracy',
});

// Returns influencer list with credibility scores
```

---

## Research & Analytics

### regulatory-intelligence.ts

Regulatory news tracking and analysis.

```typescript
import { 
  getRegulatoryUpdates,
  analyzeImpact,
  trackDeadlines 
} from '@/lib/regulatory-intelligence';
```

#### Functions

##### `getRegulatoryUpdates(options)`

```typescript
const updates = await getRegulatoryUpdates({
  jurisdiction: 'US',
  type: 'ruling',
  impactLevel: 'high',
});

// Returns:
{
  updates: [
    {
      title: 'SEC Approves Spot ETF',
      jurisdiction: 'US',
      regulator: 'SEC',
      impact: 'high',
      affectedAssets: ['BTC', 'ETH']
    }
  ],
  upcomingDeadlines: [...]
}
```

---

### academic-access.ts

Research data access for academics.

```typescript
import { 
  getAcademicAccess,
  validateResearcher,
  getDataExport 
} from '@/lib/academic-access';
```

#### Tiers

| Tier | Daily Limit | Features |
|------|-------------|----------|
| Basic | 1,000 | JSON export |
| Researcher | 10,000 | CSV, historical |
| Institution | 100,000 | Parquet, streaming |

---

### citation-network.ts

Build citation networks from research articles.

```typescript
import { 
  getCitations,
  getReferences,
  buildNetwork 
} from '@/lib/citation-network';
```

---

### coverage-gap.ts

Identify underreported topics in crypto news.

```typescript
import { analyzeCoverageGaps } from '@/lib/coverage-gap';

const gaps = await analyzeCoverageGaps();

// Returns:
{
  underreported: [
    { topic: 'L2 Security', gap: 0.80 }
  ],
  overreported: [
    { topic: 'Price Predictions', ratio: 3.5 }
  ]
}
```

---

### predictions.ts

Prediction tracking and leaderboard.

```typescript
import { 
  createPrediction,
  resolvePrediction,
  getLeaderboard 
} from '@/lib/predictions';
```

#### Functions

##### `createPrediction(prediction)`

```typescript
await createPrediction({
  asset: 'BTC',
  type: 'above',
  target: 150000,
  deadline: '2026-06-30',
  reasoning: 'ETF + halving',
});
```

---

## Blockchain & On-Chain

### bitcoin-onchain.ts

Bitcoin on-chain analytics.

```typescript
import { 
  getHashRate,
  getMinerFlows,
  getHodlerMetrics 
} from '@/lib/bitcoin-onchain';
```

---

### protocol-health.ts

DeFi protocol health monitoring.

```typescript
import { getProtocolHealth } from '@/lib/protocol-health';

const health = await getProtocolHealth('aave');

// Returns:
{
  name: 'Aave',
  chain: 'Ethereum',
  tvl: 12500000000,
  healthScore: 0.95,
  auditStatus: 'audited',
  risks: ['smart_contract', 'oracle']
}
```

---

## Infrastructure

### cache.ts

Caching utilities with in-memory fallback.

```typescript
import { 
  cacheGet,
  cacheSet,
  cacheDel,
  cacheSmembers 
} from '@/lib/cache';
```

#### Functions

```typescript
// Get cached value
const value = await cacheGet<Article>('article:123');

// Set with TTL (seconds)
await cacheSet('article:123', article, 300);

// Delete
await cacheDel('article:123');

// Set members (for lists)
const members = await cacheSmembers('sources');
```

Works with Vercel KV when configured, falls back to in-memory cache.

---

### rate-limit.ts

Rate limiting with sliding window.

```typescript
import { rateLimit, RateLimitError } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60000,    // 1 minute
  uniqueTokenPerInterval: 500,
});

try {
  await limiter.check(req, 100); // 100 requests/min limit
} catch (e) {
  if (e instanceof RateLimitError) {
    return new Response('Too many requests', { status: 429 });
  }
}
```

---

### webhooks.ts

Webhook delivery and management.

```typescript
import { 
  sendWebhook,
  validateWebhook,
  queueWebhook 
} from '@/lib/webhooks';
```

#### Functions

```typescript
await sendWebhook({
  url: 'https://example.com/webhook',
  event: 'breaking_news',
  payload: { article: {...} },
  secret: 'webhook_secret',
});
```

---

### x402.ts

X402 cryptocurrency payment protocol.

```typescript
import { 
  createPaymentRequest,
  verifyPayment,
  X402Middleware 
} from '@/lib/x402';
```

#### Usage

```typescript
// Create payment request
const payment = createPaymentRequest({
  amount: 100,           // satoshis
  currency: 'BTC',
  endpoint: '/api/premium/data',
});

// Middleware for protected routes
export const GET = X402Middleware(handler, {
  price: 100,
  currency: 'BTC',
});
```

---

## Best Practices

### Error Handling

All library functions throw typed errors:

```typescript
import { NewsError, RateLimitError, ApiError } from '@/lib/errors';

try {
  const news = await getLatestNews();
} catch (e) {
  if (e instanceof RateLimitError) {
    // Handle rate limit
  } else if (e instanceof NewsError) {
    // Handle news fetch error
  }
}
```

### Caching Strategy

Most functions implement caching:

```typescript
// Cache durations by endpoint type
const CACHE_DURATIONS = {
  news: 300,        // 5 minutes
  prices: 60,       // 1 minute
  sentiment: 600,   // 10 minutes
  research: 3600,   // 1 hour
};
```

### Testing

Libraries include test files:

```bash
npm run test -- src/lib/crypto-news.test.ts
npm run test -- src/lib/ai-enhanced.test.ts
```

---

## Related Documentation

- [API Reference](./API.md) - HTTP API endpoints
- [Hooks](./HOOKS.md) - React hooks
- [Components](./COMPONENTS.md) - React components
- [Architecture](./ARCHITECTURE.md) - System design
