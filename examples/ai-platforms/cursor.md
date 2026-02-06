# Cursor AI Integration Guide

Complete guide for using Free Crypto News with Cursor AI IDE.

## What is Cursor?

[Cursor](https://cursor.sh) is an AI-powered code editor built on VS Code with advanced AI features including code generation, chat, and custom context.

---

## Integration Methods

| Method | Difficulty | Features | Best For |
|--------|------------|----------|----------|
| @Docs | ⭐ Easy | API reference | Quick lookups |
| MCP Server | ⭐⭐ Medium | Full API access | Real-time data |
| Notepads | ⭐ Easy | Reusable context | Frequent use |
| Rules for AI | ⭐ Easy | System prompts | Consistent behavior |

---

## Method 1: MCP Server (Recommended)

### Step 1: Install MCP Server

```bash
# Clone the repo
git clone https://github.com/BurtTheCoder/free-crypto-news.git
cd free-crypto-news/mcp

# Install dependencies
npm install
```

### Step 2: Configure Cursor

Open Cursor Settings → Features → **Model Context Protocol (MCP)**

Add the server configuration:

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

**Alternative: HTTP/SSE Mode**

For the hosted MCP server:

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

### Step 3: Verify Connection

In Cursor Chat, you should now see the crypto-news tools available. Try:

- "Use the crypto-news tools to get the latest Bitcoin news"
- "Search for Ethereum upgrade news"
- "What's the current sentiment for BTC?"

---

## Method 2: Add API Documentation (@Docs)

### Step 1: Add Custom Docs

1. Open **Settings** → **Features** → **Docs**
2. Click **"Add new doc"**
3. Enter: `https://cryptocurrency.cv/docs/api`
4. Name it: `Free Crypto News API`

### Step 2: Use in Chat

Reference the docs with `@Docs`:

```
@Free Crypto News API - How do I search for news articles?
```

```
@Free Crypto News API - Generate code to fetch sentiment analysis
```

---

## Method 3: Notepads (Reusable Context)

### Step 1: Create a Notepad

1. Open the Notepads panel
2. Click **"New Notepad"**
3. Name it: `Crypto API`

### Step 2: Add API Reference

```markdown
# Free Crypto News API Reference

Base URL: https://cryptocurrency.cv

## Authentication
No API key required for basic endpoints.

## Key Endpoints

### Get News
GET /api/news?limit=10&category=bitcoin

### Search Articles
GET /api/search?q=bitcoin+etf&limit=20

### AI Sentiment
GET /api/ai/sentiment?asset=BTC

### Fear & Greed Index
GET /api/market/fear-greed

### Trending Topics
GET /api/trending

### Cryptocurrency Prices
GET /api/coins?limit=100

### Breaking News
GET /api/breaking

### Whale Alerts
GET /api/trading/whales?minValue=1000000

### Arbitrage Opportunities
GET /api/trading/arbitrage

### Gas Prices
GET /api/blockchain/gas

## Example Response (News)
{
  "articles": [
    {
      "title": "...",
      "source": "coindesk",
      "publishedAt": "2025-01-01T12:00:00Z",
      "url": "https://...",
      "description": "..."
    }
  ],
  "totalCount": 100
}

## Categories
bitcoin, ethereum, altcoin, defi, nft, regulation, exchange, mining

## Sources
coindesk, theblock, decrypt, cointelegraph, bitcoinist
```

### Step 3: Reference in Chat

```
@Crypto API - Write a Python function to fetch the top 10 news articles
```

---

## Method 4: Rules for AI

### Step 1: Open Settings

Go to **Settings** → **General** → **Rules for AI**

### Step 2: Add Crypto Rules

Add this to your rules:

```
When working with cryptocurrency projects or data:
- Use the Free Crypto News API at https://cryptocurrency.cv
- No API key is required
- Main endpoints:
  - /api/news - Latest news
  - /api/search?q={query} - Search
  - /api/ai/sentiment?asset={symbol} - Sentiment
  - /api/market/fear-greed - Fear & Greed Index
  - /api/coins - Prices
- Always handle API errors gracefully
- Include rate limiting for production code
- Parse dates as ISO 8601 format
```

---

## Example: Build a Crypto Dashboard

### Chat with Cursor

**User:**
```
I want to build a React dashboard that shows:
1. Latest crypto news (5 articles)
2. Fear & Greed Index
3. Top 10 coin prices
4. Trending topics

Use the Free Crypto News API. @Crypto API
```

**Cursor generates:**

```tsx
// components/CryptoDashboard.tsx
import { useEffect, useState } from 'react';

const API_BASE = 'https://cryptocurrency.cv';

interface Article {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface Coin {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
}

interface FearGreed {
  value: number;
  classification: string;
}

interface Topic {
  name: string;
  mentions: number;
  sentiment: string;
}

export function CryptoDashboard() {
  const [news, setNews] = useState<Article[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [trending, setTrending] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsRes, fgRes, coinsRes, trendingRes] = await Promise.all([
          fetch(`${API_BASE}/api/news?limit=5`),
          fetch(`${API_BASE}/api/market/fear-greed`),
          fetch(`${API_BASE}/api/coins?limit=10`),
          fetch(`${API_BASE}/api/trending`)
        ]);

        const newsData = await newsRes.json();
        const fgData = await fgRes.json();
        const coinsData = await coinsRes.json();
        const trendingData = await trendingRes.json();

        setNews(newsData.articles || []);
        setFearGreed(fgData);
        setCoins(coinsData.coins || []);
        setTrending(trendingData.topics || []);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Fear & Greed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h2 className="text-xl font-bold mb-4">Fear & Greed Index</h2>
        <div className="text-center">
          <div className="text-5xl font-bold">{fearGreed?.value}</div>
          <div className="text-gray-500">{fearGreed?.classification}</div>
          <div className="mt-2 h-4 bg-gray-200 rounded-full">
            <div 
              className={`h-4 rounded-full ${
                (fearGreed?.value ?? 0) < 25 ? 'bg-red-500' :
                (fearGreed?.value ?? 0) < 45 ? 'bg-orange-500' :
                (fearGreed?.value ?? 0) < 55 ? 'bg-yellow-500' :
                (fearGreed?.value ?? 0) < 75 ? 'bg-lime-500' :
                'bg-green-500'
              }`}
              style={{ width: `${fearGreed?.value}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Coins */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h2 className="text-xl font-bold mb-4">Top Coins</h2>
        <div className="space-y-2">
          {coins.slice(0, 10).map((coin) => (
            <div key={coin.symbol} className="flex justify-between items-center">
              <span className="font-medium">{coin.symbol}</span>
              <span>${coin.price.toLocaleString()}</span>
              <span className={coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest News */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h2 className="text-xl font-bold mb-4">📰 Latest News</h2>
        <div className="space-y-4">
          {news.map((article, i) => (
            <a 
              key={i} 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
            >
              <div className="font-medium">{article.title}</div>
              <div className="text-sm text-gray-500">
                {article.source} • {new Date(article.publishedAt).toRelativeTime()}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h2 className="text-xl font-bold mb-4">🔥 Trending</h2>
        <div className="flex flex-wrap gap-2">
          {trending.slice(0, 10).map((topic) => (
            <span 
              key={topic.name}
              className={`px-3 py-1 rounded-full text-sm ${
                topic.sentiment === 'bullish' ? 'bg-green-100 text-green-800' :
                topic.sentiment === 'bearish' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {topic.name} ({topic.mentions})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Example: Python Trading Bot

**User:**
```
Write a Python script that monitors crypto sentiment and creates alerts.
Use the MCP tools to fetch real-time data.
```

**Cursor (with MCP) generates:**

```python
#!/usr/bin/env python3
"""
Crypto Sentiment Alert Bot
Monitors sentiment and creates alerts when thresholds are crossed.
"""

import requests
import time
from datetime import datetime
from typing import Optional

API_BASE = "https://cryptocurrency.cv"

# Alert thresholds
FEAR_GREED_LOW = 20    # Extreme fear
FEAR_GREED_HIGH = 80   # Extreme greed
SENTIMENT_THRESHOLD = 0.7  # Strong sentiment signal

class CryptoMonitor:
    def __init__(self, assets: list[str]):
        self.assets = assets
        self.alerts: list[dict] = []
    
    def fetch_fear_greed(self) -> dict:
        """Fetch Fear & Greed Index."""
        resp = requests.get(f"{API_BASE}/api/market/fear-greed", timeout=10)
        return resp.json()
    
    def fetch_sentiment(self, asset: str) -> dict:
        """Fetch sentiment for an asset."""
        resp = requests.get(
            f"{API_BASE}/api/ai/sentiment",
            params={"asset": asset},
            timeout=10
        )
        return resp.json()
    
    def fetch_breaking_news(self) -> list:
        """Fetch breaking news."""
        resp = requests.get(f"{API_BASE}/api/breaking", timeout=10)
        return resp.json().get("articles", [])
    
    def check_fear_greed_alert(self, data: dict) -> Optional[dict]:
        """Check if Fear & Greed Index triggers an alert."""
        value = data.get("value", 50)
        
        if value <= FEAR_GREED_LOW:
            return {
                "type": "fear_greed",
                "level": "extreme_fear",
                "value": value,
                "message": f"🔴 EXTREME FEAR: Index at {value}. Potential buying opportunity.",
                "timestamp": datetime.now().isoformat()
            }
        elif value >= FEAR_GREED_HIGH:
            return {
                "type": "fear_greed",
                "level": "extreme_greed",
                "value": value,
                "message": f"🟢 EXTREME GREED: Index at {value}. Market may be overheated.",
                "timestamp": datetime.now().isoformat()
            }
        return None
    
    def check_sentiment_alert(self, asset: str, data: dict) -> Optional[dict]:
        """Check if sentiment triggers an alert."""
        score = data.get("score", 0)
        confidence = data.get("confidence", 0)
        
        if abs(score) >= SENTIMENT_THRESHOLD and confidence >= 0.8:
            direction = "bullish" if score > 0 else "bearish"
            emoji = "🚀" if score > 0 else "📉"
            return {
                "type": "sentiment",
                "asset": asset,
                "direction": direction,
                "score": score,
                "confidence": confidence,
                "message": f"{emoji} {asset}: Strong {direction} sentiment ({score:.2f}) with {confidence:.0%} confidence",
                "timestamp": datetime.now().isoformat()
            }
        return None
    
    def run_check(self):
        """Run a single check cycle."""
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running checks...")
        
        # Check Fear & Greed
        try:
            fg_data = self.fetch_fear_greed()
            alert = self.check_fear_greed_alert(fg_data)
            if alert:
                self.handle_alert(alert)
            else:
                print(f"  Fear & Greed: {fg_data.get('value')} ({fg_data.get('classification')})")
        except Exception as e:
            print(f"  ⚠️ Fear & Greed check failed: {e}")
        
        # Check Sentiment for each asset
        for asset in self.assets:
            try:
                sent_data = self.fetch_sentiment(asset)
                alert = self.check_sentiment_alert(asset, sent_data)
                if alert:
                    self.handle_alert(alert)
                else:
                    label = sent_data.get('label', 'neutral')
                    score = sent_data.get('score', 0)
                    print(f"  {asset}: {label} ({score:.2f})")
            except Exception as e:
                print(f"  ⚠️ {asset} sentiment check failed: {e}")
        
        # Check Breaking News
        try:
            breaking = self.fetch_breaking_news()
            if breaking:
                print(f"  📰 {len(breaking)} breaking news items")
                for news in breaking[:3]:
                    print(f"     • {news.get('title', 'No title')[:60]}...")
        except Exception as e:
            print(f"  ⚠️ Breaking news check failed: {e}")
    
    def handle_alert(self, alert: dict):
        """Handle an alert (log, notify, etc.)."""
        self.alerts.append(alert)
        print(f"\n  🚨 ALERT: {alert['message']}\n")
        
        # TODO: Add notification integrations
        # self.send_telegram(alert)
        # self.send_discord(alert)
        # self.send_email(alert)
    
    def run(self, interval: int = 300):
        """Run continuous monitoring."""
        print(f"Starting crypto monitor for: {', '.join(self.assets)}")
        print(f"Check interval: {interval}s")
        print("-" * 50)
        
        while True:
            self.run_check()
            time.sleep(interval)


if __name__ == "__main__":
    # Monitor major assets
    monitor = CryptoMonitor(["BTC", "ETH", "SOL", "XRP"])
    
    # Run with 5-minute intervals
    monitor.run(interval=300)
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Chat | `Cmd/Ctrl + L` |
| Open Composer | `Cmd/Ctrl + I` |
| Add to context | `Cmd/Ctrl + Shift + L` |
| Reference docs | Type `@` |
| Toggle MCP | See Settings |

---

## Troubleshooting

### MCP Server Not Connecting

1. Check the path in configuration
2. Ensure Node.js is installed
3. Check Cursor logs: **Help** → **Toggle Developer Tools** → **Console**

### @Docs Not Finding Content

1. Re-index the documentation
2. Try more specific queries
3. Check if the URL is accessible

### Slow Responses

1. Use more specific queries
2. Reduce context with `@Crypto API` instead of `@Codebase`
3. Limit to specific files/functions

---

## Links

- **Cursor:** https://cursor.sh
- **Cursor Docs:** https://docs.cursor.com
- **MCP in Cursor:** https://docs.cursor.com/context/model-context-protocol
- **Free Crypto News API:** https://cryptocurrency.cv
