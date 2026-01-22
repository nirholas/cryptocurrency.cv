# 📚 API Reference

Complete documentation for the Free Crypto News API. All endpoints are **100% free** with no API keys required.

**Base URL:** `https://free-crypto-news.vercel.app`

---

## Table of Contents

- [News Endpoints](#news-endpoints)
  - [GET /api/news](#get-apinews)
  - [GET /api/news/international](#get-apinewsinternational)
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
- [Real-Time Endpoints](#real-time-endpoints)
  - [GET /api/sse](#get-apisse)
  - [GET /api/ws](#get-apiws)
- [User Features](#user-features)
  - [POST /api/alerts](#post-apialerts)
  - [POST /api/newsletter](#post-apinewsletter)
  - [POST /api/portfolio](#post-apiportfolio)
  - [POST /api/webhooks](#post-apiwebhooks)
- [Admin Endpoints](#admin-endpoints)
  - [GET /api/admin](#get-apiadmin)
- [Market Data](#market-data)
  - [GET /api/sources](#get-apisources)
  - [GET /api/stats](#get-apistats)
- [Analytics & Intelligence](#analytics--intelligence)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
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

Create price or keyword alerts.

**Request Body:**

```json
{
  "action": "create",
  "type": "price",
  "userId": "user-123",
  "coinId": "bitcoin",
  "condition": "above",
  "targetPrice": 100000
}
```

**Or for keyword alerts:**

```json
{
  "action": "create",
  "type": "keyword",
  "userId": "user-123",
  "keywords": ["SEC", "ETF", "regulation"]
}
```

**Response:**

```json
{
  "success": true,
  "alert": {
    "id": "alert-abc123",
    "type": "price",
    "coinId": "bitcoin",
    "condition": "above",
    "targetPrice": 100000,
    "triggered": false
  }
}
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
