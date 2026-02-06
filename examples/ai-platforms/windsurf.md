# Windsurf Integration Guide

Complete guide for using Free Crypto News with Windsurf IDE (by Codeium).

## What is Windsurf?

[Windsurf](https://codeium.com/windsurf) is an AI-native IDE by Codeium with Cascade (agentic AI) for autonomous coding tasks and deep codebase understanding.

---

## Integration Methods

| Method | Difficulty | Features | Best For |
|--------|------------|----------|----------|
| Cascade | ⭐⭐ Medium | Agentic tasks | Building features |
| MCP Server | ⭐⭐ Medium | Tool access | Real-time data |
| Memories | ⭐ Easy | Persistent context | API reference |
| Rules | ⭐ Easy | System prompts | Behavior |

---

## Method 1: MCP Server (Recommended)

### Step 1: Configure MCP

Open Windsurf Settings → **MCP Configuration**

Or edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/path/to/free-crypto-news/mcp/index.js"],
      "env": {
        "API_BASE_URL": "https://cryptocurrency.cv"
      }
    }
  }
}
```

**Using HTTP/SSE Transport:**

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://plugins.support/sse",
      "transport": "sse"
    }
  }
}
```

### Step 2: Restart Windsurf

Restart to load the MCP server.

### Step 3: Use in Chat

The MCP tools are now available:

```
Use the crypto-news MCP tools to get Bitcoin sentiment analysis
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_news` | Fetch latest cryptocurrency news |
| `search_news` | Search articles by keywords |
| `get_sentiment` | AI sentiment for assets |
| `get_fear_greed` | Fear & Greed Index |
| `get_trending` | Trending topics |
| `get_coins` | Cryptocurrency prices |
| `get_breaking` | Breaking news alerts |
| `get_whale_alerts` | Large transactions |
| `get_arbitrage` | Cross-exchange opportunities |
| `get_gas_prices` | Ethereum gas prices |

---

## Method 2: Memories (Persistent Context)

### Step 1: Create a Memory

In Windsurf Chat, type:

```
@memories add crypto-api:
Free Crypto News API Reference
Base URL: https://cryptocurrency.cv
No API key required

Endpoints:
- GET /api/news?limit=10 - Latest news
- GET /api/search?q={query} - Search
- GET /api/ai/sentiment?asset={symbol} - Sentiment
- GET /api/market/fear-greed - Fear & Greed
- GET /api/trending - Trending topics
- GET /api/coins?limit=100 - Prices
- GET /api/breaking - Breaking news
- GET /api/trading/whales - Whale alerts
- GET /api/trading/arbitrage - Arbitrage
- GET /api/blockchain/gas - Gas prices

Response format: JSON with articles array
Categories: bitcoin, ethereum, defi, nft, regulation
```

### Step 2: Reference in Chat

```
@memories crypto-api - Write a TypeScript function to fetch breaking news
```

---

## Method 3: Cascade (Agentic Mode)

Cascade can autonomously build complete features using the API.

### Example: Build Complete Feature

**User:**
```
Use Cascade to build a cryptocurrency news dashboard component:
- Fetch news from https://cryptocurrency.cv/api/news
- Show Fear & Greed from /api/market/fear-greed
- Display trending topics from /api/trending
- Use React with TypeScript
- Add Tailwind styling
- Include auto-refresh every 60 seconds
- Handle loading and error states
```

**Cascade will:**
1. Create component files
2. Add API fetch logic
3. Implement UI with Tailwind
4. Add error handling
5. Set up auto-refresh
6. Run and test the code

---

## Method 4: Rules for AI

### Step 1: Access Rules

Go to **Settings** → **AI** → **Rules**

### Step 2: Add Crypto Rules

```
## Cryptocurrency Development Rules

When working with crypto data:
1. Use Free Crypto News API: https://cryptocurrency.cv
2. No API key required for public endpoints
3. Rate limit: 100 requests/minute
4. Always handle network errors
5. Parse ISO 8601 dates properly
6. Include TypeScript types

Key endpoints:
- /api/news - Latest news
- /api/search?q={query} - Search
- /api/ai/sentiment?asset={symbol} - Sentiment
- /api/market/fear-greed - Index
- /api/coins - Prices

Always:
- Use fetch() with timeout
- Add proper error boundaries
- Show loading states
- Cache responses when appropriate
```

---

## Complete Example: Crypto Trading Assistant

**User to Cascade:**

```
Build a complete crypto trading assistant with these features:
1. Market dashboard with prices and Fear & Greed
2. News feed with search
3. Sentiment analysis panel
4. Whale alert notifications
5. Arbitrage opportunity finder

Use:
- React + TypeScript
- Tailwind CSS
- Free Crypto News API (https://cryptocurrency.cv)
- React Query for data fetching
- Toast notifications for alerts
```

**Cascade builds:**

```tsx
// lib/api.ts
const API_BASE = 'https://cryptocurrency.cv';

export async function fetchWithTimeout<T>(
  url: string, 
  timeout = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  getNews: (limit = 20) => 
    fetchWithTimeout(`${API_BASE}/api/news?limit=${limit}`),
  
  searchNews: (query: string, limit = 20) =>
    fetchWithTimeout(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  
  getSentiment: (asset: string) =>
    fetchWithTimeout(`${API_BASE}/api/ai/sentiment?asset=${asset}`),
  
  getFearGreed: () =>
    fetchWithTimeout(`${API_BASE}/api/market/fear-greed`),
  
  getTrending: () =>
    fetchWithTimeout(`${API_BASE}/api/trending`),
  
  getCoins: (limit = 100) =>
    fetchWithTimeout(`${API_BASE}/api/coins?limit=${limit}`),
  
  getWhaleAlerts: (minValue = 1000000) =>
    fetchWithTimeout(`${API_BASE}/api/trading/whales?minValue=${minValue}`),
  
  getArbitrage: () =>
    fetchWithTimeout(`${API_BASE}/api/trading/arbitrage`),
  
  getGas: () =>
    fetchWithTimeout(`${API_BASE}/api/blockchain/gas`),
};
```

```tsx
// components/TradingDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FearGreedGauge } from './FearGreedGauge';
import { PriceTable } from './PriceTable';
import { NewsFeed } from './NewsFeed';
import { SentimentPanel } from './SentimentPanel';
import { WhaleAlerts } from './WhaleAlerts';
import { ArbitragePanel } from './ArbitragePanel';

export function TradingDashboard() {
  const { data: fearGreed, isLoading: fgLoading } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: api.getFearGreed,
    refetchInterval: 60000,
  });

  const { data: coins, isLoading: coinsLoading } = useQuery({
    queryKey: ['coins'],
    queryFn: () => api.getCoins(20),
    refetchInterval: 30000,
  });

  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(10),
    refetchInterval: 60000,
  });

  const { data: whales } = useQuery({
    queryKey: ['whales'],
    queryFn: () => api.getWhaleAlerts(5000000),
    refetchInterval: 30000,
  });

  const { data: arbitrage } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: api.getArbitrage,
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Crypto Trading Assistant</h1>
        <p className="text-gray-400">Real-time market intelligence</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Market Overview */}
        <div className="col-span-4 space-y-6">
          <FearGreedGauge data={fearGreed} loading={fgLoading} />
          <PriceTable coins={coins?.coins} loading={coinsLoading} />
        </div>

        {/* Center Column - News & Sentiment */}
        <div className="col-span-5 space-y-6">
          <NewsFeed articles={news?.articles} />
          <SentimentPanel />
        </div>

        {/* Right Column - Alerts & Opportunities */}
        <div className="col-span-3 space-y-6">
          <WhaleAlerts alerts={whales?.alerts} />
          <ArbitragePanel opportunities={arbitrage?.opportunities} />
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/SentimentPanel.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];

export function SentimentPanel() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');

  const { data: sentiment, isLoading, error } = useQuery({
    queryKey: ['sentiment', selectedAsset],
    queryFn: () => api.getSentiment(selectedAsset),
    refetchInterval: 60000,
  });

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentEmoji = (score: number) => {
    if (score > 0.5) return '🚀';
    if (score > 0.2) return '📈';
    if (score < -0.5) return '📉';
    if (score < -0.2) return '😰';
    return '😐';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">AI Sentiment Analysis</h2>

      {/* Asset Selector */}
      <div className="flex gap-2 mb-6">
        {ASSETS.map((asset) => (
          <button
            key={asset}
            onClick={() => setSelectedAsset(asset)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedAsset === asset
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {/* Sentiment Display */}
      {isLoading ? (
        <div className="animate-pulse h-24 bg-gray-700 rounded" />
      ) : error ? (
        <div className="text-red-400">Failed to load sentiment</div>
      ) : sentiment ? (
        <div className="text-center">
          <div className="text-6xl mb-4">
            {getSentimentEmoji(sentiment.score)}
          </div>
          <div className={`text-4xl font-bold ${getSentimentColor(sentiment.score)}`}>
            {sentiment.label?.toUpperCase()}
          </div>
          <div className="text-2xl mt-2">
            Score: {sentiment.score?.toFixed(2)}
          </div>
          <div className="text-gray-400 mt-1">
            Confidence: {(sentiment.confidence * 100).toFixed(0)}%
          </div>
          
          {/* Sentiment Meter */}
          <div className="mt-6 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
            <div 
              className="absolute w-4 h-4 bg-white rounded-full border-2 border-gray-900 -top-0 transform -translate-x-1/2"
              style={{ left: `${((sentiment.score + 1) / 2) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Chat | `Cmd/Ctrl + L` |
| Start Cascade | `Cmd/Ctrl + I` |
| Command Palette | `Cmd/Ctrl + Shift + P` |
| Memories | `@memories` |
| Accept suggestion | `Tab` |

---

## Troubleshooting

### MCP Server Issues

1. Check the path in mcp_config.json
2. Verify Node.js is installed
3. Test manually: `node /path/to/mcp/index.js`
4. Check Windsurf Developer Console

### Cascade Not Using API

1. Add the API to Memories
2. Be explicit: "Use https://cryptocurrency.cv"
3. Provide endpoint details in the prompt

### Slow Performance

1. Limit refetch intervals
2. Use React Query caching
3. Paginate large responses

---

## Links

- **Windsurf:** https://codeium.com/windsurf
- **Codeium Docs:** https://docs.codeium.com
- **Windsurf Discord:** https://discord.gg/codeium
- **Free Crypto News API:** https://cryptocurrency.cv
