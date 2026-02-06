# 📚 API Reference

Complete documentation for the Free Crypto News API. All endpoints are **100% free** with no API keys required.

**Base URL:** `https://cryptocurrency.cv`

---

## Table of Contents

- [News Endpoints](#news-endpoints)
  - [GET /api/news](#get-apinews)
  - [GET /api/news/international](#get-apinewsinternational)
  - [POST /api/news/extract](#post-apinewsextract)
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
  - [GET /api/ai/synthesize](#get-apiaisynthesize)
  - [GET /api/ai/explain](#get-apiaiexplain)
  - [POST /api/ai/portfolio-news](#post-apiaiportfolio-news)
  - [GET /api/ai/correlation](#get-apiaicorrelation)
  - [GET /api/ai/flash-briefing](#get-apiaiflash-briefing)
  - [GET /api/ai/narratives](#get-apiainarratives)
  - [GET /api/ai/cross-lingual](#get-apiaicross-lingual)
  - [GET /api/ai/source-quality](#get-apiaisource-quality)
  - [GET /api/ai/research](#get-apiairesearch)
- [Trading & Market APIs](#trading-market-apis)
  - [GET /api/arbitrage](#get-apiarbitrage)
  - [GET /api/signals](#get-apisignals)
  - [GET /api/funding](#get-apifunding)
  - [GET /api/options](#get-apioptions)
  - [GET /api/liquidations](#get-apiliquidations)
  - [GET /api/whale-alerts](#get-apiwhale-alerts)
  - [GET /api/orderbook](#get-apiorderbook)
  - [GET /api/fear-greed](#get-apifear-greed)
- [AI Analysis APIs](#ai-analysis-apis)
  - [POST /api/detect/ai-content](#post-apidetectai-content)
  - [GET /api/ai/agent](#get-apiaiagent)
  - [POST /api/ai/agent](#post-apiaiagent)
  - [GET /api/narratives](#get-apinarratives)
  - [GET /api/entities](#get-apientities)
  - [GET /api/claims](#get-apiclaims)
  - [GET /api/clickbait](#get-apiclickbait)
  - [GET /api/origins](#get-apiorigins)
  - [GET /api/relationships](#get-apirelationships)
- [Research & Analytics APIs](#research-analytics-apis)
  - [GET /api/regulatory](#get-apiregulatory)
  - [GET /api/predictions](#get-apipredictions)
  - [GET /api/influencers](#get-apiinfluencers)
  - [GET /api/academic](#get-apiacademic)
  - [GET /api/citations](#get-apicitations)
  - [GET /api/coverage-gap](#get-apicoverage-gap)
- [Intelligence APIs](#intelligence-apis)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/causality](#get-apianalyticscausality)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
- [Social Intelligence APIs](#social-intelligence-apis)
  - [GET /api/social](#get-apisocial)
  - [GET /api/social/x/sentiment](#get-apisocialxsentiment)
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
  - [GET /api/onchain/events](#get-apionchainevents)
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
  - [GET /api/newsletter](#get-apinewsletter)
  - [POST /api/newsletter/subscribe](#post-apinewslettersubscribe)
  - [POST /api/webhooks](#post-apiwebhooks)
  - [POST /api/webhooks/test](#post-apiwebhookstest)
  - [GET /api/webhooks/queue](#get-apiwebhooksqueue)
- [Admin Endpoints](#admin-endpoints)
  - [GET /api/admin](#get-apiadmin)
- [Archive Endpoints](#archive-endpoints)
  - [GET /api/archive](#get-apiarchive)
  - [GET /api/archive/v2](#get-apiarchivev2) (Redirect)
  - [GET /api/archive/status](#get-apiarchivestatus)
  - [GET /api/cron/archive](#get-apicronarchive)
  - [POST /api/archive/webhook](#post-apiarchivewebhook)
- [Analytics & Intelligence](#analytics-intelligence)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
- [V1 API (Legacy)](#v1-api-legacy)
- [Storage & Export](#storage-export)
  - [GET /api/storage/cas](#get-apistoragecas)
  - [GET /api/export](#get-apiexport)
  - [GET /api/export/jobs](#get-apiexportjobs)
  - [GET /api/exports](#get-apiexports)
  - [GET /api/exports/[id]](#get-apiexportsid)
- [Feed Formats](#feed-formats)
  - [GET /api/rss](#get-apirss)
  - [GET /api/atom](#get-apiatom)
  - [GET /api/opml](#get-apiopml)
- [Utility Endpoints](#utility-endpoints)
  - [GET /api/health](#get-apihealth)
  - [GET /api/stats](#get-apistats)
  - [GET /api/cache](#get-apicache)
  - [DELETE /api/cache](#delete-apicache)
  - [GET /status](#get-status)
- [Tags & Discovery](#tags-discovery)
  - [GET /api/tags](#get-apitags)
  - [GET /api/tags/[slug]](#get-apitagsslug)
- [Gateway & Integration](#gateway-integration)
  - [POST /api/gateway](#post-apigateway)
- [API Key Management](#api-key-management)
  - [GET /api/register](#get-apiregister)
  - [POST /api/register](#post-apiregister)
  - [GET /api/keys](#get-apikeys)
  - [POST /api/keys](#post-apikeys)
- [Analytics Tracking](#analytics-tracking)
  - [GET /api/views](#get-apiviews)
  - [POST /api/views](#post-apiviews)
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
curl "https://cryptocurrency.cv/api/news?limit=5&source=coindesk"
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

**Supported Sources (75 total across 18 languages):**

| Language | Code | Sources | Examples |
|----------|------|---------|----------|
| Chinese | zh | 10 | 8BTC, Jinse Finance, Odaily, ChainNews, PANews, TechFlow, BlockBeats, MarsBit, Wu Blockchain, Foresight News |
| Korean | ko | 9 | Block Media, TokenPost, CoinDesk Korea, Decenter, Cobak, The B.Chain, Upbit Blog |
| Japanese | ja | 6 | CoinPost, CoinDesk Japan, Cointelegraph Japan, btcnews.jp, Crypto Times Japan, CoinJinja |
| Portuguese | pt | 5 | Cointelegraph Brasil, Livecoins, Portal do Bitcoin, BeInCrypto Brasil |
| Hindi | hi | 5 | CoinSwitch, CoinDCX, WazirX, ZebPay, Crypto News India |
| Spanish | es | 5 | Cointelegraph Español, Diario Bitcoin, CriptoNoticias, BeInCrypto Español |
| German | de | 4 | BTC-ECHO, Cointelegraph Deutsch, Coincierge, CryptoMonday |
| French | fr | 4 | Journal du Coin, Cryptonaute, Cointelegraph France, Cryptoast |
| Persian | fa | 4 | Arz Digital, Mihan Blockchain, Ramz Arz, Nobitex |
| Turkish | tr | 3 | Cointelegraph Türkçe, Koin Medya, Coinsider |
| Russian | ru | 3 | ForkLog, Cointelegraph Russia, Bits.Media |
| Italian | it | 3 | Cointelegraph Italia, The Cryptonomist, Criptovalute.it |
| Indonesian | id | 3 | Cointelegraph Indonesia, Blockchain Media, Pintu Academy |
| Vietnamese | vi | 2 | Tạp chí Bitcoin, Coin68 |
| Thai | th | 2 | Siam Blockchain, Bitcoin Addict Thailand |
| Polish | pl | 2 | Kryptowaluty.pl, Bitcoin.pl |
| Dutch | nl | 2 | Bitcoin Magazine NL, Crypto Insiders |
| Arabic | ar | 2 | Cointelegraph Arabic, ArabiCrypto |

**Regions:**
- `asia` - Korean, Chinese, Japanese, Hindi sources (30 sources)
- `europe` - German, French, Russian, Turkish, Italian, Dutch, Polish sources (23 sources)
- `latam` - Spanish, Portuguese sources (10 sources)
- `mena` - Arabic, Persian sources (6 sources)
- `sea` - Indonesian, Vietnamese, Thai sources (7 sources)

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | all | Filter by language: `ko`, `zh`, `ja`, `es`, `pt`, `de`, `fr`, `ru`, `tr`, `it`, `id`, `nl`, `pl`, `vi`, `th`, `ar`, `hi`, `fa`, or `all` |
| `region` | string | all | Filter by region: `asia`, `europe`, `latam`, `mena`, `sea`, or `all` |
| `translate` | boolean | false | Translate titles/descriptions to English |
| `limit` | integer | 20 | Number of articles (1-100) |
| `sources` | boolean | false | Return source info instead of articles |

**Example - Get Korean news:**

```bash
curl "https://cryptocurrency.cv/api/news/international?language=ko&limit=10"
```

**Example - Get all Asian news with translation:**

```bash
curl "https://cryptocurrency.cv/api/news/international?region=asia&translate=true"
```

**Example - Get source information:**

```bash
curl "https://cryptocurrency.cv/api/news/international?sources=true"
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

### POST /api/news/extract

Extract full article content from a URL, including metadata.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Article URL to extract |

**Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/news/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://coindesk.com/article/..."}'
```

**Response:**

```json
{
  "url": "https://coindesk.com/article/...",
  "title": "Bitcoin Surges Past $100K",
  "content": "Bitcoin experienced a historic surge...",
  "author": "Jane Doe",
  "published_date": "2026-01-22T10:00:00Z",
  "word_count": 850,
  "reading_time_minutes": 4
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
curl "https://cryptocurrency.cv/api/bitcoin?limit=5"
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
curl "https://cryptocurrency.cv/api/defi?limit=10"
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
curl "https://cryptocurrency.cv/api/breaking"
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
curl "https://cryptocurrency.cv/api/search?q=ethereum+etf&limit=20"
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
curl "https://cryptocurrency.cv/api/trending"
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
curl "https://cryptocurrency.cv/api/digest?period=24h&format=full"
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
curl "https://cryptocurrency.cv/api/summarize?url=https://coindesk.com/article/..."
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
curl "https://cryptocurrency.cv/api/ask?q=What%20happened%20with%20Bitcoin%20today"
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
curl -X POST "https://cryptocurrency.cv/api/ai" \
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
curl "https://cryptocurrency.cv/api/ai/brief?date=2026-01-22&format=full"
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
curl -X POST "https://cryptocurrency.cv/api/ai/debate" \
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
curl -X POST "https://cryptocurrency.cv/api/ai/counter" \
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

### GET /api/ai/synthesize

Auto-clusters duplicate news articles and synthesizes them into comprehensive summaries.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 5 | Number of stories to synthesize (max 10) |
| `threshold` | float | 0.4 | Similarity threshold for clustering |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/synthesize?limit=5"
```

**Response:**

```json
{
  "success": true,
  "synthesizedStories": [
    {
      "headline": "SEC Approves Spot Bitcoin ETF Applications",
      "summary": "The SEC approved multiple spot Bitcoin ETF applications from major asset managers...",
      "keyFacts": ["11 ETFs approved simultaneously", "BlackRock's iShares leads volume", "Trading begins tomorrow"],
      "sourceCount": 8,
      "sources": [
        {"name": "CoinDesk", "url": "..."},
        {"name": "The Block", "url": "..."}
      ],
      "sentiment": "bullish",
      "confidence": 0.92,
      "marketImpact": "high",
      "relatedCoins": ["BTC", "ETH"],
      "disagreements": ["Some sources report 10 ETFs, others 11"]
    }
  ],
  "clustersFound": 12,
  "articlesAnalyzed": 100,
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/explain

AI-powered explanation for why a topic is trending with full context.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | **required** | Topic to explain (e.g., "Bitcoin", "ETF", "Solana") |
| `includePrice` | boolean | false | Include price change context |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/explain?topic=Bitcoin&includePrice=true"
```

**Response:**

```json
{
  "success": true,
  "explanation": {
    "topic": "Bitcoin",
    "whyTrending": "ETF approval driving unprecedented institutional interest",
    "background": "After years of SEC rejections, spot Bitcoin ETFs were finally approved...",
    "keyEvents": [
      {"event": "SEC approves 11 spot ETFs", "date": "2024-01-10", "significance": "Historic regulatory milestone"}
    ],
    "marketImplications": "Opens Bitcoin to traditional investment portfolios",
    "sentiment": "bullish",
    "priceContext": "Up 15% in 24 hours following approval",
    "whatToWatch": ["ETF trading volume", "Institutional inflows", "SEC commentary"],
    "relatedTopics": ["ETF", "SEC", "Institutions"]
  },
  "articleCount": 45,
  "recentHeadlines": ["...", "..."],
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### POST /api/ai/portfolio-news

Scores news articles by relevance to your portfolio holdings.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `holdings` | array | Yes | Array of holdings with symbol, name, allocation |

**Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/portfolio-news" \
  -H "Content-Type: application/json" \
  -d '{
    "holdings": [
      {"symbol": "BTC", "name": "Bitcoin", "allocation": 0.5},
      {"symbol": "ETH", "name": "Ethereum", "allocation": 0.3},
      {"symbol": "SOL", "name": "Solana", "allocation": 0.2}
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "portfolioSize": 3,
  "articlesAnalyzed": 50,
  "relevantArticles": 12,
  "byUrgency": {
    "immediate": 2,
    "important": 5,
    "informational": 5
  },
  "articles": {
    "immediate": [
      {
        "articleTitle": "Solana Network Outage Reported",
        "relevanceScore": 95,
        "relevantHoldings": [
          {"symbol": "SOL", "impact": "negative", "reason": "Direct impact on Solana holdings"}
        ],
        "urgency": "immediate",
        "actionSuggestion": "Monitor network status before trading"
      }
    ],
    "important": [...],
    "informational": [...]
  },
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/correlation

Detects potential correlations between news articles and price movements.

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/correlation"
```

**Response:**

```json
{
  "success": true,
  "correlations": [
    {
      "article": "SEC Chair Hints at Ethereum ETF Approval",
      "coin": "ETH",
      "priceMove": 8.5,
      "confidence": 0.85,
      "explanation": "Regulatory news directly impacted price",
      "timing": "News came 15 mins before price surge"
    }
  ],
  "summary": "Strong correlation between regulatory news and large-cap price movements today",
  "significantMovers": [
    {"symbol": "ETH", "price": 3500, "change1h": 5.2, "change24h": 12.3}
  ],
  "articlesAnalyzed": 50,
  "coinsAnalyzed": 50,
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/flash-briefing

Ultra-short AI-generated summary of top crypto stories. Perfect for voice assistants or quick updates.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stories` | integer | 5 | Number of stories to include (max 10) |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/flash-briefing?stories=3"
```

**Response:**

```json
{
  "success": true,
  "briefing": "Crypto markets are buzzing today with Bitcoin pushing past $100k and major ETF inflows continuing.",
  "stories": [
    {
      "headline": "Bitcoin Breaks $100k",
      "oneLineSummary": "BTC hits all-time high on institutional demand",
      "sentiment": "bullish"
    },
    {
      "headline": "Ethereum L2 TVL Hits Record",
      "oneLineSummary": "Layer 2 networks now hold $50B in value",
      "sentiment": "bullish"
    }
  ],
  "marketMood": "bullish",
  "articlesAnalyzed": 50,
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/narratives

Tracks crypto narratives through their lifecycle: emerging, growing, peak, declining.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `predict` | string | - | Optional: Get prediction for specific narrative |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/narratives"
```

**Response:**

```json
{
  "success": true,
  "activeNarratives": [
    {
      "id": "bitcoin-etf",
      "name": "Bitcoin ETF",
      "lifecycle": "peak",
      "strength": 95,
      "velocity": 0.1,
      "sentiment": 0.8,
      "relatedCoins": ["BTC"],
      "prediction": {
        "nextPhase": "Narrative will stabilize as ETF becomes normalized",
        "confidence": 0.7,
        "timeframe": "2-4 weeks",
        "reasoning": "Initial excitement fading as trading volume stabilizes"
      }
    }
  ],
  "emergingNarratives": [
    {
      "id": "ai-crypto",
      "name": "AI + Crypto Convergence",
      "lifecycle": "emerging",
      "strength": 45,
      "velocity": 0.6
    }
  ],
  "decliningNarratives": [...],
  "marketCycle": {
    "cyclePhase": "markup",
    "confidence": 0.7,
    "dominantNarratives": ["Bitcoin ETF", "Institutional Adoption"],
    "historicalAnalog": "Similar to Q4 2020 - Early 2021 bull run"
  },
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/cross-lingual

Detects when Asian/European sources break news before Western sources. Identifies regional sentiment divergence.

**Example:**

```bash
curl "https://cryptocurrency.cv/api/ai/cross-lingual"
```

**Response:**

```json
{
  "success": true,
  "alphaSignals": [
    {
      "topic": "New Binance regulatory compliance",
      "firstRegion": "asia",
      "firstSource": "Block Media (Korea)",
      "confidence": 0.85,
      "potentialImpact": "medium",
      "summary": "First reported 2 hours before English sources",
      "relatedCoins": ["BNB"]
    }
  ],
  "regionalSentiments": [
    {
      "region": "asia",
      "overallSentiment": "bullish",
      "confidence": 0.75,
      "topTopics": ["Bitcoin ETF", "Korean adoption"],
      "divergenceFromGlobal": 0.15
    }
  ],
  "divergenceAlerts": [
    {
      "topic": "Altcoin season",
      "asianSentiment": "bullish",
      "westernSentiment": "neutral",
      "significance": "Asian traders may be front-running altcoin moves"
    }
  ],
  "articleCounts": {
    "asia": 45,
    "europe": 30,
    "anglosphere": 80,
    "total": 175
  },
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

---

### GET /api/ai/source-quality

AI-powered scoring of news sources and clickbait detection.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | - | Analyze specific source quality |
| `category` | string | - | Rank sources for a category |
| `clickbait` | boolean | false | Detect clickbait across all articles |

**Example:**

```bash
# Analyze specific source
curl "https://cryptocurrency.cv/api/ai/source-quality?source=CoinDesk"

# Detect clickbait
curl "https://cryptocurrency.cv/api/ai/source-quality?clickbait=true"
```

**Response (source analysis):**

```json
{
  "success": true,
  "sourceQuality": {
    "sourceName": "CoinDesk",
    "overallScore": 85,
    "accuracyScore": 88,
    "speedScore": 82,
    "originalityScore": 90,
    "clickbaitScore": 15,
    "strengths": ["Original reporting", "Fast breaking news", "Reliable sources"],
    "weaknesses": ["Occasional sponsored content"],
    "bestFor": ["Breaking news", "Regulatory coverage", "Market analysis"],
    "trustLevel": "high",
    "verificationStatus": "verified"
  }
}
```

**Response (clickbait detection):**

```json
{
  "success": true,
  "articlesAnalyzed": 50,
  "clickbaitCount": 8,
  "clickbaitPercentage": "16.0",
  "averageClickbaitScore": "25.3",
  "worstOffenders": [
    {
      "title": "YOU WON'T BELIEVE What Bitcoin Did Next!!!",
      "source": "CryptoHype",
      "isClickbait": true,
      "score": 85,
      "reasons": ["Sensational keywords", "Excessive punctuation", "Curiosity gap"]
    }
  ]
}
```

---

### GET /api/ai/research

Deep-dive research on any crypto topic with comprehensive analysis.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | **required** | Topic to research |
| `mode` | string | full | `full` for complete report, `quick` for quick take |
| `compare` | string | - | Compare two assets: `BTC,ETH` |
| `contrarian` | boolean | false | Find contrarian opportunities |

**Examples:**

```bash
# Full research report
curl "https://cryptocurrency.cv/api/ai/research?topic=Solana"

# Quick take
curl "https://cryptocurrency.cv/api/ai/research?topic=DeFi&mode=quick"

# Compare assets
curl "https://cryptocurrency.cv/api/ai/research?compare=BTC,ETH"

# Contrarian opportunities
curl "https://cryptocurrency.cv/api/ai/research?contrarian=true"
```

**Response (full report):**

```json
{
  "success": true,
  "report": {
    "topic": "Solana",
    "executiveSummary": "Solana is experiencing renewed institutional interest following network stability improvements and DeFi growth...",
    "newsAnalysis": {
      "totalArticles": 35,
      "sentimentBreakdown": {"bullish": 60, "bearish": 15, "neutral": 25},
      "keyThemes": ["Network reliability", "DeFi growth", "NFT marketplace"],
      "recentDevelopments": [
        {"date": "2026-02-01", "event": "Solana TVL hits $10B", "significance": "high"}
      ]
    },
    "investmentThesis": {
      "bullCase": {
        "summary": "Technical improvements and ecosystem growth position Solana for continued gains",
        "arguments": ["Improved uptime", "Growing DeFi TVL", "Institutional adoption"],
        "priceTarget": "$300-400",
        "confidence": 0.65
      },
      "bearCase": {
        "summary": "Competition and past reliability issues remain concerns",
        "arguments": ["Ethereum L2 competition", "Historical outages", "Centralization concerns"],
        "confidence": 0.55
      },
      "verdict": "bullish"
    },
    "risks": [
      {"risk": "Network outage", "severity": "high", "probability": 0.2, "mitigation": "Monitor uptime stats"}
    ],
    "opportunities": [
      {"opportunity": "DeFi TVL growth", "timeframe": "medium term", "potentialReturn": "50-100%", "confidence": 0.6}
    ],
    "confidence": 0.7,
    "disclaimer": "This is AI-generated research for informational purposes only..."
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
curl -X POST https://cryptocurrency.cv/api/alerts \
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
curl "https://cryptocurrency.cv/api/alerts"
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
curl "https://cryptocurrency.cv/api/alerts/alert_123"
```

### PUT /api/alerts/[id]

Update an alert rule.

```bash
curl -X PUT https://cryptocurrency.cv/api/alerts/alert_123 \
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
curl -X DELETE https://cryptocurrency.cv/api/alerts/alert_123
```

### POST /api/alerts/[id]?action=test

Test trigger an alert (for testing webhooks).

```bash
curl -X POST "https://cryptocurrency.cv/api/alerts/alert_123?action=test"
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

### GET /api/newsletter

Newsletter API information and verification endpoints.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | `verify`, `unsubscribe`, or `stats` |
| `token` | string | Verification/unsubscribe token |

**Example - Verify subscription:**

```bash
curl "https://cryptocurrency.cv/api/newsletter?action=verify&token=xxx"
```

---

### POST /api/newsletter/subscribe

Direct subscription endpoint with rate limiting.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscribed": true
}
```

**Rate Limits:** 5 attempts per minute per IP

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
curl "https://cryptocurrency.cv/api/portfolio?id=portfolio-123"
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

### POST /api/webhooks/test

Send a test payload to a registered webhook (requires authentication).

**Headers:**

```
X-API-Key: YOUR_API_KEY
```

**Request Body:**

```json
{
  "webhookId": "wh-abc123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Test webhook delivered",
  "webhookId": "wh-abc123",
  "statusCode": 200,
  "responseTime": 245
}
```

---

### GET /api/webhooks/queue

Check the async webhook delivery queue status.

**Response:**

```json
{
  "pending": 3,
  "processing": 1,
  "completed": 145,
  "failed": 2,
  "jobs": [
    {
      "id": "wh_job_abc123",
      "url": "https://your-server.com/webhook",
      "status": "pending",
      "retries": 0,
      "createdAt": 1706012400000
    }
  ]
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
curl "https://cryptocurrency.cv/api/sources"
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

API usage statistics and detailed metrics.

**Response:**

```json
{
  "summary": {
    "totalArticles": 100,
    "activeSources": 18,
    "totalSources": 20,
    "avgArticlesPerHour": 4.2,
    "timeRange": "24h"
  },
  "bySource": [
    {
      "source": "CoinDesk",
      "articleCount": 25,
      "percentage": 25,
      "latestArticle": "Bitcoin Hits $100K Milestone",
      "latestTime": "2026-01-22T12:00:00Z"
    }
  ],
  "byCategory": [
    { "category": "general", "count": 45 },
    { "category": "bitcoin", "count": 25 },
    { "category": "defi", "count": 15 }
  ],
  "hourlyDistribution": [
    { "hour": "2026-01-22T00:00", "count": 3 },
    { "hour": "2026-01-22T01:00", "count": 5 }
  ],
  "fetchedAt": "2026-01-22T12:30:00Z"
}
```

**Cache:** 5 minutes

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
curl "https://cryptocurrency.cv/api/archive?date=2026-01-15"

# Search Bitcoin news from last week
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&start=2026-01-17"

# Get archive stats
curl "https://cryptocurrency.cv/api/archive?stats=true"
```

---

### GET /api/archive/status

Check archive health and get setup instructions.

**Example:**

```bash
curl "https://cryptocurrency.cv/api/archive/status"
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

### GET /api/archive/v2

> **Redirect:** This endpoint permanently redirects (308) to `/api/archive`. Use `/api/archive` for all new integrations.

For backwards compatibility, all requests to `/api/archive/v2` are automatically redirected to the main `/api/archive` endpoint with full feature support.

See [GET /api/archive](#get-apiarchive) for parameters and examples.

---

### GET /api/archive (Full Features)

Query the enriched archive with advanced filtering, sentiment analysis, and ticker tracking.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | string | - | Start date (YYYY-MM-DD) |
| `end_date` | string | - | End date (YYYY-MM-DD) |
| `source` | string | - | Filter by source name |
| `ticker` | string | - | Filter by ticker (BTC, ETH, etc.) |
| `q` | string | - | Search query |
| `sentiment` | string | - | Filter: `positive`, `negative`, `neutral` |
| `tags` | string | - | Comma-separated tag filters |
| `limit` | integer | 50 | Max results (1-200) |
| `offset` | integer | 0 | Pagination offset |
| `format` | string | full | Response format: `full`, `simple`, `minimal` |
| `lang` | string | en | Language code for translation |
| `stats` | boolean | false | Return archive statistics only |
| `trending` | boolean | false | Return trending tickers |
| `hours` | integer | 24 | Hours for trending (with `trending=true`) |
| `market` | string | - | Get market history for month (YYYY-MM) |

**Example - Get enriched articles:**

```bash
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&sentiment=positive&limit=20"
```

**Example - Get trending tickers:**

```bash
curl "https://cryptocurrency.cv/api/archive?trending=true&hours=24"
```

**Response (trending):**

```json
{
  "success": true,
  "hours": 24,
  "tickers": [
    { "ticker": "BTC", "mentions": 145, "sentiment_avg": 0.65 },
    { "ticker": "ETH", "mentions": 89, "sentiment_avg": 0.42 }
  ]
}
```

**Example - Get archive stats:**

```bash
curl "https://cryptocurrency.cv/api/archive?stats=true"
```

**Response (stats):**

```json
{
  "success": true,
  "version": "2.0.0",
  "stats": {
    "totalArticles": 5420,
    "dateRange": { "start": "2026-01-01", "end": "2026-01-22" },
    "sources": 25,
    "tickers": 150
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
curl "https://cryptocurrency.cv/api/cron/archive"

# With authentication
curl "https://cryptocurrency.cv/api/cron/archive?secret=YOUR_SECRET"
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
curl -X POST "https://cryptocurrency.cv/api/archive/webhook"
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
    "message": "Committed 42 new articles to archive/articles/2026-01.jsonl"
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
curl "https://cryptocurrency.cv/api/analytics/headlines?hours=24&changesOnly=true"
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
curl "https://cryptocurrency.cv/api/analytics/credibility?sortBy=accuracy"
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
curl "https://cryptocurrency.cv/api/analytics/anomalies?hours=24&severity=high"
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
curl "https://cryptocurrency.cv/api/oracle?q=What%20are%20VCs%20investing%20in%20this%20month"
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
curl "https://cryptocurrency.cv/api/ai/agent?query=analyze%20bitcoin%20whale%20activity"
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
curl "https://cryptocurrency.cv/api/social/monitor?platform=discord"

# Ingest message via webhook
curl -X POST "https://cryptocurrency.cv/api/social/monitor" \
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
curl -X POST "https://cryptocurrency.cv/api/storage/cas" \
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

List export jobs or get schemas.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `schema` | boolean | false | Return available export schemas |
| `archives` | boolean | false | Return monthly archives |

**Example - List jobs:**

```bash
curl "https://cryptocurrency.cv/api/exports"
```

**Response:**

```json
{
  "success": true,
  "jobs": [
    {
      "id": "export_abc123",
      "status": "completed",
      "format": "json",
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Example - Get schemas:**

```bash
curl "https://cryptocurrency.cv/api/exports?schema=true"
```

---

### GET /api/exports/[id]

Get export job status or download result.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `download` | boolean | false | Download the export result |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/exports/export_abc123"
```

**Response:**

```json
{
  "success": true,
  "job": {
    "id": "export_abc123",
    "status": "completed",
    "progress": 100,
    "format": "json",
    "createdAt": "2026-01-22T10:00:00Z",
    "completedAt": "2026-01-22T10:02:00Z",
    "result": {
      "filename": "export_abc123.json",
      "size": 125000,
      "rowCount": 500
    }
  }
}
```

---

### GET /api/export/jobs

List and manage export jobs.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter: `pending`, `processing`, `completed`, `failed` |
| `cleanup` | boolean | false | Remove old jobs |
| `maxAge` | integer | 3600000 | Max age in ms for cleanup (default: 1 hour) |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/export/jobs?status=completed"
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "jobs": [
    {
      "id": "job_abc123",
      "status": "completed",
      "progress": 100,
      "format": "csv",
      "createdAt": "2026-01-22T10:00:00Z",
      "completedAt": "2026-01-22T10:01:30Z",
      "result": {
        "filename": "export.csv",
        "size": 45000,
        "sizeHuman": "43.95 KB",
        "rowCount": 200
      }
    }
  ]
}
```

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
curl -X POST "https://cryptocurrency.cv/api/research/backtest" \
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
curl -X POST "https://cryptocurrency.cv/api/academic" \
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
curl -X POST "https://cryptocurrency.cv/api/predictions" \
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
curl "https://cryptocurrency.cv/api/rss?feed=bitcoin"
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
curl "https://cryptocurrency.cv/api/opml" > crypto-feeds.opml
```

Import this into any RSS reader to subscribe to all sources.

---

## Utility Endpoints

### GET /api/health

Comprehensive health check endpoint with source status and system metrics.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T12:30:00Z",
  "totalResponseTime": 2450,
  "summary": {
    "healthy": 18,
    "degraded": 2,
    "down": 0,
    "total": 20
  },
  "system": {
    "cache": {
      "news": { "hits": 1250, "misses": 45, "staleHits": 12, "errors": 0, "backend": "memory" },
      "market": { "hits": 890, "misses": 23, "staleHits": 5, "errors": 0, "backend": "memory" },
      "ai": { "hits": 320, "misses": 12, "staleHits": 2, "errors": 0, "backend": "memory" },
      "global": { "hits": 156, "misses": 8, "staleHits": 1, "errors": 0, "backend": "memory" }
    },
    "monitoring": {
      "sentry": true,
      "environment": "production",
      "release": "1.0.0"
    }
  },
  "sources": [
    {
      "source": "coindesk",
      "status": "healthy",
      "responseTime": 245,
      "lastArticle": "Bitcoin Surges Past $100K"
    }
  ]
}
```

**Status Codes:**
- `200` - Healthy or degraded
- `503` - Down (fewer than 3 healthy sources)

---

### GET /api/cache

Get cache statistics for news, AI, and translation caches.

**Response:**

```json
{
  "caches": {
    "news": { "hits": 1250, "misses": 45, "size": 128 },
    "ai": { "hits": 320, "misses": 12, "size": 64 },
    "translation": { "hits": 890, "misses": 23, "size": 256 }
  },
  "timestamp": "2026-01-22T12:30:00Z"
}
```

---

### DELETE /api/cache

Clear all caches (news, AI, and translation).

**Response:**

```json
{
  "message": "All caches cleared",
  "timestamp": "2026-01-22T12:30:00Z"
}
```

---

### GET /status

Visual system status dashboard showing real-time health of all services.

**URL:** `https://cryptocurrency.cv/status`

This is a **UI page** (not a JSON API) that displays:

| Section | Description |
|---------|-------------|
| **Overall Status** | Green/Yellow/Red indicator with system state |
| **Service Status** | Health of API, Cache, External APIs, x402 Facilitator |
| **System Metrics** | Version, uptime, active sources, 24h article count |
| **API Endpoints** | Status of all major endpoints |
| **News Sources** | Top 10 sources with article counts and last update time |

**Use Cases:**
- Monitor service health before integrating
- Debug connectivity issues
- Verify sources are active
- Check system uptime

For programmatic health checks, use [GET /api/health](#get-apihealth) instead.

---

## Tags & Discovery

### GET /api/tags

Get all tags with categories for filtering news.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `slug` | string | - | Get a single tag by slug |
| `category` | string | - | Filter by category: `asset`, `topic`, `event`, `technology`, `entity`, `sentiment` |

**Example - Get all tags:**

```bash
curl "https://cryptocurrency.cv/api/tags"
```

**Response:**

```json
{
  "totalCount": 85,
  "categories": [
    { "name": "asset", "count": 25 },
    { "name": "topic", "count": 20 },
    { "name": "event", "count": 15 },
    { "name": "technology", "count": 12 },
    { "name": "entity", "count": 8 },
    { "name": "sentiment", "count": 5 }
  ],
  "tags": [
    {
      "slug": "bitcoin",
      "name": "Bitcoin",
      "icon": "₿",
      "category": "asset",
      "priority": 1,
      "url": "/tags/bitcoin"
    }
  ]
}
```

**Example - Get single tag:**

```bash
curl "https://cryptocurrency.cv/api/tags?slug=bitcoin"
```

**Response:**

```json
{
  "tag": {
    "slug": "bitcoin",
    "name": "Bitcoin",
    "icon": "₿",
    "category": "asset",
    "priority": 1
  },
  "url": "/tags/bitcoin"
}
```

**Cache:** 1 hour

---

### GET /api/tags/[slug]

Get detailed tag information with matching articles.

**Example:**

```bash
curl "https://cryptocurrency.cv/api/tags/bitcoin"
```

**Response:**

```json
{
  "tag": {
    "slug": "bitcoin",
    "name": "Bitcoin",
    "icon": "₿",
    "category": "asset",
    "priority": 1,
    "url": "/tags/bitcoin"
  },
  "articles": [
    {
      "title": "Bitcoin Hits $100K Milestone",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin reached a historic...",
      "source": "CoinDesk",
      "pubDate": "2026-01-22T10:00:00Z",
      "timeAgo": "2 hours ago"
    }
  ],
  "articleCount": 25,
  "relatedTags": [
    { "slug": "ethereum", "name": "Ethereum", "icon": "⟠", "url": "/tags/ethereum" }
  ],
  "structuredData": { "@context": "https://schema.org", ... },
  "meta": {
    "title": "Bitcoin Crypto News | Latest Bitcoin Updates",
    "description": "The original cryptocurrency...",
    "canonical": "/tags/bitcoin"
  }
}
```

**Cache:** 5 minutes

---

## Gateway & Integration

### POST /api/gateway

Unified gateway endpoint for calling multiple API functions. Useful for MCP integrations and ChatGPT plugins.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiName` | string | Yes | API function: `getLatestNews`, `searchNews`, `getDefiNews`, `getBitcoinNews`, `getBreakingNews`, `getSources` |
| `arguments` | string | No | JSON-encoded arguments |

**Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/gateway" \
  -H "Content-Type: application/json" \
  -d '{
    "apiName": "getLatestNews",
    "arguments": "{\"limit\": 5, \"source\": \"coindesk\"}"
  }'
```

**Supported API Names:**

| API Name | Arguments | Description |
|----------|-----------|-------------|
| `getLatestNews` | `limit`, `source` | Fetch latest news |
| `searchNews` | `keywords`, `limit` | Search news |
| `getDefiNews` | `limit` | DeFi news |
| `getBitcoinNews` | `limit` | Bitcoin news |
| `getBreakingNews` | `limit` | Breaking news |
| `getSources` | - | List sources |

---

## API Key Management

### GET /api/register

Get API key registration information and available tiers.

**Response:**

```json
{
  "endpoint": "/api/register",
  "method": "POST",
  "description": "Register for a free API key",
  "request": {
    "contentType": "application/json",
    "body": {
      "email": "string (required)",
      "name": "string (optional)"
    }
  },
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "requestsPerDay": 100,
      "features": ["Basic endpoints", "Rate limited"]
    },
    {
      "id": "pro",
      "name": "Pro",
      "requestsPerDay": 10000,
      "features": ["All endpoints", "Priority support"]
    }
  ],
  "notes": [
    "Free tier: 100 requests/day",
    "Maximum 3 keys per email"
  ]
}
```

---

### POST /api/register

Create a new API key or manage existing keys.

**Request Body (Create Key):**

```json
{
  "email": "user@example.com",
  "name": "My App Key"
}
```

**Response:**

```json
{
  "key": "cda_free_xxxxxxxxxxxx",
  "tier": "free",
  "rateLimit": "100 requests/day",
  "docs": "/docs/api",
  "message": "Save this key - it will only be shown once!"
}
```

**Request Body (List Keys):**

```json
{
  "action": "list",
  "email": "user@example.com"
}
```

**Request Body (Revoke Key):**

```json
{
  "action": "revoke",
  "email": "user@example.com",
  "keyId": "key_123456"
}
```

---

### GET /api/keys

List API keys (requires authentication).

**Headers:**

```
Authorization: Bearer <YOUR_TOKEN>
```

**Response:**

```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Key",
      "tier": "pro",
      "createdAt": "2026-01-15T00:00:00Z",
      "lastUsed": "2026-01-22T10:30:00Z",
      "usage": { "today": 450, "limit": 10000 }
    }
  ],
  "total": 1
}
```

---

### POST /api/keys

Create a new API key.

**Request Body:**

```json
{
  "name": "My New Key",
  "tier": "free"
}
```

**Response:**

```json
{
  "key": {
    "id": "key_xyz789",
    "key": "cda_free_xxxxxxxxxxxx",
    "name": "My New Key",
    "tier": "free",
    "rateLimit": {
      "requestsPerDay": 100,
      "remaining": 100
    },
    "createdAt": "2026-01-22T12:30:00Z"
  }
}
```

---

## Analytics Tracking

### GET /api/views

Get article view counts for popularity metrics.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ids` | string | - | Comma-separated article IDs (optional, returns all if not provided) |
| `limit` | integer | 50 | Maximum results (max: 100) |
| `sort` | string | views | Sort by: `views`, `recent` |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/views?limit=10&sort=views"
```

**Response:**

```json
{
  "views": [
    {
      "id": "article_abc123",
      "views": 1250,
      "views24h": 340,
      "views7d": 890
    }
  ],
  "total": 150,
  "fetchedAt": "2026-01-22T12:30:00Z"
}
```

---

### POST /api/views

Record a view for an article.

**Request Body:**

```json
{
  "articleId": "article_abc123"
}
```

**Response:**

```json
{
  "success": true,
  "articleId": "article_abc123",
  "totalViews": 1251
}
```

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
curl "https://cryptocurrency.cv/api/arbitrage?pairs=BTC,ETH&minSpread=1"
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

### POST /api/detect/ai-content

Detect AI-generated content using statistical and linguistic analysis. Works entirely offline - no external AI API required.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes* | Single text to analyze (min 100 chars) |
| `texts` | array | Yes* | Array of texts for batch analysis (max 50) |
| `quick` | boolean | No | Use quick mode for faster, less detailed results |

*One of `text` or `texts` is required.

**Single Text Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{"text": "In today'\''s fast-paced world of cryptocurrency, it'\''s important to note that markets are constantly evolving..."}'
```

**Batch Analysis Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["First article content...", "Second article content..."]}'
```

**Response (Full Mode):**

```json
{
  "mode": "full",
  "isLikelyAI": true,
  "confidence": 78,
  "humanScore": 22,
  "verdict": "likely_ai",
  "analysis": {
    "perplexity": {
      "score": 0.35,
      "ngramFrequency": 0.8,
      "unusualWordRatio": 0.05,
      "description": "Low perplexity suggests predictable text patterns"
    },
    "burstiness": {
      "score": 0.25,
      "sentenceLengthVariance": 12,
      "paragraphLengthVariance": 8,
      "rhythmScore": 0.3,
      "description": "Low burstiness indicates uniform sentence structure"
    },
    "vocabulary": {
      "typeTokenRatio": 0.45,
      "hapaxLegomena": 15,
      "richness": 0.4,
      "sophistication": 0.6,
      "description": "Average vocabulary diversity"
    },
    "stylometry": {
      "avgSentenceLength": 22.5,
      "avgWordLength": 5.2,
      "punctuationDensity": 0.08,
      "functionWordRatio": 0.55,
      "passiveVoiceRatio": 0.15,
      "description": "Typical AI writing patterns detected"
    },
    "patterns": {
      "repetitiveStructures": 3,
      "formulaicOpenings": 2,
      "listPatterns": 1,
      "transitionOveruse": 4,
      "description": "Multiple structural patterns typical of AI"
    },
    "phrases": {
      "aiPhrasesFound": ["in today's fast-paced world", "it's important to note"],
      "aiPhraseCount": 2,
      "hedgingLanguage": 0.15,
      "overlyFormalTone": 0.6,
      "description": "High-confidence AI phrases detected"
    }
  },
  "signals": [
    { "type": "phrase", "indicator": "in today's fast-paced world", "weight": 0.9, "confidence": 0.95 }
  ],
  "explanation": "Text shows multiple characteristics typical of AI generation including formulaic phrases and uniform structure.",
  "recommendations": ["Verify source attribution", "Check for original reporting"],
  "timestamp": "2026-01-22T10:30:00Z"
}
```

**Verdict Scale:**

| Verdict | Confidence | Description |
|---------|------------|-------------|
| `human` | 0-20% | Very likely human-written |
| `likely_human` | 20-40% | Probably human-written |
| `uncertain` | 40-60% | Cannot determine |
| `likely_ai` | 60-80% | Probably AI-generated |
| `ai` | 80-100% | Very likely AI-generated |

---

### GET /api/ai/agent

AI Market Intelligence Agent providing real-time market analysis with signal aggregation.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | full | Output format: `full`, `summary`, `signals`, `opportunities`, `risks` |

**Example:**

```bash
# Full market intelligence
curl "https://cryptocurrency.cv/api/ai/agent"

# Summary only
curl "https://cryptocurrency.cv/api/ai/agent?format=summary"

# Active signals
curl "https://cryptocurrency.cv/api/ai/agent?format=signals"
```

**Response (Full):**

```json
{
  "success": true,
  "data": {
    "overallRegime": "markup",
    "regimeConfidence": 75,
    "fearGreedIndex": 65,
    "volatilityRegime": "medium",
    "dominantNarrative": "ETF inflows driving institutional adoption",
    "activeSignals": [
      {
        "id": "sig_abc123",
        "source": "news",
        "type": "news-catalyst",
        "asset": "BTC",
        "direction": "bullish",
        "strength": "strong",
        "confidence": 85,
        "timeHorizon": "1d",
        "narrative": "ETF approval driving institutional demand"
      }
    ],
    "topOpportunities": [
      {
        "id": "opp_xyz789",
        "asset": "BTC",
        "type": "long",
        "rationale": "Strong momentum with institutional support",
        "entry": 98000,
        "targets": [105000, 110000],
        "stopLoss": 92000,
        "riskReward": 2.5,
        "confidence": 70
      }
    ],
    "riskAlerts": [
      {
        "id": "risk_def456",
        "severity": "warning",
        "type": "volatility-spike",
        "title": "Elevated volatility expected",
        "description": "Options expiry may cause price swings",
        "recommendation": "Consider reducing position sizes"
      }
    ],
    "marketNarrative": "Bitcoin continues its upward trajectory supported by strong ETF inflows...",
    "sectorRotation": [...],
    "correlationAnomalies": [...],
    "keyLevels": [...],
    "upcomingCatalysts": [...],
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

**Market Regimes:**

| Regime | Description |
|--------|-------------|
| `accumulation` | Smart money buying, price consolidating |
| `markup` | Trending up, momentum positive |
| `distribution` | Smart money selling, price topping |
| `markdown` | Trending down, momentum negative |
| `ranging` | Sideways, no clear direction |
| `capitulation` | Panic selling, potential bottom |
| `euphoria` | Extreme greed, potential top |

---

### POST /api/ai/agent

Query the AI Market Agent with natural language.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | Natural language question |
| `assets` | array | No | Focus on specific assets |
| `timeHorizon` | string | No | Time frame: 1h, 4h, 1d, 1w, 1m |
| `focusAreas` | array | No | Signal sources: news, social, on-chain, technical, derivatives |

**Example:**

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is driving Bitcoin price action today?",
    "assets": ["BTC"],
    "timeHorizon": "1d",
    "focusAreas": ["news", "technical"]
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Bitcoin is being driven by strong ETF inflows and positive regulatory sentiment...",
    "confidence": 0.85,
    "supportingSignals": [...],
    "suggestedActions": ["Monitor ETF flow data", "Watch $100k resistance level"],
    "relatedQueries": ["What are the key support levels?", "How is sentiment trending?"]
  }
}
```

---

### GET /api/narratives

AI-detected narrative clusters in crypto news.

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

## Intelligence APIs

### GET /api/analytics/anomalies

Detect unusual patterns in news flow including volume spikes, coordinated publishing, and sentiment shifts.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | 24 | Time window (1-168) |
| `severity` | string | - | Filter by: `high`, `medium`, `low` |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/analytics/anomalies?hours=12&severity=high"
```

**Response:**

```json
{
  "anomalies": [
    {
      "id": "anomaly_volume_spike_1737507600",
      "type": "volume_spike",
      "severity": "high",
      "detectedAt": "2026-01-22T10:00:00Z",
      "description": "Article volume 4.2 standard deviations above normal",
      "data": {
        "expected": 12,
        "actual": 45,
        "deviation": 4.2,
        "affectedEntities": ["BTC", "ETF"]
      },
      "possibleCauses": ["Breaking news event", "Coordinated release"]
    }
  ],
  "systemHealth": {
    "normalArticleRate": 8.5,
    "currentRate": 45,
    "activeSources": 11,
    "totalSources": 12
  },
  "summary": {
    "totalAnomalies": 3,
    "bySeverity": { "high": 1, "medium": 2, "low": 0 },
    "byType": { "volume_spike": 1, "sentiment_shift": 2 }
  },
  "generatedAt": "2026-01-22T10:30:00Z"
}
```

**Anomaly Types:**

| Type | Description |
|------|-------------|
| `volume_spike` | Article volume >3 std dev above normal |
| `coordinated_publishing` | Multiple sources publish similar content within 5 min |
| `sentiment_shift` | Market sentiment shifts >40% in 6 hours |
| `ticker_surge` | Ticker mentions spike 5x above baseline |
| `source_outage` | Source silent for >12 hours |
| `unusual_timing` | Publishing at unusual hours |

---

### GET /api/analytics/headlines

Track how article headlines change over time.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | 24 | Time window (1-168) |
| `changesOnly` | boolean | false | Only show articles with headline changes |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/analytics/headlines?changesOnly=true"
```

**Response:**

```json
{
  "tracked": [
    {
      "articleId": "art_abc123",
      "originalTitle": "Bitcoin Drops 5%",
      "currentTitle": "Bitcoin Recovers After 5% Dip",
      "changes": [
        {
          "title": "Bitcoin Recovers After 5% Dip",
          "detectedAt": "2026-01-22T12:00:00Z",
          "changeType": "moderate",
          "sentiment_shift": "more_positive"
        }
      ],
      "totalChanges": 1,
      "url": "https://coindesk.com/...",
      "source": "CoinDesk"
    }
  ],
  "recentChanges": [...],
  "stats": {
    "totalTracked": 150,
    "withChanges": 12,
    "avgChangesPerArticle": 0.08
  }
}
```

---

### GET /api/analytics/causality

Perform causal analysis between news events and market movements.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `eventId` | string | - | Specific event ID to analyze |
| `type` | string | - | Filter by event type |
| `asset` | string | - | Filter by asset |
| `limit` | integer | 50 | Number of events to return |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/analytics/causality?asset=BTC&limit=10"
```

**POST Request (Perform Analysis):**

```bash
curl -X POST "https://cryptocurrency.cv/api/analytics/causality" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "eventId": "caus_abc123",
    "assets": ["BTC"],
    "windowBefore": 24,
    "windowAfter": 48,
    "method": "event_study"
  }'
```

**Response:**

```json
{
  "eventId": "caus_abc123",
  "event": {
    "timestamp": "2026-01-22T09:00:00Z",
    "eventType": "regulatory",
    "description": "SEC approves spot Bitcoin ETF",
    "assets": ["BTC"]
  },
  "method": "event_study",
  "causalEffect": {
    "direction": "positive",
    "magnitude": 8.5,
    "absoluteChange": 8500,
    "peakEffect": 12.3,
    "peakTime": "2026-01-22T14:00:00Z",
    "halfLife": 6,
    "persistence": 72
  },
  "confidence": 0.92,
  "pValue": 0.003,
  "isSignificant": true,
  "metrics": {
    "preEventMean": 98000,
    "postEventMean": 106500,
    "cumulativeAbnormalReturn": 0.085,
    "tStatistic": 3.45
  }
}
```

**Analysis Methods:**

| Method | Description |
|--------|-------------|
| `granger` | Granger causality test |
| `diff_in_diff` | Difference-in-differences |
| `event_study` | Event study with abnormal returns |
| `synthetic_control` | Synthetic control method |
| `regression_discontinuity` | Regression discontinuity design |

---

### GET /api/analytics/credibility

Get credibility scores for news sources.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | - | Specific source to check |
| `sortBy` | string | score | Sort by: `score`, `accuracy`, `timeliness` |

**Example:**

```bash
curl "https://cryptocurrency.cv/api/analytics/credibility?sortBy=accuracy"
```

**Response:**

```json
{
  "sources": [
    {
      "sourceKey": "coindesk",
      "name": "CoinDesk",
      "credibilityScore": 92,
      "metrics": {
        "accuracy": 0.94,
        "timeliness": 0.88,
        "sourceDiversity": 0.85,
        "correctionRate": 0.02
      },
      "tier": "tier1",
      "totalArticles": 15230,
      "lastUpdated": "2026-01-22T10:00:00Z"
    }
  ],
  "stats": {
    "avgScore": 78,
    "tier1Count": 7,
    "tier2Count": 5,
    "tier3Count": 3
  }
}
```

---

### GET /api/predictions

Track and score user predictions with leaderboards.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | list | Action: `list`, `leaderboard`, `analytics` |
| `userId` | string | - | Get predictions for specific user |
| `asset` | string | - | Filter by asset |
| `status` | string | - | Filter by: `pending`, `correct`, `incorrect` |
| `limit` | integer | 50 | Number of predictions |

**Example:**

```bash
# Get leaderboard
curl "https://cryptocurrency.cv/api/predictions?action=leaderboard"

# Get user predictions
curl "https://cryptocurrency.cv/api/predictions?userId=user_123"
```

**POST Request (Create Prediction):**

```bash
curl -X POST "https://cryptocurrency.cv/api/predictions" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "type": "price_above",
    "asset": "BTC",
    "targetValue": 150000,
    "targetDate": "2026-06-01",
    "timeframe": "3m",
    "confidence": 75,
    "reasoning": "ETF inflows continue strong",
    "isPublic": true
  }'
```

**Prediction Types:**

| Type | Description |
|------|-------------|
| `price_above` | Price exceeds target by date |
| `price_below` | Price drops below target |
| `price_range` | Price stays within range |
| `percentage_up` | Asset increases by X% |
| `percentage_down` | Asset decreases by X% |
| `event` | Specific event occurs |
| `trend` | General trend prediction |
| `dominance` | Market dominance prediction |

---

### GET /api/influencers

Track influencer prediction reliability and accuracy.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `view` | string | - | Use `stats` for overall statistics |
| `sortBy` | string | reliability | Sort: `reliability`, `accuracy`, `returns`, `sharpe` |
| `limit` | integer | 50 | Number of influencers (max 100) |
| `minCalls` | integer | 0 | Minimum trading calls required |
| `platform` | string | - | Filter: `twitter`, `discord`, `telegram` |
| `ticker` | string | - | Filter by ticker expertise |

**Example:**

```bash
# Get top reliable influencers
curl "https://cryptocurrency.cv/api/influencers?sortBy=accuracy&minCalls=10"

# Get overall stats
curl "https://cryptocurrency.cv/api/influencers?view=stats"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "influencers": [
      {
        "id": "inf_abc123",
        "platform": "twitter",
        "username": "@cryptoexpert",
        "displayName": "Crypto Expert",
        "followers": 125000,
        "isVerified": true,
        "reliabilityScore": 85,
        "accuracyRate": 0.72,
        "avgReturn": 0.15,
        "sharpeRatio": 1.8,
        "maxDrawdown": -0.12,
        "totalPosts": 450,
        "postsWithCalls": 120,
        "topTickers": [
          { "ticker": "BTC", "calls": 45, "accuracy": 0.78, "avgReturn": 0.18 }
        ],
        "sentimentBias": 0.3,
        "overallRank": 5
      }
    ],
    "total": 150,
    "returned": 50
  }
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
  "https://cryptocurrency.cv/api/premium/..."
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
curl "https://cryptocurrency.cv/api/news?lang=ja-JP"
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

## TradingView UDF API

Universal Data Feed (UDF) protocol for TradingView charting integration.

### GET /api/tradingview

TradingView widget configuration and data.

| Action | Description |
|--------|-------------|
| `?action=config` | Server configuration |
| `?action=time` | Server time |
| `?action=symbols&symbol=BTC` | Symbol resolution |
| `?action=search&query=bitcoin` | Symbol search |
| `?action=history&symbol=BTC&from=...&to=...&resolution=D` | Historical OHLCV |
| `?action=quotes&symbols=BTC,ETH` | Real-time quotes |
| `?action=marks&symbol=BTC&from=...&to=...` | Chart marks (news) |

---

## Watchlist API

User watchlist management with local storage fallback.

### GET /api/watchlist

Get user's watchlist.

| Parameter | Description |
|-----------|-------------|
| `check` | Check if specific coin is watched |
| `prices` | Include current prices |

### POST /api/watchlist

Add coin to watchlist.

```json
{ "coinId": "bitcoin", "notes": "Long-term hold" }
```

### DELETE /api/watchlist

Remove coin from watchlist.

```json
{ "coinId": "bitcoin" }
```

---

## Billing API

Subscription and billing management (authenticated).

### GET /api/billing

Get current subscription status.

### POST /api/billing/subscribe

Create new subscription.

### POST /api/billing/cancel

Cancel subscription.

---

## SDKs

Official SDKs are available for quick integration:

- [Python SDK](sdks/python.md)
- [JavaScript SDK](sdks/javascript.md)
- [TypeScript SDK](sdks/typescript.md)
- [React Hooks](sdks/react.md)
- [Go SDK](sdks/go.md)
- [PHP SDK](sdks/php.md)

---

## Need Help?

- 📖 [Main Documentation](index.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
