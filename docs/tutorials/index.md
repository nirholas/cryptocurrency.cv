# 📚 API Tutorials & Examples

Complete tutorials and code examples for building with the Free Crypto News API. Every endpoint is covered with working code in multiple languages.

**Base URL:** `https://cryptocurrency.cv`

---

## 🚀 Quick Start

=== "Python"

    ```python
    import requests
    
    # Fetch latest news
    response = requests.get("https://cryptocurrency.cv/api/news?limit=5")
    news = response.json()
    
    for article in news["articles"]:
        print(f"📰 {article['title']}")
    ```

=== "JavaScript"

    ```javascript
    // Fetch latest news
    const response = await fetch("https://cryptocurrency.cv/api/news?limit=5");
    const news = await response.json();
    
    news.articles.forEach(article => {
        console.log(`📰 ${article.title}`);
    });
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/news?limit=5" | jq '.articles[].title'
    ```

---

## 📖 Tutorial Categories

### 📰 News Endpoints
Build news aggregators, alerts, and feeds.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [News Feed Basics](news-basics.md) | Get started with the news API | `/api/news`, `/api/latest`, `/api/breaking` |
| [Search & Filtering](search-filtering.md) | Advanced search techniques | `/api/search`, `/api/news/filter` |
| [Archive & Export](archive-export.md) | Historical data and exports | `/api/archive`, `/api/export` |
| [International News](international-news.md) | Multi-language news from 75+ sources | `/api/news/international`, sources, languages |
| [Article Extraction](article-extraction.md) | Full article content & AI detection | `/api/article/[slug]`, `/api/article/extract`, `/api/detect/ai-content` |

### 🤖 AI-Powered Features
Leverage AI for analysis, summarization, and insights.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [AI Sentiment Analysis](ai-sentiment.md) | Analyze market sentiment | `/api/sentiment`, `/api/sentiment/analysis` |
| [AI Features](ai-features.md) | Full AI capabilities | `/api/digest`, `/api/summarize`, `/api/ask`, `/api/ai/brief`, `/api/ai/debate`, `/api/ai/agent` |

### 📊 Trading & Market Data
Access real-time market intelligence.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Trading Signals](trading-signals.md) | Trading intelligence | `/api/signals`, `/api/arbitrage`, `/api/funding`, `/api/liquidations`, `/api/whales` |
| [Market Data](market-data.md) | Price and exchange data | `/api/market/coins`, `/api/market/ohlc`, `/api/market/exchanges`, `/api/fear-greed` |

### 🏦 DeFi & NFT
Track decentralized finance and digital collectibles.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [DeFi & NFT](defi-nft.md) | DeFi protocols, yields, NFT data | `/api/defi`, `/api/defi/protocols`, `/api/defi/yields`, `/api/nft`, `/api/nft/collections` |

### 🔬 Research & Analytics
Deep research and intelligence tools.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Analytics & Research](analytics-research.md) | Advanced analytics | `/api/narratives`, `/api/regulatory`, `/api/analytics/anomalies`, `/api/analytics/credibility` |

### 📱 Social Intelligence
Track social media sentiment and influencers.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Social Intelligence](social-intelligence.md) | Social metrics | `/api/social`, `/api/social/x/sentiment`, `/api/social/monitor`, `/api/social/influencer-score` |

### 💼 Portfolio & Watchlist
Personal investment tracking.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Portfolio & Watchlist](portfolio-watchlist.md) | Portfolio management | `/api/portfolio`, `/api/portfolio/holdings`, `/api/watchlist`, `/api/watchlist/alerts` |

### ⭐ Premium Features
Advanced premium capabilities.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Premium Features](premium-features.md) | Premium API access | `/api/premium/status`, `/api/premium/usage`, `/api/premium/analytics`, `/api/premium/reports` |

### ⚡ Real-time & Webhooks
Build real-time streaming applications.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Real-time SSE](realtime-sse.md) | Server-Sent Events | `/api/sse`, `/api/stream` |
| [User Alerts](user-alerts.md) | Alert configuration | `/api/alerts`, `/api/alerts/rules` |
| [Webhooks](webhooks-integrations.md) | Webhook integrations | `/api/webhooks`, `/api/webhooks/create`, `/api/webhooks/events` |

### 🔧 Utility & Meta
API configuration and metadata.

| Tutorial | Description | Endpoints |
|----------|-------------|-----------|
| [Utility Endpoints](utility-endpoints.md) | Health, sources, config | `/api/health`, `/api/sources`, `/api/categories`, `/api/config`, `/api/openapi` |

---

## 📦 Complete SDKs

Full SDK implementations with all endpoints:

| SDK | Location | Description |
|-----|----------|-------------|
| Python SDK | [examples/python/crypto_news_sdk.py](../../examples/python/crypto_news_sdk.py) | Complete Python SDK with all endpoints |
| TypeScript SDK | [examples/typescript/crypto-news-sdk.ts](../../examples/typescript/crypto-news-sdk.ts) | Type-safe TypeScript SDK |
| JavaScript SDK | [examples/javascript/complete-api.js](../../examples/javascript/complete-api.js) | Comprehensive JavaScript SDK |

---

## 🛠️ Integration Examples

Complete integration examples for popular platforms:

| Example | Language | Description |
|---------|----------|-------------|
| [Discord Bot](../../examples/discord-bot.js) | JavaScript | News bot for Discord |
| [Slack Bot](../../examples/slack-bot.js) | JavaScript | News bot for Slack |
| [Telegram Bot](../../examples/telegram-bot.py) | Python | News bot for Telegram |
| [LangChain Tool](../../examples/langchain-tool.py) | Python | AI agent integration |
| [Real-time Stream](../../examples/realtime-stream.js) | JavaScript | SSE streaming example |
| [Sentiment Analysis](../../examples/sentiment-analysis.py) | Python | AI sentiment example |

---

## 💳 x402 Payment Protocol

For premium API access with micropayments:

| Example | Language | Description |
|---------|----------|-------------|
| [x402 TypeScript](../../examples/x402-client.ts) | TypeScript | Using @x402/fetch |
| [x402 Python](../../examples/x402-client.py) | Python | Manual payment flow |
| [x402 Go](../../examples/x402-client.go) | Go | Server-side integration |

---

## 🔗 Additional Resources

- [Full API Reference](../API.md)
- [Rate Limits & Quotas](../API.md#rate-limits)
- [Error Handling](../API.md#error-handling)
- [Changelog](../CHANGELOG.md)
