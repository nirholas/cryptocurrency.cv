# 🚀 Free Crypto News API - Examples & SDKs

Complete examples and SDK implementations for all 184 API endpoints across 5 programming languages + AI agent templates.

[![API Status](https://img.shields.io/badge/API-Live-brightgreen)](https://cryptocurrency.cv)
[![License](https://img.shields.io/badge/License-MIT-blue)](../LICENSE)
[![Tutorials](https://img.shields.io/badge/Tutorials-19%20Guides-purple)](../docs/tutorials/index.md)

## 🤖 NEW: AI Agent Templates

Production-ready AI agents built with LangChain — see **[agents/](agents/README.md)** for:

| Agent | Description | Quick Start |
|-------|-------------|-------------|
| 📈 [Trading Bot](agents/trading-bot.py) | AI-powered trading signals | `python trading-bot.py --coin btc` |
| 🔬 [Research Assistant](agents/research-assistant.py) | Deep crypto research | `python research-assistant.py` |
| 🚨 [Alert Bot](agents/alert-bot.py) | Real-time alerts | `python alert-bot.py --keywords "bitcoin"` |
| 📰 [Digest Bot](agents/digest-bot.py) | Daily/weekly digests | `python digest-bot.py --frequency daily` |
| 📊 [Sentiment Tracker](agents/sentiment-tracker.py) | Live sentiment dashboard | `python sentiment-tracker.py --coins btc,eth` |

## 📖 Looking for Tutorials?

Check out our **[Complete Tutorials](../docs/tutorials/index.md)** — 19 step-by-step guides covering 150+ endpoints with full working code in Python, JavaScript, TypeScript, and cURL.

## 📚 Available SDKs & Examples

| Language | Files | Functions | Status |
|----------|-------|-----------|--------|
| [Python](#python) | 12 files | 150+ | ✅ Complete |
| [JavaScript](#javascript) | 10 files | 120+ | ✅ Complete |
| [TypeScript](#typescript) | 1 SDK file | 80+ | ✅ Complete |
| [React](#react) | 5 files | 50+ | ✅ Complete |
| [Rust](#rust) | 5 files | 40+ | ✅ Complete |
| [Go](#go) | 1 client file | 60+ | ✅ Complete |
| [C# / .NET](#c--net) | 1 file | 30+ | ✅ **NEW** |
| [Swift](#swift) | 1 file | 30+ | ✅ **NEW** |
| [Kotlin](#kotlin) | 1 file | 30+ | ✅ **NEW** |
| [cURL](#curl) | 1 script | 100+ | ✅ Complete |
| [AI Agents](agents/) | 5 agents | LangChain | ✅ Complete |

---

## 🐍 Python

### Installation

```bash
cd examples/python
pip install -r requirements.txt
```

### Quick Start

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Get latest crypto news
response = requests.get(f"{BASE_URL}/api/news", params={"limit": 10})
news = response.json()

for article in news["data"]:
    print(f"📰 {article['title']}")

# Get Bitcoin sentiment
response = requests.get(f"{BASE_URL}/api/ai/sentiment", params={"asset": "BTC"})
sentiment = response.json()
print(f"🎯 BTC Sentiment: {sentiment['label']} ({sentiment['score']:.2f})")

# Get Fear & Greed Index
response = requests.get(f"{BASE_URL}/api/market/fear-greed")
fg = response.json()
print(f"😰 Fear & Greed: {fg['value']} - {fg['classification']}")
```

### Example Files

| File | Description | Functions |
|------|-------------|-----------|
| [news.py](python/news.py) | News feeds, search, categories | 13 |
| [ai.py](python/ai.py) | Sentiment, summarization, NLP | 20 |
| [market.py](python/market.py) | Coins, OHLC, exchanges | 16 |
| [trading.py](python/trading.py) | Arbitrage, signals, funding | 10 |
| [social.py](python/social.py) | Twitter, Reddit, Discord | 15 |
| [blockchain.py](python/blockchain.py) | DeFi, NFT, on-chain | 17 |
| [regulatory.py](python/regulatory.py) | ETF, SEC, regulations | 14 |
| [analytics.py](python/analytics.py) | Trends, correlations | 15 |
| [feeds.py](python/feeds.py) | RSS, exports, webhooks | 13 |
| [portfolio.py](python/portfolio.py) | Alerts, watchlists | 15 |
| [premium.py](python/premium.py) | Premium tier features | 12 |

---

## 🟨 JavaScript

### Installation

```bash
cd examples/javascript
npm install
```

### Quick Start

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Get latest crypto news
const newsResponse = await fetch(`${BASE_URL}/api/news?limit=10`);
const news = await newsResponse.json();

news.data.forEach(article => {
  console.log(`📰 ${article.title}`);
});

// Get Bitcoin sentiment
const sentimentResponse = await fetch(`${BASE_URL}/api/ai/sentiment?asset=BTC`);
const sentiment = await sentimentResponse.json();
console.log(`🎯 BTC Sentiment: ${sentiment.label}`);

// Stream real-time news
const eventSource = new EventSource(`${BASE_URL}/api/stream`);
eventSource.onmessage = (event) => {
  const article = JSON.parse(event.data);
  console.log(`🆕 Breaking: ${article.title}`);
};
```

### Example Files

| File | Description | Functions |
|------|-------------|-----------|
| [news.js](javascript/news.js) | News feeds, search | 12 |
| [ai.js](javascript/ai.js) | AI/ML endpoints | 15 |
| [market.js](javascript/market.js) | Market data | 12 |
| [trading.js](javascript/trading.js) | Trading features | 10 |
| [social.js](javascript/social.js) | Social media feeds | 16 |
| [blockchain.js](javascript/blockchain.js) | On-chain data | 18 |
| [regulatory.js](javascript/regulatory.js) | Regulatory news | 15 |
| [analytics.js](javascript/analytics.js) | Analytics | 14 |
| [feeds.js](javascript/feeds.js) | RSS, exports | 13 |
| [portfolio.js](javascript/portfolio.js) | User features | 15 |
| [streaming.js](javascript/streaming.js) | Real-time streams | 6 |

---

## 📘 TypeScript

### Installation

```bash
cd examples/typescript
npm install
npm run build
```

### Quick Start

```typescript
import CryptoNewsClient from './sdk';

// Initialize client
const client = new CryptoNewsClient({
  apiKey: 'your-api-key', // Optional for public endpoints
});

// Get latest news with full type safety
const news = await client.getNews({ limit: 10 });
news.data.forEach(article => {
  console.log(`📰 ${article.title}`);
});

// Get Fear & Greed Index
const fearGreed = await client.getFearGreed();
console.log(`😰 ${fearGreed.data.classification}: ${fearGreed.data.value}`);
```

---

## ⚛️ React

### Installation

```bash
npm install @nirholas/react-crypto-news
```

### Quick Start

```tsx
import { CryptoNews, useCryptoNews } from '@nirholas/react-crypto-news';

// Drop-in component
function NewsFeed() {
  return <CryptoNews limit={10} variant="cards" showSource />;
}

// Custom hook for full control
function CustomFeed() {
  const { articles, loading, error, refresh } = useCryptoNews({ limit: 10 });
  
  if (loading) return <div>Loading...</div>;
  return articles.map(a => <div key={a.id}>{a.title}</div>);
}
```

### Example Files

| File | Description | Components |
|------|-------------|------------|
| [basic.tsx](react/basic.tsx) | News feeds, trending, themes | 12 |
| [market-data.tsx](react/market-data.tsx) | Prices, charts, Fear & Greed | 10 |
| [trading.tsx](react/trading.tsx) | Signals, whale alerts, orderbook | 8 |
| [streaming.tsx](react/streaming.tsx) | Live WebSocket feeds | 6 |
| [portfolio.tsx](react/portfolio.tsx) | Portfolio, watchlist, alerts | 8 |

### Available Hooks

| Hook | Description |
|------|-------------|
| `useCryptoNews` | Fetch news articles |
| `useTrendingTopics` | Get trending tickers |
| `usePrices` | Current prices |
| `useMarketData` | Market cap, volume |
| `useFearGreed` | Fear & Greed Index |
| `useSignals` | Trading signals |
| `useWhaleAlerts` | Large transactions |
| `useOrderbook` | Order book depth |
| `usePortfolio` | Portfolio valuation |
| `useNewsStream` | Real-time news WebSocket |
| `usePriceStream` | Real-time price WebSocket |

---

## 🦀 Rust

### Installation

Add to `Cargo.toml`:
```toml
[dependencies]
fcn-sdk = "0.2"
tokio = { version = "1", features = ["full"] }
```

### Quick Start

```rust
use fcn_sdk::FcnClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = FcnClient::new()?;
    
    // Get latest news
    let news = client.get_news(10).await?;
    for article in news.data {
        println!("📰 {}", article.title);
    }
    
    // Get Fear & Greed
    let fg = client.get_fear_greed().await?;
    println!("😰 Fear & Greed: {} - {}", fg.value, fg.classification);
    
    Ok(())
}
```

### Example Files

| File | Description | Functions |
|------|-------------|-----------|
| [basic.rs](rust/basic.rs) | News, search, categories | 12 |
| [trading.rs](rust/trading.rs) | Signals, whale alerts, funding | 10 |
| [ai_features.rs](rust/ai_features.rs) | Sentiment, digest, AI Q&A | 8 |
| [streaming.rs](rust/streaming.rs) | WebSocket real-time feeds | 5 |
| [portfolio.rs](rust/portfolio.rs) | Portfolio, tax reports | 6 |

---

## 🔵 Go

### Quick Start

```go
package main

import (
    "fmt"
    client "github.com/nirholas/free-crypto-news/examples/go"
)

func main() {
    c := client.NewClient("")
    
    news, _ := c.GetNews(10)
    for _, article := range news {
        fmt.Printf("📰 %s\n", article.Title)
    }
    
    fg, _ := c.GetFearGreed()
    fmt.Printf("😰 Fear & Greed: %d - %s\n", fg.Value, fg.Classification)
}
```

---

## � C# / .NET

### Quick Start

```csharp
using FreeCryptoNews;

using var client = new CryptoNewsClient();

// Get latest news
var news = await client.GetNewsAsync(10);
foreach (var article in news.Data)
{
    Console.WriteLine($"📰 {article.Title}");
}

// Get Fear & Greed
var fg = await client.GetFearGreedAsync();
Console.WriteLine($"😰 {fg.Classification}: {fg.Value}");

// Get sentiment
var sentiment = await client.GetSentimentAsync("BTC");
Console.WriteLine($"🎯 {sentiment.Label}");
```

Run examples:
```bash
cd examples/csharp
dotnet run
```

---

## 🍎 Swift

### Quick Start

```swift
let client = CryptoNewsClient()

// Get latest news
let news = try await client.getNews(limit: 10)
for article in news {
    print("📰 \(article.title)")
}

// Get Fear & Greed
let fg = try await client.getFearGreed()
print("😰 \(fg.classification): \(fg.value)")

// Get sentiment
let sentiment = try await client.getSentiment(asset: "BTC")
print("🎯 \(sentiment.label)")
```

Run examples:
```bash
cd examples/swift
swift run
```

---

## 🟣 Kotlin

### Quick Start

```kotlin
val client = CryptoNewsClient()

// Get latest news
val news = client.getNews(10)
news.forEach { println("📰 ${it.title}") }

// Get Fear & Greed
val fg = client.getFearGreed()
println("😰 ${fg.classification}: ${fg.value}")

// Get sentiment
val sentiment = client.getSentiment("BTC")
println("🎯 ${sentiment.label}")

client.close()
```

Run examples:
```bash
cd examples/kotlin
./gradlew run
```

---

## �🔧 cURL

### Quick Start

```bash
# Get latest news
curl "https://cryptocurrency.cv/api/news?limit=10"

# Get Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Get Fear & Greed Index
curl "https://cryptocurrency.cv/api/market/fear-greed"
```

Run all examples:
```bash
chmod +x curl/all-endpoints.sh
./curl/all-endpoints.sh
```

---

## 🤖 Bot Examples

### discord-bot.js
Discord bot that responds to news commands.

```bash
npm install discord.js
export DISCORD_TOKEN=your-token
node discord-bot.js
```

**Commands:** `!news`, `!bitcoin`, `!defi`, `!search <query>`

### slack-bot.js
Slack bot for crypto news in your workspace.

```bash
npm install @slack/bolt
export SLACK_BOT_TOKEN=your-token
export SLACK_SIGNING_SECRET=your-secret
node slack-bot.js
```

### telegram-bot.py
Basic Telegram bot with news commands.

```bash
pip install python-telegram-bot
export TELEGRAM_TOKEN=your-token
python telegram-bot.py
```

### telegram-digest.py
Advanced Telegram bot with scheduled daily digests.

**Setup:**
```bash
pip install python-telegram-bot aiohttp
export TELEGRAM_TOKEN=your-token
python telegram-digest.py
```

**Features:**
- `/news` - Latest news
- `/bitcoin` - Bitcoin news
- `/defi` - DeFi news
- `/trending` - Trending topics
- `/digest` - Full daily digest
- `/subscribe` - Daily digest subscription
- Scheduled digests at 9 AM UTC

### langchain-tool.py
LangChain tool integration for AI agents.

**Setup:**
```bash
pip install langchain openai
python langchain-tool.py
```

### sentiment-analysis.py ⭐ NEW
**Complete cryptocurrency news sentiment analysis tool** — a free alternative to paid sentiment APIs!

This is a full-featured Python tool that:
- Fetches real-time news from our API (no API key needed!)
- Analyzes sentiment using NLTK VADER (finance-tuned)
- Calculates aggregate sentiment percentages per coin
- Outputs in multiple formats (console table, JSON, CSV)

**Setup:**
```bash
pip install requests nltk pandas
python sentiment-analysis.py
```

**Usage Examples:**
```bash
# Analyze all major coins
python sentiment-analysis.py

# Specific coins only
python sentiment-analysis.py --coins BTC ETH SOL

# Output as JSON
python sentiment-analysis.py --output json --file results.json

# Export to CSV
python sentiment-analysis.py --output csv

# Use API sentiment (Groq AI) instead of local VADER
python sentiment-analysis.py --use-api

# Verbose mode - show individual articles
python sentiment-analysis.py --verbose

# More articles per coin
python sentiment-analysis.py --limit 50
```

**Sample Output:**
```
================================================================================
                    CRYPTO NEWS SENTIMENT ANALYSIS
================================================================================
Symbol   Overall      Positive    Neutral   Negative   Compound   Articles
--------------------------------------------------------------------------------
BTC      BULLISH        45.2%      38.5%      16.3%     +0.234         30
ETH      BULLISH        52.0%      32.0%      16.0%     +0.312         25
SOL      NEUTRAL        33.3%      40.0%      26.7%     +0.045         30
XRP      BEARISH        20.0%      35.0%      45.0%     -0.187         20
================================================================================

📈 Market Summary: 2 Bullish | 1 Neutral | 1 Bearish
🐂 Overall market sentiment: BULLISH
```

**Why use this over paid alternatives?**
- ✅ **Free** - No API keys or subscriptions needed
- ✅ **Local analysis** - VADER runs locally, no rate limits
- ✅ **Finance-tuned** - VADER is optimized for financial/social text
- ✅ **Multiple outputs** - Table, JSON, or CSV
- ✅ **Customizable** - Analyze any coins, any number of articles

### ai-analysis.py
Demonstrates AI-powered article analysis.

**Setup:**
```bash
pip install requests
python ai-analysis.py
```

**Features:**
- Article summarization (short/medium/long)
- Sentiment analysis with confidence scores
- Fact extraction (entities, numbers, dates)
- Fact checking with verdicts
- Follow-up question generation
- Auto-categorization
- Translation to any language

### realtime-stream.js
Real-time news streaming using Server-Sent Events (SSE).

**Browser:**
```html
<script src="realtime-stream.js"></script>
```

**Node.js:**
```bash
npm install eventsource
node realtime-stream.js
```

**Features:**
- Live news updates every 30 seconds
- Breaking news alerts
- Price updates
- Auto-reconnect with exponential backoff
- Graceful shutdown handling

## No API Keys Required!

All examples connect to the free API at `https://cryptocurrency.cv` - no authentication needed.

## Self-Hosted

To use a self-hosted API, change the base URL in each example:

```javascript
const API_URL = 'https://your-instance.vercel.app';
```

```python
API_URL = 'https://your-instance.vercel.app'
```

## More Resources

- [API Documentation](../docs/API.md)
- [AI Features Guide](../docs/AI-FEATURES.md)
- [Real-Time Guide](../docs/REALTIME.md)
- [SDK Documentation](../sdk/)

---

## x402 Payment Examples

For **premium API access**, we support x402 micropayments using USDC on Base (and Solana when configured).

### x402-client.ts (TypeScript/JavaScript)

Use the official `@x402/fetch` package for seamless payments.

**Setup:**
```bash
npm install @x402/fetch ethers
export WALLET_PRIVATE_KEY=your-private-key
npx ts-node x402-client.ts
```

**Features:**
- Automatic payment handling with `payFetch()`
- Multi-endpoint examples
- Manual 402 handling example
- Wallet balance checking

### x402-client.py (Python)

Python implementation of x402 payment flow.

**Setup:**
```bash
pip install requests eth-account web3
export WALLET_PRIVATE_KEY=your-private-key
python x402-client.py
```

**Features:**
- Parse 402 payment requirements
- Create payment signatures
- Auto-retry with payment headers
- API discovery via `.well-known/x402`

### x402-client.go (Go)

Go implementation for server-side integrations.

**Setup:**
```bash
go get github.com/ethereum/go-ethereum
export WALLET_PRIVATE_KEY=your-private-key
go run x402-client.go
```

**Features:**
- ECDSA signature creation
- 402 response parsing
- Payment header injection
- Endpoint discovery

### x402 Pricing

| Endpoint | Price |
|----------|-------|
| `/api/v1/news` | $0.001 |
| `/api/v1/coins` | $0.002 |
| `/api/v1/trending` | $0.001 |
| `/api/v1/market-data` | $0.002 |
| `/api/v1/analysis` | $0.005 |
| `/api/v1/export` | $0.01 |

Check all endpoints at: `https://cryptocurrency.cv/api/.well-known/x402`

---

## 📊 API Categories (184 Endpoints)

### News (12 endpoints)
- `/api/news` - Latest crypto news
- `/api/news/[slug]` - Article by slug
- `/api/search` - Search news
- `/api/categories` - News categories
- `/api/sources` - News sources
- `/api/trending` - Trending articles
- `/api/breaking` - Breaking news
- `/api/digest` - Daily digest
- `/api/tags` - Available tags
- `/api/tags/[tag]` - Articles by tag

### AI & ML (20 endpoints)
- `/api/ai/sentiment` - Sentiment analysis
- `/api/ai/summarize` - Article summarization
- `/api/ai/ask` - AI Q&A
- `/api/ai/entities` - Entity extraction
- `/api/ai/clickbait` - Clickbait detection
- `/api/ai/factcheck` - Fact checking
- `/api/ai/classify` - Article classification
- `/api/ai/debate` - AI debate
- `/api/ai/oracle` - Price predictions

### Market Data (16 endpoints)
- `/api/coins` - Coin list
- `/api/coins/[id]` - Coin details
- `/api/market/ohlc` - OHLC data
- `/api/exchanges` - Exchange list
- `/api/orderbook` - Order book
- `/api/market/fear-greed` - Fear & Greed Index

### Trading (10 endpoints)
- `/api/trading/arbitrage` - Arbitrage opportunities
- `/api/trading/signals` - Trading signals
- `/api/trading/funding` - Funding rates
- `/api/trading/liquidations` - Liquidations
- `/api/trading/whales` - Whale alerts

### Social (16 endpoints)
- `/api/social/x` - X/Twitter feed
- `/api/social/reddit` - Reddit feed
- `/api/social/youtube` - YouTube videos
- `/api/social/influencers` - Top influencers
- `/api/social/governance` - Governance proposals

### Blockchain (18 endpoints)
- `/api/blockchain/gas` - Gas prices
- `/api/blockchain/defi/tvl` - DeFi TVL
- `/api/blockchain/defi/yields` - Yield farming
- `/api/blockchain/airdrops` - Airdrops
- `/api/blockchain/security/rugcheck` - Rug pull check

### Regulatory (14 endpoints)
- `/api/regulatory/news` - Regulatory news
- `/api/regulatory/etf` - ETF news
- `/api/regulatory/sec` - SEC news
- `/api/regulatory/cbdc` - CBDC news

### Analytics (15 endpoints)
- `/api/analytics/overview` - Overview
- `/api/analytics/trends` - Trends
- `/api/analytics/sentiment` - Sentiment trends
- `/api/analytics/correlations` - Correlations

### Feeds & Export (13 endpoints)
- `/api/rss` - RSS feed
- `/api/feeds/atom` - Atom feed
- `/api/export` - Export data
- `/api/webhooks` - Webhooks

---

## 📖 Full Documentation

- [Full API Documentation](../docs/API.md)
- [Examples Tutorial](../docs/EXAMPLES.md)
- [Developer Guide](../docs/DEVELOPER-GUIDE.md)
- [Quickstart Guide](../docs/QUICKSTART.md)

---

**Made with ❤️ by the Free Crypto News Team**

🌐 [Website](https://cryptocurrency.cv) | 📚 [Docs](https://cryptocurrency.cv/docs) | 🐙 [GitHub](https://github.com/nirholas/free-crypto-news)

