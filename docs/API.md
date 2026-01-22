# 📚 API Reference

Complete documentation for the Free Crypto News API. All endpoints are **100% free** with no API keys required.

**Base URL:** `https://free-crypto-news.vercel.app`

---

## Table of Contents

- [News Endpoints](#news-endpoints)
  - [GET /api/news](#get-apinews)
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
- [Market Data](#market-data)
  - [GET /api/sources](#get-apisources)
  - [GET /api/stats](#get-apistats)
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
