# Free Crypto News TypeScript SDK

100% FREE TypeScript SDK for the Free Crypto News API. No API keys required!

## Installation

```bash
npm install @nirholas/crypto-news
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
  OriginsResponse
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
| `getTrending(limit?, hours?)` | Trending topics |
| `getStats()` | API statistics |
| `analyze(limit?, topic?, sentiment?)` | Sentiment analysis |
| `getArchive(date?, query?, limit?)` | Historical archive |
| `getOrigins(query?, category?, limit?)` | Find original sources |
| `getRSSUrl(feed?)` | Get RSS feed URL |

## License

MIT
