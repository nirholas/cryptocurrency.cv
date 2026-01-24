# 📚 API Reference

Complete documentation for the Free Crypto News API. All endpoints are **100% free** with no API keys required.

**Base URL:** `https://free-crypto-news.vercel.app`

---

## Table of Contents

- [News Endpoints](#news-endpoints)
  - [GET /api/news](#get-apinews)
  - [GET /api/news/international](#get-apinewsinternational)
  - [GET /api/news/categories](#get-apinewscategories)
  - [GET /api/bitcoin](#get-apibitcoin)
  - [GET /api/defi](#get-apidefi)
  - [GET /api/breaking](#get-apibreaking)
  - [GET /api/search](#get-apisearch)
  - [GET /api/trending](#get-apitrending)
- [AI-Powered Endpoints](#ai-powered-endpoints)
  - [GET /api/digest](#get-apidigest)
  - [GET /api/sentiment](#get-apisentiment)
  - [GET /api/summarize](#get-apisummarize)
  - [GET /api/ask](#get-apiask)
  - [POST /api/ai](#post-apiai)
  - [GET /api/ai/brief](#get-apiaibrief)
  - [POST /api/ai/debate](#post-apiaidebate)
  - [POST /api/ai/counter](#post-apiaicounter)
- [Trading & Market APIs](#trading--market-apis)
  - [GET /api/arbitrage](#get-apiarbitrage)
  - [GET /api/signals](#get-apisignals)
  - [GET /api/funding](#get-apifunding)
  - [GET /api/options](#get-apioptions)
  - [GET /api/liquidations](#get-apiliquidations)
  - [GET /api/whale-alerts](#get-apiwhale-alerts)
  - [GET /api/orderbook](#get-apiorderbook)
  - [GET /api/fear-greed](#get-apifear-greed)
- [AI Analysis APIs](#ai-analysis-apis)
  - [GET /api/narratives](#get-apinarratives)
  - [GET /api/entities](#get-apientities)
  - [GET /api/claims](#get-apiclaims)
  - [GET /api/clickbait](#get-apiclickbait)
  - [GET /api/origins](#get-apiorigins)
  - [GET /api/relationships](#get-apirelationships)
- [Research & Analytics APIs](#research--analytics-apis)
  - [GET /api/regulatory](#get-apiregulatory)
  - [GET /api/academic](#get-apiacademic)
  - [GET /api/citations](#get-apicitations)
  - [GET /api/coverage-gap](#get-apicoverage-gap)
- [Social Intelligence APIs](#social-intelligence-apis)
  - [GET /api/social](#get-apisocial)
  - [GET /api/social/x/sentiment](#get-apisocialxsentiment)
  - [GET /api/influencers](#get-apiinfluencers)
- [Premium API Endpoints](#premium-api-endpoints)
  - [GET /api/premium](#get-apipremium)
  - [GET /api/premium/ai/signals](#get-apipremiumaisignals)
  - [GET /api/premium/whales/transactions](#get-apipremiumwhalestransactions)
  - [GET /api/premium/screener/advanced](#get-apipremiumscreeneradvanced)
  - [GET /api/premium/smart-money](#get-apipremiumsmart-money)
- [Portfolio APIs](#portfolio-apis)
  - [POST /api/portfolio](#post-apiportfolio)
  - [GET /api/portfolio/performance](#get-apiportfolioperformance)
  - [GET /api/portfolio/tax](#get-apiportfoliotax)
- [Market Data APIs](#market-data-apis)
  - [GET /api/market/coins](#get-apimarketcoins)
  - [GET /api/market/ohlc/[coinId]](#get-apimarketohlccoinid)
  - [GET /api/market/exchanges](#get-apimarketexchanges)
  - [GET /api/market/derivatives](#get-apimarketderivatives)
- [DeFi APIs](#defi-apis)
  - [GET /api/defi/protocol-health](#get-apidefiprotocol-health)
  - [GET /api/onchain/events](#get-apionchanevents)
- [Real-Time Endpoints](#real-time-endpoints)
  - [GET /api/sse](#get-apisse)
  - [GET /api/ws](#get-apiws)
- [User Features](#user-features)
  - [POST /api/alerts](#post-apialerts)
  - [GET /api/alerts](#get-apialerts)
  - [GET /api/alerts/[id]](#get-apialertsid)
  - [PUT /api/alerts/[id]](#put-apialertsid)
  - [DELETE /api/alerts/[id]](#delete-apialertsid)
  - [POST /api/newsletter](#post-apinewsletter)
  - [POST /api/webhooks](#post-apiwebhooks)
- [Admin Endpoints](#admin-endpoints)
  - [GET /api/admin](#get-apiadmin)
- [Archive Endpoints](#archive-endpoints)
  - [GET /api/archive](#get-apiarchive)
  - [GET /api/archive/status](#get-apiarchivestatus)
  - [GET /api/cron/archive](#get-apicronarchive)
  - [POST /api/archive/webhook](#post-apiarchivewebhook)
- [Analytics & Intelligence](#analytics--intelligence)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
- [V1 API (Legacy)](#v1-api-legacy)
- [Storage & Export](#storage--export)
  - [GET /api/storage/cas](#get-apistoragecas)
  - [GET /api/export](#get-apiexport)
  - [GET /api/exports](#get-apiexports)
- [Feed Formats](#feed-formats)
  - [GET /api/rss](#get-apirss)
  - [GET /api/atom](#get-apiatom)
  - [GET /api/opml](#get-apiopml)
- [Utility Endpoints](#utility-endpoints)
  - [GET /api/health](#get-apihealth)
  - [GET /api/cache](#get-apicache)
- [Common Parameters](#common-parameters)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

---

## News Endpoints

### GET /api/news

Fetch aggregated news from all 7 sources.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of articles (1-100) |
| `source` | string | all | Filter by source key |
| `page` | integer | 1 | Page number for pagination |
| `per_page` | integer | 10 | Articles per page |
| `from` | ISO date | - | Start date filter |
| `to` | ISO date | - | End date filter |
| `lang` | string | en | Language code (18 supported) |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/news?limit=5&source=coindesk"
```

**Response:**

```json
{
  "articles": [
    {
      "title": "Bitcoin Surges Past $100K",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin reached a new all-time high...",
      "pubDate": "2026-01-22T10:30:00Z",
      "source": "CoinDesk",
      "sourceKey": "coindesk",
      "category": "general",
      "timeAgo": "2 hours ago"
    }
  ],
  "totalCount": 150,
  "sources": ["CoinDesk", "The Block", "Decrypt", ...],
  "fetchedAt": "2026-01-22T12:30:00Z",
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalPages": 15,
    "hasMore": true
  },
  "lang": "en",
  "availableLanguages": ["en", "zh-CN", "ja-JP", "ko-KR", ...],
  "responseTime": "245ms"
}
```

---

### GET /api/news/international

Fetch news from international crypto news sources with optional translation to English.

**Supported Sources (12 total):**

| Region | Language | Sources |
|--------|----------|--------|
| 🇰🇷 Korea | Korean (ko) | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 China | Chinese (zh) | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 Japan | Japanese (ja) | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 Latin America | Spanish (es) | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | all | Filter by language: `ko`, `zh`, `ja`, `es`, or `all` |
| `region` | string | all | Filter by region: `asia`, `latam`, or `all` |
| `translate` | boolean | false | Translate titles/descriptions to English |
| `limit` | integer | 20 | Number of articles (1-100) |
| `sources` | boolean | false | Return source info instead of articles |

**Example - Get Korean news:**

```bash
curl "https://free-crypto-news.vercel.app/api/news/international?language=ko&limit=10"
```

**Example - Get all Asian news with translation:**

```bash
curl "https://free-crypto-news.vercel.app/api/news/international?region=asia&translate=true"
```

**Example - Get source information:**

```bash
curl "https://free-crypto-news.vercel.app/api/news/international?sources=true"
```

**Response:**

```json
{
  "articles": [
    {
      "id": "blockmedia-abc123",
      "title": "비트코인 가격 상승",
      "titleEnglish": "Bitcoin Price Rises",
      "description": "비트코인이 새로운 고점에 도달...",
      "descriptionEnglish": "Bitcoin reaches new highs...",
      "link": "https://blockmedia.co.kr/...",
      "source": "Block Media",
      "sourceKey": "blockmedia",
      "language": "ko",
      "pubDate": "2026-01-22T10:30:00Z",
      "category": "general",
      "region": "asia",
      "timeAgo": "2h ago"
    }
  ],
  "meta": {
    "total": 45,
    "languages": ["ko", "zh", "ja"],
    "regions": ["asia"],
    "translationEnabled": true,
    "translationAvailable": true,
    "translated": true
  },
  "_links": {
    "self": "/api/news/international?language=all&region=asia&limit=20&translate=true",
    "sources": "/api/news/international?sources=true"
  },
  "_meta": {
    "responseTimeMs": 1250
  }
}
```

**Translation Notes:**
- Translation requires `GROQ_API_KEY` environment variable
- Translations are cached for 7 days
- Rate limited to 1 translation request per second
- Original text is always preserved alongside translations

---

### GET /api/bitcoin

Bitcoin-specific news from all sources.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of articles |
| `lang` | string | en | Language code |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/bitcoin?limit=5"
```

---

### GET /api/defi

DeFi and decentralized finance news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of articles |
| `lang` | string | en | Language code |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/defi?limit=10"
```

---

### GET /api/breaking

Latest breaking news (higher refresh rate).

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 5 | Number of articles |
| `lang` | string | en | Language code |

**Cache:** 1 minute (vs 5 minutes for other endpoints)

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/breaking"
```

---

### GET /api/search

Search news by keywords.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | **required** | Search query |
| `limit` | integer | 10 | Number of results |
| `lang` | string | en | Language code |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/search?q=ethereum+etf&limit=20"
```

**Response includes:**

```json
{
  "query": "ethereum etf",
  "articles": [...],
  "totalCount": 42,
  "searchTime": "89ms"
}
```

---

### GET /api/trending

Trending topics extracted from recent news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of topics |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/trending"
```

**Response:**

```json
{
  "topics": [
    {
      "topic": "Bitcoin",
      "count": 45,
      "sentiment": "bullish",
      "recentHeadlines": [
        "Bitcoin Hits New ATH",
        "Institutional Buying Accelerates"
      ]
    },
    {
      "topic": "ETF",
      "count": 32,
      "sentiment": "bullish",
      "recentHeadlines": [...]
    }
  ],
  "fetchedAt": "2026-01-22T12:30:00Z"
}
```

---

## AI-Powered Endpoints

> **Note:** AI endpoints require `GROQ_API_KEY` environment variable for self-hosted deployments.

### GET /api/digest

AI-generated daily news digest.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 24h | Time period: `6h`, `12h`, `24h` |
| `format` | string | full | Output format: `full`, `brief`, `newsletter` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/digest?period=24h&format=full"
```

**Response:**

```json
{
  "headline": "Bitcoin ETF Approval Sparks Historic Rally",
  "tldr": "The SEC approved the first spot Bitcoin ETF today, triggering a 15% surge in BTC price. Institutional adoption is accelerating as major banks announce crypto custody services.",
  "marketSentiment": {
    "overall": "bullish",
    "reasoning": "Regulatory clarity and institutional adoption driving positive sentiment"
  },
  "sections": [
    {
      "title": "Bitcoin & ETFs",
      "summary": "Historic day for Bitcoin...",
      "articles": ["https://..."]
    }
  ],
  "mustRead": [
    {
      "title": "SEC Approves Spot Bitcoin ETF",
      "source": "CoinDesk",
      "why": "Market-moving regulatory decision"
    }
  ],
  "tickers": [
    { "symbol": "BTC", "mentions": 89, "sentiment": "bullish" },
    { "symbol": "ETH", "mentions": 45, "sentiment": "neutral" }
  ]
}
```

---

### GET /api/sentiment

AI-powered sentiment analysis of news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Articles to analyze |

**Response:**

```json
{
  "articles": [
    {
      "title": "Bitcoin Surges 10%",
      "link": "...",
      "source": "CoinDesk",
      "sentiment": "very_bullish",
      "confidence": 95,
      "reasoning": "Price appreciation with institutional flow",
      "impactLevel": "high",
      "timeHorizon": "immediate",
      "affectedAssets": ["BTC", "ETH"]
    }
  ],
  "market": {
    "overall": "bullish",
    "score": 65,
    "confidence": 82,
    "summary": "Strong bullish momentum driven by ETF news",
    "keyDrivers": ["ETF approval", "Institutional buying", "Technical breakout"]
  }
}
```

---

### GET /api/summarize

Summarize a specific article.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | Article URL to summarize |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/summarize?url=https://coindesk.com/article/..."
```

---

### GET /api/ask

Ask questions about recent crypto news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | **required** | Natural language question |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/ask?q=What%20happened%20with%20Bitcoin%20today"
```

---

### POST /api/ai

Unified AI endpoint for advanced analysis.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | One of: summarize, sentiment, facts, factcheck, questions, categorize, translate |
| `title` | string | No | Article title (improves accuracy) |
| `content` | string | Yes | Article content to analyze |
| `options.length` | string | No | For summarize: short, medium, long |
| `options.targetLanguage` | string | No | For translate: target language |

**Example:**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sentiment",
    "title": "Bitcoin Crashes 20%",
    "content": "Bitcoin experienced its largest drop since..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "sentiment",
  "provider": { "provider": "openai", "model": "gpt-4o-mini" },
  "result": {
    "sentiment": "bearish",
    "confidence": 0.92,
    "reasoning": "Large price drop indicates selling pressure",
    "marketImpact": "high",
    "affectedAssets": ["BTC", "ETH"]
  }
}
```

> 📖 See [AI Features Guide](./AI-FEATURES.md) for detailed documentation.

---

### GET /api/ai/brief

Generate a comprehensive daily crypto news brief.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | today | Date in YYYY-MM-DD format |
| `format` | string | full | `full` or `summary` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/ai/brief?date=2026-01-22&format=full"
```

**Response:**

```json
{
  "success": true,
  "brief": {
    "date": "2026-01-22",
    "executiveSummary": "Crypto markets showed strength with BTC leading...",
    "marketOverview": {
      "sentiment": "bullish",
      "btcTrend": "upward",
      "keyMetrics": {
        "fearGreedIndex": 65,
        "btcDominance": 52.5,
        "totalMarketCap": "$2.5T"
      }
    },
    "topStories": [...],
    "sectorsInFocus": [...],
    "upcomingEvents": [...],
    "riskAlerts": [...],
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

---

### POST /api/ai/debate

Generate balanced bull vs bear perspectives on any article or topic.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `article` | object | No* | Article to debate (`title` and `content`) |
| `topic` | string | No* | Topic to debate |

*At least one of `article` or `topic` is required.

**Example:**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Bitcoin reaching $200k in 2026"}'
```

**Response:**

```json
{
  "success": true,
  "debate": {
    "topic": "Bitcoin reaching $200k in 2026",
    "bullCase": {
      "thesis": "Bitcoin is positioned for significant gains...",
      "arguments": [...],
      "supportingEvidence": [...],
      "priceTarget": "$200,000",
      "timeframe": "12 months",
      "confidence": 0.7
    },
    "bearCase": {
      "thesis": "Macro headwinds pose significant risks...",
      "arguments": [...],
      "supportingEvidence": [...],
      "priceTarget": "$80,000",
      "timeframe": "6 months",
      "confidence": 0.5
    },
    "neutralAnalysis": {
      "keyUncertainties": [...],
      "whatToWatch": [...],
      "consensus": "Market divided with slight bullish bias"
    },
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

---

### POST /api/ai/counter

Challenge any claim with structured counter-arguments.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `claim` | string | Yes | The claim to challenge |
| `context` | string | No | Additional context |

**Example:**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Bitcoin will replace the US dollar by 2030"}'
```

**Response:**

```json
{
  "success": true,
  "counter": {
    "originalClaim": "Bitcoin will replace the US dollar by 2030",
    "counterArguments": [
      {
        "argument": "The US dollar is backed by the world's largest economy...",
        "type": "factual",
        "strength": "strong"
      },
      ...
    ],
    "assumptions": [
      {
        "assumption": "Governments will not effectively regulate Bitcoin",
        "challenge": "Many governments have already shown willingness to restrict crypto"
      }
    ],
    "alternativeInterpretations": [...],
    "missingContext": [...],
    "overallAssessment": {
      "claimStrength": "weak",
      "mainVulnerability": "Underestimates institutional inertia"
    },
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

---

## Real-Time Endpoints

### GET /api/sse

Server-Sent Events stream for real-time news updates.

**Example (JavaScript):**

```javascript
const eventSource = new EventSource('/api/sse');

eventSource.addEventListener('news', (event) => {
  const data = JSON.parse(event.data);
  console.log('New articles:', data.articles);
});

eventSource.addEventListener('breaking', (event) => {
  const article = JSON.parse(event.data);
  alert(`Breaking: ${article.title}`);
});
```

**Events:**

| Event | Description |
|-------|-------------|
| `connected` | Connection established |
| `news` | New articles available |
| `breaking` | Breaking news alert |
| `price` | Price updates |
| `heartbeat` | Keep-alive ping |

---

### GET /api/ws

WebSocket connection info (for standalone WS server).

**Response:**

```json
{
  "message": "WebSocket connections require a dedicated server",
  "documentation": "https://github.com/nirholas/free-crypto-news/blob/main/docs/REALTIME.md",
  "sse_endpoint": "/api/sse"
}
```

> 📖 See [Real-Time Guide](./REALTIME.md) for WebSocket server setup.

---

## User Features

### POST /api/alerts

Create configurable alert rules with various conditions.

**Alert Condition Types:**

| Type | Description |
|------|-------------|
| `price_above` | Price exceeds threshold |
| `price_below` | Price drops below threshold |
| `price_change_pct` | Percentage change in 1h or 24h |
| `volume_spike` | Volume exceeds multiplier of baseline |
| `breaking_news` | Breaking news with optional keywords |
| `ticker_mention` | Ticker mentioned with optional sentiment filter |
| `whale_movement` | Large transfers above USD threshold |
| `fear_greed_change` | Fear & Greed index change |

**Create Alert Rule:**

```bash
curl -X POST https://free-crypto-news.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BTC Above 100k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 100000
    },
    "channels": ["websocket", "webhook"],
    "webhookUrl": "https://your-server.com/alerts",
    "cooldown": 300
  }'
```

**Response:**

```json
{
  "alert": {
    "id": "alert_1737507600_abc123def",
    "name": "BTC Above 100k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 100000
    },
    "channels": ["websocket", "webhook"],
    "webhookUrl": "https://your-server.com/alerts",
    "cooldown": 300,
    "enabled": true,
    "createdAt": "2026-01-22T00:00:00.000Z"
  }
}
```

**Legacy User-Based Alerts (still supported):**

```json
{
  "type": "price",
  "userId": "user-123",
  "coinId": "bitcoin",
  "condition": "above",
  "threshold": 100000
}
```

### GET /api/alerts

List all alert rules or get user alerts.

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `action=evaluate` | Trigger alert evaluation |
| `action=stats` | Get alert statistics |
| `action=events` | Get recent alert events |
| `userId=xxx` | Get legacy user alerts |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/alerts"
```

**Response:**

```json
{
  "alerts": [
    {
      "id": "alert_123",
      "name": "BTC Above 100k",
      "condition": { "type": "price_above", "coin": "bitcoin", "threshold": 100000 },
      "channels": ["websocket"],
      "cooldown": 300,
      "enabled": true,
      "createdAt": "2026-01-22T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /api/alerts/[id]

Get a single alert rule.

```bash
curl "https://free-crypto-news.vercel.app/api/alerts/alert_123"
```

### PUT /api/alerts/[id]

Update an alert rule.

```bash
curl -X PUT https://free-crypto-news.vercel.app/api/alerts/alert_123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BTC Above 120k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 120000
    }
  }'
```

### DELETE /api/alerts/[id]

Delete an alert rule.

```bash
curl -X DELETE https://free-crypto-news.vercel.app/api/alerts/alert_123
```

### POST /api/alerts/[id]?action=test

Test trigger an alert (for testing webhooks).

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/alerts/alert_123?action=test"
```

---

### POST /api/newsletter

Subscribe to email digests.

**Request Body:**

```json
{
  "action": "subscribe",
  "email": "user@example.com",
  "frequency": "daily",
  "categories": ["bitcoin", "defi"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification email sent",
  "subscriptionId": "sub-xyz789"
}
```

---

### POST /api/portfolio

Track portfolio holdings and get relevant news.

**Request Body:**

```json
{
  "action": "add",
  "portfolioId": "portfolio-123",
  "holding": {
    "coinId": "bitcoin",
    "symbol": "BTC",
    "amount": 0.5,
    "purchasePrice": 95000
  }
}
```

**Get portfolio value:**

```bash
curl "https://free-crypto-news.vercel.app/api/portfolio?id=portfolio-123"
```

**Response:**

```json
{
  "portfolio": {
    "holdings": [...],
    "totalValue": 52500,
    "totalCost": 47500,
    "profitLoss": 5000,
    "profitLossPercent": 10.53
  },
  "relatedNews": [...]
}
```

---

### POST /api/webhooks

Register webhooks for server-to-server notifications.

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["news.breaking", "news.new"],
  "secret": "your-webhook-secret",
  "filters": {
    "sources": ["coindesk"],
    "keywords": ["SEC", "ETF"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "webhook": {
    "id": "wh-abc123",
    "url": "https://your-server.com/webhook",
    "events": ["news.breaking", "news.new"],
    "active": true
  }
}
```

**Webhook Payload:**

```json
{
  "event": "news.breaking",
  "timestamp": "2026-01-22T10:00:00Z",
  "signature": "sha256=...",
  "data": {
    "article": {
      "title": "SEC Approves Bitcoin ETF",
      "link": "https://..."
    }
  }
}
```

---

## Admin Endpoints

### GET /api/admin

Dashboard analytics (requires auth token).

**Headers:**

```
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**

```json
{
  "stats": {
    "totalRequests": 145231,
    "uniqueUsers": 3456,
    "avgResponseTime": 156,
    "cacheHitRate": 0.72,
    "errorRate": 0.02
  },
  "topEndpoints": [...],
  "health": {
    "memory": { "used": 245, "total": 512 },
    "services": { "redis": "connected", "sources": "ok" }
  }
}
```

> 📖 See [Admin Guide](./ADMIN.md) for dashboard usage.

---

## Market Data

### GET /api/sources

List all available news sources.

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/sources"
```

**Response:**

```json
{
  "sources": [
    {
      "key": "coindesk",
      "name": "CoinDesk",
      "url": "https://coindesk.com",
      "category": "general",
      "status": "active"
    },
    {
      "key": "theblock",
      "name": "The Block",
      "url": "https://theblock.co",
      "category": "general",
      "status": "active"
    }
  ],
  "count": 7
}
```

---

### GET /api/stats

API usage statistics and metrics.

**Response:**

```json
{
  "totalArticles": 15420,
  "articlesLast24h": 342,
  "sources": 7,
  "oldestArticle": "2024-01-01T00:00:00Z",
  "newestArticle": "2026-01-22T12:30:00Z",
  "cacheHitRate": "94.2%"
}
```

---

## Archive Endpoints

Historical news archive with **zero-configuration** setup. No API keys required!

### GET /api/archive

Query historical archived news articles.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | - | Specific date (YYYY-MM-DD) |
| `start` | string | - | Start date for range |
| `end` | string | - | End date for range |
| `source` | string | - | Filter by source |
| `ticker` | string | - | Filter by ticker (BTC, ETH, etc.) |
| `search` | string | - | Full-text search |
| `limit` | integer | 50 | Max results (1-200) |
| `offset` | integer | 0 | Pagination offset |
| `stats` | boolean | false | Return stats only |
| `index` | boolean | false | Return index only |

**Example:**

```bash
# Get articles from a specific date
curl "https://free-crypto-news.vercel.app/api/archive?date=2026-01-15"

# Search Bitcoin news from last week
curl "https://free-crypto-news.vercel.app/api/archive?ticker=BTC&start=2026-01-17"

# Get archive stats
curl "https://free-crypto-news.vercel.app/api/archive?stats=true"
```

---

### GET /api/archive/status

Check archive health and get setup instructions.

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/archive/status"
```

**Response:**

```json
{
  "healthy": true,
  "storage": "github",
  "lastArchived": "2026-01-24",
  "totalDays": 16,
  "totalArticles": 3500,
  "dateRange": {
    "earliest": "2026-01-08",
    "latest": "2026-01-24"
  },
  "zeroConfigMode": true,
  "setupInstructions": {
    "zeroConfig": {
      "description": "No configuration needed!",
      "testNow": "Visit /api/cron/archive in your browser"
    },
    "cronJobOrg": {
      "url": "https://cron-job.org (FREE)",
      "steps": ["..."]
    }
  }
}
```

---

### GET /api/cron/archive

Trigger news archiving. Works with external cron services.

> **Zero-Config Mode:** If `CRON_SECRET` is not set, this endpoint is public and can be called without authentication. Perfect for testing!

**Authentication (optional):**

If `CRON_SECRET` environment variable is set:
- Query param: `?secret=YOUR_SECRET`
- Header: `Authorization: Bearer YOUR_SECRET`

**Example:**

```bash
# Zero-config mode (no auth)
curl "https://free-crypto-news.vercel.app/api/cron/archive"

# With authentication
curl "https://free-crypto-news.vercel.app/api/cron/archive?secret=YOUR_SECRET"
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2026-01-24T15:30:00Z",
  "stats": {
    "fetched": 87,
    "archived": 85,
    "duplicates": 2,
    "sources": ["CoinDesk", "The Block", "Decrypt", "Cointelegraph"]
  },
  "duration": 1250,
  "articles": [...]
}
```

**Setting up automated archiving:**

| Service | Free? | Setup |
|---------|-------|-------|
| [cron-job.org](https://cron-job.org) | ✅ Yes | Create job → URL: `/api/cron/archive` → Every hour |
| [Uptime Robot](https://uptimerobot.com) | ✅ Yes | Add monitor → HTTP(s) → 1 hour interval |
| [EasyCron](https://easycron.com) | ✅ 200/mo | Similar to cron-job.org |

---

### POST /api/archive/webhook

Archive news with optional GitHub commit. Returns archived articles in response for external storage.

**Authentication:** Same as `/api/cron/archive`

**Example:**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/archive/webhook"
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2026-01-24T15:30:00Z",
  "stats": {
    "fetched": 87,
    "processed": 87,
    "sources": ["CoinDesk", "The Block"]
  },
  "github": {
    "success": true,
    "message": "Committed 42 new articles to archive/v2/articles/2026-01.jsonl"
  }
}
```

> **Note:** GitHub commits only work if `GITHUB_TOKEN` is set. Without it, articles are returned in the response for you to store elsewhere.

---

## Analytics & Intelligence

Advanced analytics features for tracking headline evolution, source credibility, and anomaly detection.

### GET /api/analytics/headlines

Track how article headlines change over time.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | 24 | Time window to look back (1-168) |
| `changesOnly` | boolean | false | Only return headlines that changed |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/analytics/headlines?hours=24&changesOnly=true"
```

**Response:**

```json
{
  "tracked": [
    {
      "articleId": "art_abc123",
      "originalTitle": "Bitcoin Hits $100K",
      "currentTitle": "Bitcoin Surges Past $100K Milestone",
      "changes": [
        {
          "title": "Bitcoin Surges Past $100K Milestone",
          "detectedAt": "2026-01-22T14:30:00Z",
          "changeType": "moderate",
          "sentiment_shift": "more_positive"
        }
      ],
      "totalChanges": 1,
      "firstSeen": "2026-01-22T12:00:00Z",
      "lastChecked": "2026-01-22T14:30:00Z",
      "url": "https://example.com/article",
      "source": "CoinDesk"
    }
  ],
  "recentChanges": [
    {
      "articleId": "art_abc123",
      "from": "Bitcoin Hits $100K",
      "to": "Bitcoin Surges Past $100K Milestone",
      "changedAt": "2026-01-22T14:30:00Z"
    }
  ],
  "stats": {
    "totalTracked": 150,
    "withChanges": 12,
    "avgChangesPerArticle": 0.08
  },
  "generatedAt": "2026-01-22T15:00:00Z"
}
```

---

### GET /api/analytics/credibility

Get credibility scores for news sources based on accuracy, timeliness, consistency, and bias.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | all | Specific source key (optional) |
| `sortBy` | string | score | Sort by: `score`, `accuracy`, `timeliness` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/analytics/credibility?sortBy=accuracy"
```

**Response:**

```json
{
  "sources": [
    {
      "source": "The Block",
      "sourceKey": "theblock",
      "overallScore": 88,
      "metrics": {
        "accuracy": 88,
        "timeliness": 85,
        "consistency": 90,
        "bias": {
          "score": 0.1,
          "confidence": 0.75
        },
        "clickbait": 0.12
      },
      "articleCount": 245,
      "lastUpdated": "2026-01-22T15:00:00Z",
      "trend": "stable"
    }
  ],
  "averageScore": 78.5,
  "topSources": ["The Block", "CoinDesk", "Blockworks"],
  "bottomSources": ["NewsBTC", "Bitcoinist", "CryptoPotato"],
  "generatedAt": "2026-01-22T15:00:00Z"
}
```

**Metrics Explained:**

| Metric | Range | Description |
|--------|-------|-------------|
| `accuracy` | 0-100 | Factual accuracy score |
| `timeliness` | 0-100 | Publishing speed |
| `consistency` | 0-100 | Quality consistency |
| `bias.score` | -1 to 1 | Bearish (-1) to bullish (+1) |
| `clickbait` | 0-1 | Higher = more clickbait |

---

### GET /api/analytics/anomalies

Detect unusual patterns in news flow including volume spikes, coordinated publishing, and sentiment shifts.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | 24 | Time window (1-168) |
| `severity` | string | all | Filter: `high`, `medium`, `low` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/analytics/anomalies?hours=24&severity=high"
```

**Response:**

```json
{
  "anomalies": [
    {
      "id": "anomaly_volume_spike_abc123",
      "type": "volume_spike",
      "severity": "high",
      "detectedAt": "2026-01-22T14:00:00Z",
      "description": "Article volume is 4.2 standard deviations above normal",
      "data": {
        "expected": 12,
        "actual": 48,
        "deviation": 4.2,
        "affectedEntities": ["all_sources"]
      },
      "possibleCauses": [
        "Major market event or breaking news",
        "Multiple coordinated announcements",
        "Market crash or major price movement"
      ]
    },
    {
      "id": "anomaly_coordinated_publishing_def456",
      "type": "coordinated_publishing",
      "severity": "medium",
      "detectedAt": "2026-01-22T13:30:00Z",
      "description": "5 sources published similar headlines within 5 minutes",
      "data": {
        "expected": 1,
        "actual": 5,
        "deviation": 5,
        "affectedEntities": ["CoinDesk", "The Block", "Decrypt", "CoinTelegraph", "Blockworks"]
      },
      "possibleCauses": [
        "Press release distribution",
        "Major announcement from project or company"
      ]
    }
  ],
  "summary": {
    "totalAnomalies": 2,
    "bySeverity": { "high": 1, "medium": 1, "low": 0 },
    "byType": { "volume_spike": 1, "coordinated_publishing": 1 }
  },
  "systemHealth": {
    "normalArticleRate": 11.5,
    "currentRate": 48,
    "activeSources": 12,
    "totalSources": 12
  },
  "generatedAt": "2026-01-22T15:00:00Z"
}
```

**Anomaly Types:**

| Type | Description |
|------|-------------|
| `volume_spike` | Article volume >3 std dev above normal |
| `coordinated_publishing` | Multiple sources publish similar headlines within 5 min |
| `sentiment_shift` | Market sentiment shifts >40% |
| `ticker_surge` | Ticker mentions spike 5x above baseline |
| `source_outage` | Source silent for >12 hours |
| `unusual_timing` | Publishing at unusual hours |

---

## AI Agents & Oracle

### GET /api/oracle

The Oracle - Natural language queries over all crypto intelligence.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Natural language query |
| `context` | string | - | Additional context (market, news, onchain) |
| `format` | string | text | Response format: `text`, `json`, `markdown` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/oracle?q=What%20are%20VCs%20investing%20in%20this%20month"
```

**Response:**

```json
{
  "answer": "Based on recent news, VCs are focusing on...",
  "sources": [
    { "title": "a]6z Leads $50M Round", "source": "CoinDesk", "relevance": 0.95 }
  ],
  "confidence": 0.85,
  "generatedAt": "2026-01-22T15:00:00Z"
}
```

---

### GET /api/ai/agent

AI Market Intelligence Agent for autonomous analysis.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Analysis request |
| `depth` | string | standard | Analysis depth: `quick`, `standard`, `deep` |
| `include` | string | all | Data sources: `news`, `market`, `onchain`, `social`, `all` |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/ai/agent?query=analyze%20bitcoin%20whale%20activity"
```

---

## Social Monitoring

### GET /api/social/monitor

Monitor Discord and Telegram channels for crypto sentiment.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `platform` | string | all | Platform: `discord`, `telegram`, `all` |
| `hours` | integer | 24 | Time range in hours |
| `sentiment` | string | - | Filter: `bullish`, `bearish`, `neutral` |

**POST Parameters (webhook ingestion):**

| Field | Type | Description |
|-------|------|-------------|
| `platform` | string | `discord` or `telegram` |
| `channel` | string | Channel name/ID |
| `content` | string | Message content |
| `author` | string | Message author (optional) |
| `timestamp` | string | ISO timestamp (optional) |

**Example:**

```bash
# Get monitored sentiment
curl "https://free-crypto-news.vercel.app/api/social/monitor?platform=discord"

# Ingest message via webhook
curl -X POST "https://free-crypto-news.vercel.app/api/social/monitor" \
  -H "Content-Type: application/json" \
  -d '{"platform": "discord", "channel": "alpha", "content": "BTC looking strong"}'
```

---

### GET /api/social/influencer-score

Get influencer reliability and prediction accuracy scores.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `username` | string | - | Specific influencer username |
| `platform` | string | twitter | Platform: `twitter`, `youtube`, `telegram` |
| `limit` | integer | 50 | Number of influencers to return |
| `sort` | string | accuracy | Sort by: `accuracy`, `followers`, `influence` |

---

## Storage & Export

### GET /api/storage/cas

Content-addressable storage using IPFS-style hashing.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hash` | string | - | Content hash to retrieve |
| `action` | string | get | Action: `get`, `put`, `verify` |

**POST (store content):**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/storage/cas" \
  -H "Content-Type: application/json" \
  -d '{"content": "Article content...", "metadata": {"source": "coindesk"}}'
```

**Response:**

```json
{
  "hash": "sha256:abc123def456...",
  "size": 1024,
  "storedAt": "2026-01-22T15:00:00Z"
}
```

---

### GET /api/export

Export data in various formats.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | news | Data type: `news`, `portfolio`, `watchlist`, `alerts` |
| `format` | string | json | Format: `json`, `csv`, `parquet` |
| `from` | string | - | Start date (ISO 8601) |
| `to` | string | - | End date (ISO 8601) |

---

### GET /api/exports

Manage bulk export jobs.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | list | Action: `list`, `create`, `status` |
| `jobId` | string | - | Job ID for status check |

---

## Research Endpoints

### GET /api/research/backtest

Backtest trading strategies using historical news data.

**POST Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `strategy` | string | Strategy type: `sentiment_momentum`, `narrative_follow`, `whale_tracking` |
| `asset` | string | Asset to backtest (BTC, ETH, etc.) |
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |
| `initialCapital` | number | Starting capital (default: 10000) |

**Example:**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/research/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "sentiment_momentum",
    "asset": "BTC",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }'
```

---

### GET /api/academic

Academic access program for researchers.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | info | Action: `info`, `register`, `projects`, `usage` |

**POST (register):**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/academic" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "institution": "MIT",
    "email": "jane@mit.edu",
    "researchArea": "crypto market microstructure"
  }'
```

---

### GET /api/citations

Academic citation network for papers citing our data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | list | Action: `list`, `add`, `graph`, `metrics` |
| `format` | string | json | Export format: `json`, `bibtex`, `ris` |

---

### GET /api/predictions

Prediction tracking with accuracy scoring.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | list | Action: `list`, `submit`, `verify`, `leaderboard` |
| `asset` | string | - | Filter by asset |
| `predictor` | string | - | Filter by predictor |

**POST (submit prediction):**

```bash
curl -X POST "https://free-crypto-news.vercel.app/api/predictions" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "BTC",
    "prediction": "above",
    "target": 150000,
    "deadline": "2026-06-30",
    "reasoning": "ETF inflows + halving cycle"
  }'
```

---

## Feed Formats

### GET /api/rss

RSS 2.0 feed output.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `feed` | string | all | Feed type: `all`, `bitcoin`, `defi` |
| `limit` | integer | 20 | Number of items |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/rss?feed=bitcoin"
```

Returns XML RSS feed.

---

### GET /api/atom

Atom feed output.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `feed` | string | all | Feed type: `all`, `bitcoin`, `defi` |
| `limit` | integer | 20 | Number of items |

---

### GET /api/opml

OPML export of all source feeds.

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/opml" > crypto-feeds.opml
```

Import this into any RSS reader to subscribe to all sources.

---

## Utility Endpoints

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:30:00Z",
  "version": "2.0.0"
}
```

---

### GET /api/cache

Cache status and management.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | `status` (default), `clear` |

---

## Trading & Market APIs

### GET /api/arbitrage

Scan for cross-exchange arbitrage opportunities.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pairs` | string | BTC,ETH | Comma-separated trading pairs |
| `minSpread` | number | 0.5 | Minimum spread percentage |
| `exchanges` | string | all | Filter by exchanges |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/arbitrage?pairs=BTC,ETH&minSpread=1"
```

**Response:**

```json
{
  "opportunities": [
    {
      "pair": "BTC/USDT",
      "buyExchange": "Binance",
      "sellExchange": "Coinbase",
      "buyPrice": 98500,
      "sellPrice": 99200,
      "spreadPercent": 0.71,
      "potentialProfit": 700,
      "volume24h": 15000000,
      "lastUpdated": "2026-01-22T12:30:00Z"
    }
  ],
  "scanTime": "145ms"
}
```

---

### GET /api/signals

AI-generated trading signals based on news sentiment and market data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset` | string | BTC | Asset to analyze |
| `timeframe` | string | 4h | Signal timeframe: 1h, 4h, 1d |

**Response:**

```json
{
  "asset": "BTC",
  "signal": "buy",
  "confidence": 0.78,
  "factors": [
    { "type": "sentiment", "value": "bullish", "weight": 0.4 },
    { "type": "technical", "value": "breakout", "weight": 0.3 },
    { "type": "onchain", "value": "accumulation", "weight": 0.3 }
  ],
  "priceTarget": 105000,
  "stopLoss": 94000,
  "riskReward": 2.1,
  "generatedAt": "2026-01-22T12:30:00Z"
}
```

---

### GET /api/funding

Funding rates across perpetual exchanges.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | BTCUSDT | Trading pair |
| `exchanges` | string | all | Filter exchanges |

**Response:**

```json
{
  "rates": [
    {
      "exchange": "Binance",
      "symbol": "BTCUSDT",
      "fundingRate": 0.0012,
      "nextFundingTime": "2026-01-22T16:00:00Z",
      "markPrice": 98750,
      "openInterest": 45000000000
    },
    {
      "exchange": "Bybit",
      "symbol": "BTCUSDT",
      "fundingRate": 0.0015,
      "nextFundingTime": "2026-01-22T16:00:00Z"
    }
  ],
  "avgFundingRate": 0.00135,
  "sentiment": "bullish"
}
```

---

### GET /api/options

Options flow data from major derivatives exchanges.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset` | string | BTC | Underlying asset |
| `exchange` | string | deribit | deribit, okx, bybit |
| `type` | string | all | call, put, or all |

**Response:**

```json
{
  "flows": [
    {
      "exchange": "Deribit",
      "asset": "BTC",
      "type": "call",
      "strike": 120000,
      "expiry": "2026-03-28",
      "premium": 2500,
      "size": 100,
      "impliedVol": 65.5,
      "timestamp": "2026-01-22T12:25:00Z"
    }
  ],
  "putCallRatio": 0.65,
  "maxPain": 95000,
  "totalVolume": 125000000
}
```

---

### GET /api/liquidations

Real-time and historical liquidation data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | all | Trading pair filter |
| `side` | string | all | long, short, or all |
| `minValue` | number | 10000 | Minimum USD value |
| `period` | string | 1h | 1h, 4h, 24h |

**Response:**

```json
{
  "liquidations": [
    {
      "exchange": "Binance",
      "symbol": "BTCUSDT",
      "side": "long",
      "quantity": 2.5,
      "price": 97500,
      "value": 243750,
      "timestamp": "2026-01-22T12:28:00Z"
    }
  ],
  "summary": {
    "totalLongs": 45000000,
    "totalShorts": 12000000,
    "netLiquidations": "long",
    "largestSingle": 2500000
  }
}
```

---

### GET /api/whale-alerts

Large blockchain transactions and whale movements.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset` | string | all | BTC, ETH, USDT, etc. |
| `minValue` | number | 1000000 | Minimum USD value |
| `type` | string | all | transfer, exchange_in, exchange_out |

**Response:**

```json
{
  "alerts": [
    {
      "txHash": "abc123...",
      "asset": "BTC",
      "amount": 500,
      "valueUsd": 49500000,
      "from": "unknown wallet",
      "to": "Coinbase",
      "type": "exchange_in",
      "timestamp": "2026-01-22T12:20:00Z",
      "sentiment": "bearish"
    }
  ],
  "hourlyFlow": {
    "exchangeInflow": 125000000,
    "exchangeOutflow": 95000000,
    "netFlow": "inflow"
  }
}
```

---

### GET /api/orderbook

Aggregated order book depth across exchanges.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | BTCUSDT | Trading pair |
| `depth` | number | 20 | Number of levels |
| `exchanges` | string | all | Comma-separated exchanges |

**Response:**

```json
{
  "symbol": "BTCUSDT",
  "bids": [
    { "price": 98500, "quantity": 15.5, "exchanges": ["Binance", "Coinbase"] }
  ],
  "asks": [
    { "price": 98550, "quantity": 12.3, "exchanges": ["Binance", "Kraken"] }
  ],
  "spread": 0.05,
  "imbalance": 0.12,
  "aggregatedAt": "2026-01-22T12:30:00Z"
}
```

---

### GET /api/fear-greed

Crypto Fear & Greed Index.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 1 | Historical days (1-365) |

**Response:**

```json
{
  "value": 72,
  "classification": "Greed",
  "previousClose": 68,
  "change": 4,
  "history": [
    { "date": "2026-01-21", "value": 68, "classification": "Greed" }
  ],
  "components": {
    "volatility": 25,
    "momentum": 80,
    "social": 75,
    "dominance": 55,
    "trends": 70
  }
}
```

---

## AI Analysis APIs

### GET /api/narratives

AI-detected narrative clusters in crypto news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 24h | Time window: 6h, 12h, 24h, 7d |
| `limit` | number | 10 | Number of narratives |

**Response:**

```json
{
  "narratives": [
    {
      "id": "etf-adoption",
      "title": "Bitcoin ETF Institutional Adoption",
      "summary": "Major institutions increasing BTC exposure through ETFs",
      "sentiment": "bullish",
      "strength": 0.89,
      "articleCount": 45,
      "tickers": ["BTC", "GBTC", "IBIT"],
      "keyPhrases": ["institutional buying", "ETF inflows", "BlackRock"],
      "trendDirection": "rising"
    }
  ],
  "emergingNarratives": [...],
  "fadingNarratives": [...]
}
```

---

### GET /api/entities

Named entity recognition in news articles.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | - | Article URL to analyze |
| `text` | string | - | Raw text to analyze |

**Response:**

```json
{
  "entities": [
    { "text": "BlackRock", "type": "ORGANIZATION", "count": 5 },
    { "text": "Bitcoin", "type": "CRYPTO_ASSET", "count": 12 },
    { "text": "Gary Gensler", "type": "PERSON", "count": 3 },
    { "text": "SEC", "type": "REGULATOR", "count": 8 }
  ],
  "relationships": [
    { "subject": "BlackRock", "predicate": "filed", "object": "ETF application" }
  ]
}
```

---

### GET /api/claims

Extract and verify claims from articles.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Article URL |

**Response:**

```json
{
  "claims": [
    {
      "text": "Bitcoin hash rate reached all-time high",
      "type": "factual",
      "verifiable": true,
      "confidence": 0.95,
      "sources": ["blockchain.com", "glassnode.com"]
    },
    {
      "text": "BTC will reach $200K by end of year",
      "type": "prediction",
      "verifiable": false,
      "confidence": 0.30
    }
  ]
}
```

---

### GET /api/clickbait

Detect clickbait and sensationalism in headlines.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headline` | string | required | Headline to analyze |

**Response:**

```json
{
  "isClickbait": false,
  "score": 0.23,
  "factors": {
    "sensationalWords": 0,
    "exaggeration": false,
    "emotionalManipulation": false,
    "misleadingClaims": false
  },
  "suggestion": "Headline appears factual and balanced"
}
```

---

### GET /api/origins

Detect original source of a news story.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Article URL |

**Response:**

```json
{
  "originalSource": {
    "url": "https://sec.gov/news/...",
    "title": "SEC Press Release",
    "publishedAt": "2026-01-22T09:00:00Z",
    "type": "primary_source"
  },
  "derivedFrom": [
    {
      "url": "https://coindesk.com/...",
      "publishedAt": "2026-01-22T09:15:00Z",
      "similarity": 0.85
    }
  ],
  "isOriginal": false,
  "propagationChain": [...]
}
```

---

### GET /api/relationships

Extract "who did what" relationships from articles.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Article URL |

**Response:**

```json
{
  "relationships": [
    {
      "subject": "BlackRock",
      "action": "purchased",
      "object": "500 BTC",
      "context": "for iShares ETF",
      "confidence": 0.92
    },
    {
      "subject": "SEC",
      "action": "approved",
      "object": "spot Bitcoin ETF",
      "context": "historic ruling",
      "confidence": 0.98
    }
  ]
}
```

---

## Research & Analytics APIs

### GET /api/regulatory

Regulatory news and intelligence.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `jurisdiction` | string | all | us, eu, uk, asia, all |
| `type` | string | all | ruling, proposal, enforcement |

**Response:**

```json
{
  "updates": [
    {
      "title": "SEC Approves Spot Bitcoin ETF",
      "jurisdiction": "US",
      "regulator": "SEC",
      "type": "ruling",
      "impact": "high",
      "affectedAssets": ["BTC", "ETH"],
      "summary": "Historic approval opens door to institutional investment",
      "sourceUrl": "https://sec.gov/...",
      "date": "2026-01-22"
    }
  ],
  "upcomingDeadlines": [...],
  "sentimentByJurisdiction": {
    "US": "positive",
    "EU": "neutral",
    "Asia": "mixed"
  }
}
```

---

### GET /api/academic

Academic research access for researchers.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tier` | string | basic | basic, researcher, institution |
| `format` | string | json | json, csv, parquet |

**Response:**

```json
{
  "access": {
    "tier": "researcher",
    "dailyLimit": 10000,
    "features": ["historical", "bulk_export", "raw_data"],
    "formats": ["json", "csv", "parquet"]
  },
  "endpoints": {
    "historical": "/api/academic/historical",
    "bulk": "/api/academic/bulk",
    "stream": "/api/academic/stream"
  }
}
```

---

### GET /api/citations

Citation network for research articles.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `articleId` | string | required | Article ID or URL |

**Response:**

```json
{
  "article": {
    "id": "abc123",
    "title": "Bitcoin ETF Analysis",
    "citations": 15
  },
  "citedBy": [
    { "title": "Market Impact Study", "url": "...", "date": "2026-01-23" }
  ],
  "references": [
    { "title": "SEC Filing", "url": "...", "type": "primary" }
  ]
}
```

---

### GET /api/coverage-gap

Analyze topics with insufficient news coverage.

**Response:**

```json
{
  "underreported": [
    {
      "topic": "Layer 2 Security Audits",
      "currentCoverage": 3,
      "expectedCoverage": 15,
      "gap": 0.80,
      "suggestedAngles": [...]
    }
  ],
  "overreported": [
    {
      "topic": "Bitcoin Price Predictions",
      "coverageRatio": 3.5
    }
  ]
}
```

---

## Social Intelligence APIs

### GET /api/social

Aggregated social media sentiment.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset` | string | BTC | Asset to analyze |
| `platforms` | string | all | twitter, discord, telegram, reddit |

**Response:**

```json
{
  "asset": "BTC",
  "overallSentiment": 0.72,
  "platforms": {
    "twitter": { "sentiment": 0.75, "volume": 125000, "trending": true },
    "discord": { "sentiment": 0.68, "messages": 45000 },
    "telegram": { "sentiment": 0.70, "messages": 32000 },
    "reddit": { "sentiment": 0.65, "posts": 1200, "comments": 15000 }
  },
  "topInfluencers": [...],
  "viralPosts": [...]
}
```

---

### GET /api/social/x/sentiment

X (Twitter) sentiment via Nitter scraping (no API key required).

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | bitcoin | Search query |
| `accounts` | string | - | Comma-separated accounts to monitor |

**Response:**

```json
{
  "query": "bitcoin",
  "sentiment": {
    "overall": 0.68,
    "bullish": 0.45,
    "bearish": 0.12,
    "neutral": 0.43
  },
  "volume": {
    "tweets": 15000,
    "engagement": 250000,
    "trending": true
  },
  "topTweets": [...],
  "scrapedAt": "2026-01-22T12:30:00Z"
}
```

---

### GET /api/influencers

Crypto influencer tracking and scoring.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `platform` | string | all | twitter, youtube, all |
| `limit` | number | 20 | Number of influencers |

**Response:**

```json
{
  "influencers": [
    {
      "name": "PlanB",
      "handle": "@100trillionUSD",
      "platform": "twitter",
      "followers": 1800000,
      "credibilityScore": 0.72,
      "accuracy": 0.65,
      "recentPredictions": [...],
      "sentiment": "bullish"
    }
  ]
}
```

---

## Premium API Endpoints

Premium endpoints require authentication via API key.

### Authentication

Include your API key in the header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://free-crypto-news.vercel.app/api/premium/..."
```

---

### GET /api/premium

Get premium subscription status.

**Response:**

```json
{
  "subscription": {
    "tier": "pro",
    "status": "active",
    "features": ["advanced_signals", "whale_alerts", "priority_support"],
    "usage": { "requests": 5000, "limit": 50000 },
    "expiresAt": "2026-02-22T00:00:00Z"
  }
}
```

---

### GET /api/premium/ai/signals

Advanced AI trading signals with backtesting.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `assets` | string | all | Comma-separated assets |
| `strategy` | string | momentum | momentum, mean_reversion, trend |
| `backtest` | boolean | false | Include historical performance |

---

### GET /api/premium/whales/transactions

Real-time whale transaction feed.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minValue` | number | 100000 | Minimum USD value |
| `assets` | string | all | Asset filter |
| `realtime` | boolean | false | WebSocket stream |

---

### GET /api/premium/screener/advanced

Advanced token screener with custom filters.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filters` | object | - | Custom filter criteria |
| `sort` | string | volume | Sort field |
| `limit` | number | 50 | Results limit |

---

### GET /api/premium/smart-money

Smart money wallet tracking.

**Response:**

```json
{
  "wallets": [
    {
      "address": "0x...",
      "label": "Galaxy Digital",
      "holdings": [...],
      "recentTrades": [...],
      "pnl30d": 12.5
    }
  ]
}
```

---

## Portfolio APIs

### POST /api/portfolio

Create or update portfolio.

**Request Body:**

```json
{
  "name": "Main Portfolio",
  "holdings": [
    { "asset": "BTC", "quantity": 2.5, "avgPrice": 45000 },
    { "asset": "ETH", "quantity": 10, "avgPrice": 2500 }
  ]
}
```

---

### GET /api/portfolio/performance

Portfolio performance analytics.

**Response:**

```json
{
  "totalValue": 350000,
  "totalCost": 287500,
  "pnl": 62500,
  "pnlPercent": 21.74,
  "breakdown": [...],
  "allocation": {
    "BTC": 0.70,
    "ETH": 0.30
  }
}
```

---

### GET /api/portfolio/tax

Tax reporting data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | number | current | Tax year |
| `jurisdiction` | string | US | Tax jurisdiction |

---

## V1 API (Legacy)

The `/api/v1/*` endpoints provide backwards compatibility.

### GET /api/v1/coins

Legacy coin data endpoint.

### GET /api/v1/global

Global market data.

### GET /api/v1/trending

Trending coins.

### GET /api/v1/defi

DeFi protocol data.

### GET /api/v1/gas

Ethereum gas prices.

---

## Market Data APIs

### GET /api/market/coins

Detailed coin market data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ids` | string | - | Comma-separated coin IDs |
| `vs_currency` | string | usd | Quote currency |
| `order` | string | market_cap_desc | Sort order |
| `per_page` | number | 100 | Results per page |

---

### GET /api/market/ohlc/[coinId]

OHLC candlestick data.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 1 | Historical days |
| `interval` | string | auto | 1m, 5m, 1h, 1d |

---

### GET /api/market/exchanges

Exchange data and rankings.

**Response:**

```json
{
  "exchanges": [
    {
      "id": "binance",
      "name": "Binance",
      "volume24h": 15000000000,
      "trustScore": 10,
      "pairs": 1500
    }
  ]
}
```

---

### GET /api/market/derivatives

Derivatives market overview.

**Response:**

```json
{
  "openInterest": 45000000000,
  "volume24h": 120000000000,
  "topPairs": [...],
  "fundingRates": [...]
}
```

---

## DeFi APIs

### GET /api/defi/protocol-health

DeFi protocol health monitoring.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `protocol` | string | all | Protocol name |
| `chain` | string | all | Blockchain filter |

**Response:**

```json
{
  "protocols": [
    {
      "name": "Aave",
      "chain": "Ethereum",
      "tvl": 12500000000,
      "healthScore": 0.95,
      "auditStatus": "audited",
      "risks": ["smart_contract", "oracle"],
      "recentEvents": [...]
    }
  ]
}
```

---

### GET /api/onchain/events

On-chain events and alerts.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain` | string | ethereum | Blockchain |
| `type` | string | all | Event type filter |

---

## News Categories

### GET /api/news/categories

List all available news categories.

**Response:**

```json
{
  "categories": [
    { "id": "general", "name": "General", "sourceCount": 25 },
    { "id": "bitcoin", "name": "Bitcoin", "sourceCount": 15 },
    { "id": "defi", "name": "DeFi", "sourceCount": 12 },
    { "id": "nft", "name": "NFT", "sourceCount": 8 },
    { "id": "research", "name": "Research", "sourceCount": 18 },
    { "id": "institutional", "name": "Institutional", "sourceCount": 10 },
    { "id": "etf", "name": "ETF", "sourceCount": 6 },
    { "id": "derivatives", "name": "Derivatives", "sourceCount": 5 },
    { "id": "onchain", "name": "On-Chain", "sourceCount": 7 },
    { "id": "fintech", "name": "Fintech", "sourceCount": 8 },
    { "id": "macro", "name": "Macro", "sourceCount": 6 },
    { "id": "quant", "name": "Quant", "sourceCount": 4 },
    { "id": "journalism", "name": "Journalism", "sourceCount": 5 }
  ],
  "totalCategories": 21,
  "totalSources": 120
}
```

Use the category parameter in `/api/news?category=defi` to filter by category.

---

## Common Parameters

### Language Support

The `lang` parameter supports 18 languages:

| Code | Language |
|------|----------|
| `en` | English (default) |
| `zh-CN` | Chinese (Simplified) |
| `zh-TW` | Chinese (Traditional) |
| `ja-JP` | Japanese |
| `ko-KR` | Korean |
| `es-ES` | Spanish |
| `fr-FR` | French |
| `de-DE` | German |
| `pt-BR` | Portuguese (Brazil) |
| `ru-RU` | Russian |
| `ar` | Arabic |
| `hi-IN` | Hindi |
| `vi-VN` | Vietnamese |
| `th-TH` | Thai |
| `id-ID` | Indonesian |
| `tr-TR` | Turkish |
| `nl-NL` | Dutch |
| `pl-PL` | Polish |

**Example:**

```bash
curl "https://free-crypto-news.vercel.app/api/news?lang=ja-JP"
```

---

## Response Format

All JSON responses include:

```json
{
  "data": { ... },
  "fetchedAt": "2026-01-22T12:30:00Z",
  "responseTime": "245ms"
}
```

### HTTP Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Cache-Control` | `public, s-maxage=300, stale-while-revalidate=600` |
| `Access-Control-Allow-Origin` | `*` |

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "status": 400
}
```

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid parameters |
| 400 | Unsupported language | Language code not supported |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server-side error |
| 503 | Service Unavailable | Upstream source unavailable |

---

## Rate Limits

The public API has generous rate limits:

| Tier | Limit |
|------|-------|
| **Public** | 1000 requests/minute |
| **Per IP** | 100 requests/minute |
| **Burst** | 50 requests/second |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706012400
```

### Best Practices

1. **Cache responses** - Most endpoints have 5-minute cache
2. **Use pagination** - Don't fetch all articles at once
3. **Respect cache headers** - Check `Cache-Control` before re-fetching
4. **Handle errors gracefully** - Implement exponential backoff

---

## Internal Data APIs

For developers extending the codebase, we provide 10+ professional data API integrations:

| API | File | Best For |
|-----|------|----------|
| DefiLlama | `src/lib/apis/defillama.ts` | DeFi TVL, yields, protocols |
| L2Beat | `src/lib/apis/l2beat.ts` | Layer 2 analytics, risk |
| Glassnode | `src/lib/apis/glassnode.ts` | On-chain metrics |
| CryptoQuant | `src/lib/apis/cryptoquant.ts` | Exchange flows |
| LunarCrush | `src/lib/apis/lunarcrush.ts` | Social sentiment |
| Messari | `src/lib/apis/messari.ts` | Research-grade data |
| The Graph | `src/lib/apis/thegraph.ts` | DeFi subgraphs |
| NFT Markets | `src/lib/apis/nft-markets.ts` | NFT collections |
| News Feeds | `src/lib/apis/news-feeds.ts` | Aggregated news |
| CoinMarketCap | `src/lib/apis/coinmarketcap.ts` | Market rankings |

### Usage

```typescript
import { defillama, glassnode, l2beat } from '@/lib/apis';

// Get DeFi TVL data
const defi = await defillama.getDefiSummary();

// Get on-chain health
const health = await glassnode.getOnChainHealthAssessment('BTC');

// Get L2 ecosystem
const l2 = await l2beat.getL2Summary();
```

[:material-arrow-right: Full Data API Documentation](integrations/data-apis.md)

---

## SDKs

Official SDKs are available for quick integration:

- [Python SDK](../sdk/python/README.md)
- [JavaScript SDK](../sdk/javascript/README.md)
- [TypeScript SDK](../sdk/typescript/README.md)
- [React Hooks](../sdk/react/README.md)
- [Go SDK](../sdk/go/README.md)
- [PHP SDK](../sdk/php/README.md)

---

## Need Help?

- 📖 [Main Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
