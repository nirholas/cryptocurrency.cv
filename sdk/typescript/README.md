# Free Crypto News TypeScript SDK

Production-ready TypeScript SDK for the [Free Crypto News API](https://cryptocurrency.cv). No API keys required!

## Installation

```bash
npm install @nirholas/crypto-news
# or
yarn add @nirholas/crypto-news
# or
pnpm add @nirholas/crypto-news
```

## Usage

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// Get latest news
const articles = await client.getLatest(10);

// Search for specific topics
const ethNews = await client.search('ethereum, ETF');

// Get DeFi news
const defiNews = await client.getDefi(10);

// Get Bitcoin news
const btcNews = await client.getBitcoin(10);

// Get breaking news (last 2 hours)
const breaking = await client.getBreaking(5);

// Check API health
const health = await client.getHealth();
```

## Market Data

```typescript
// Cryptocurrency prices
const prices = await client.getPrices('bitcoin');

// Market overview
const market = await client.getMarket();

// Fear & Greed Index
const fearGreed = await client.getFearGreed();
console.log(`Fear & Greed: ${fearGreed.value} (${fearGreed.classification})`);

// Ethereum gas prices
const gas = await client.getGas();
```

## Analytics & Trends

```typescript
// Get trending topics
const trending = await client.getTrending(10, 24);
trending.trending.forEach(t => {
  console.log(`${t.topic}: ${t.count} mentions (${t.sentiment})`);
});

// Get API statistics
const stats = await client.getStats();

// Analyze news with sentiment
const analysis = await client.analyze(20, 'bitcoin', 'bullish');
console.log(`Market: ${analysis.summary.overall_sentiment}`);
```

## Historical & Sources

```typescript
// Get archived news
const archive = await client.getArchive('2024-01-15', 'SEC', 20);

// Find original sources
const origins = await client.getOrigins('binance', 'exchange', 10);
origins.items.forEach(item => {
  console.log(`${item.title} - Original: ${item.likely_original_source}`);
});
```

## Error Handling

```typescript
import {
  CryptoNews,
  CryptoNewsError,
  APIError,
  RateLimitError,
  NetworkError,
} from '@nirholas/crypto-news';

const client = new CryptoNews();

try {
  const news = await client.getLatest();
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfter}s`);
  } else if (err instanceof NetworkError) {
    console.log(`Network error: ${err.message}`);
  } else if (err instanceof APIError) {
    console.log(`API error (HTTP ${err.statusCode}): ${err.message}`);
  } else if (err instanceof CryptoNewsError) {
    console.log(`SDK error: ${err.message}`);
  }
}
```

Exception hierarchy:

```
CryptoNewsError          ← base, catch-all
├── NetworkError         ← connection failures, timeouts
└── APIError             ← non-2xx HTTP responses
    └── RateLimitError   ← HTTP 429
```

## Convenience Functions

```typescript
import { getCryptoNews, searchCryptoNews, getDefiNews } from '@nirholas/crypto-news';

const news = await getCryptoNews(10);
const results = await searchCryptoNews('bitcoin');
const defi = await getDefiNews(5);
```

## Types

All types are exported and fully documented:

```typescript
import type {
  NewsArticle,
  NewsResponse,
  SourceInfo,
  HealthStatus,
  SourceKey,
  TrendingResponse,
  StatsResponse,
  AnalyzeResponse,
  ArchiveResponse,
  OriginsResponse,
  PriceData,
  MarketOverview,
  FearGreedIndex,
  GasPrices,
  CoinSentimentResult,
  CryptoNewsOptions,
} from '@nirholas/crypto-news';
```

## Custom Configuration

```typescript
const client = new CryptoNews({
  baseUrl: 'https://your-self-hosted-instance.com',
  timeout: 60000, // 60 seconds
});
```

## API Reference

| Method | Description |
|--------|-------------|
| `getLatest(limit?, source?)` | Get latest news |
| `search(keywords, limit?)` | Search by keywords |
| `getDefi(limit?)` | DeFi-specific news |
| `getBitcoin(limit?)` | Bitcoin-specific news |
| `getBreaking(limit?)` | Breaking news (last 2h) |
| `getSources()` | List all sources |
| `getHealth()` | API health status |
| `getPrices(coin?)` | Cryptocurrency prices |
| `getMarket()` | Market overview |
| `getFearGreed()` | Fear & Greed Index |
| `getGas()` | Ethereum gas prices |
| `getTrending(limit?, hours?)` | Trending topics |
| `getStats()` | API statistics |
| `analyze(limit?, topic?, sentiment?)` | Sentiment analysis |
| `getArchive(date?, query?, limit?)` | Historical archive |
| `getOrigins(query?, category?, limit?)` | Find original sources |
| `getRSSUrl(feed?)` | Get RSS feed URL |
| `getCoinSentiment(coins?, limit?, ...)` | Per-coin sentiment with trade signals |

## Build

Both ESM and CJS outputs are produced via `tsup`:

```bash
npm run build
```

## License

MIT
