# JavaScript SDK

Zero-dependency JavaScript SDK for Free Crypto News API. Works in Node.js and browsers!

## Installation

```bash
# Copy to your project
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/javascript/crypto-news.js
```

## Usage

### ES Modules (Node.js 18+ / Browsers)
```javascript
import { CryptoNews } from './crypto-news.js';

const client = new CryptoNews();
const articles = await client.getLatest(10);
```

### CommonJS (Node.js)
```javascript
const { CryptoNews } = require('./crypto-news.js');

const client = new CryptoNews();
client.getLatest(10).then(console.log);
```

## Available Methods

| Method | Description |
|--------|-------------|
| `getLatest(limit, source)` | Get latest news |
| `search(keywords, limit)` | Search by keywords |
| `getDefi(limit)` | DeFi news |
| `getBitcoin(limit)` | Bitcoin news |
| `getBreaking(limit)` | Breaking news (last 2 hours) |
| `getSources()` | List all sources |
| `getTrending(limit, hours)` | Trending topics |
| `getStats()` | API statistics |
| `getHealth()` | API health status |
| `analyze(limit, topic, sentiment)` | News with sentiment analysis |
| `getArchive(date, query, limit)` | Historical archive |
| `getOrigins(query, category, limit)` | Find original sources |

## Examples

### Get Latest News
```javascript
const client = new CryptoNews();
const articles = await client.getLatest(5);
articles.forEach(a => console.log(`${a.title} - ${a.source}`));
```

### Search News
```javascript
const results = await client.search('ethereum,ETF', 10);
```

### Trending Topics
```javascript
const trending = await client.getTrending(10, 24);
trending.trending.forEach(t => {
  console.log(`${t.topic}: ${t.count} mentions (${t.sentiment})`);
});
```

### Get DeFi News
```javascript
const defi = await client.getDefi(10);
```

### Analyze Sentiment
```javascript
const analysis = await client.analyze(20, 'bitcoin', 'bullish');
console.log(`Market: ${analysis.summary.overall_sentiment}`);
```

### Historical Archive
```javascript
const archive = await client.getArchive('2024-01-15', 'SEC', 20);
```

### Find Original Sources
```javascript
const origins = await client.getOrigins('binance', 'exchange', 10);
```

## Browser Usage

```html
<script type="module">
  import { CryptoNews } from './crypto-news.js';
  
  const client = new CryptoNews();
  const news = await client.getLatest(5);
  
  document.getElementById('news').innerHTML = news
    .map(a => `<div><a href="${a.link}">${a.title}</a></div>`)
    .join('');
</script>
```

## No API Key Required!

100% free - just import and use!
