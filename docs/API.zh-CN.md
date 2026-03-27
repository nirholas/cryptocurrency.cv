<!-- This file is auto-generated. Do not edit directly. -->
<!-- Language: Chinese (Simplified) (zh-CN) -->

# 📚 API 参考

Free Crypto News API 的完整文档。所有端点都是 **100% 免费** 的，无需 API 密钥。

**基础 URL：** `https://cryptocurrency.cv`

---

## 目录

- [新闻端点](#新闻端点)
  - [GET /api/news](#get-apinews)
  - [GET /api/news/international](#get-apinewsinternational)
  - [POST /api/news/extract](#post-apinewsextract)
  - [GET /api/news/categories](#get-apinewscategories)
  - [GET /api/bitcoin](#get-apibitcoin)
  - [GET /api/defi](#get-apidefi)
  - [GET /api/breaking](#get-apibreaking)
  - [GET /api/search](#get-apisearch)
  - [GET /api/trending](#get-apitrending)
- [AI 驱动端点](#ai-驱动端点)
  - [GET /api/digest](#get-apidigest)
  - [GET /api/sentiment](#get-apisentiment)
  - [GET /api/summarize](#get-apisummarize)
  - [GET /api/ask](#get-apiask)
  - [POST /api/ai](#post-apiai)
  - [GET /api/ai/brief](#get-apiaibrief)
  - [POST /api/ai/debate](#post-apiaidebate)
  - [POST /api/ai/counter](#post-apiaicounter)
- [交易和市场 API](#交易和市场-api)
  - [GET /api/arbitrage](#get-apiarbitrage)
  - [GET /api/signals](#get-apisignals)
  - [GET /api/funding](#get-apifunding)
  - [GET /api/options](#get-apioptions)
  - [GET /api/liquidations](#get-apiliquidations)
  - [GET /api/whale-alerts](#get-apiwhale-alerts)
  - [GET /api/orderbook](#get-apiorderbook)
  - [GET /api/fear-greed](#get-apifear-greed)
- [AI 分析 API](#ai-分析-api)
  - [POST /api/detect/ai-content](#post-apidetectai-content)
  - [GET /api/narratives](#get-apinarratives)
  - [GET /api/entities](#get-apientities)
  - [GET /api/claims](#get-apiclaims)
  - [GET /api/clickbait](#get-apiclickbait)
  - [GET /api/origins](#get-apiorigins)
  - [GET /api/relationships](#get-apirelationships)
- [研究和分析 API](#研究和分析-api)
  - [GET /api/regulatory](#get-apiregulatory)
  - [GET /api/predictions](#get-apipredictions)
  - [GET /api/influencers](#get-apiinfluencers)
  - [GET /api/academic](#get-apiacademic)
  - [GET /api/citations](#get-apicitations)
  - [GET /api/coverage-gap](#get-apicoverage-gap)
- [情报 API](#情报-api)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/causality](#get-apianalyticscausality)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
- [社交情报 API](#社交情报-api)
  - [GET /api/social](#get-apisocial)
  - [GET /api/social/x/sentiment](#get-apisocialxsentiment)
- [高级 API 端点](#高级-api-端点)
  - [GET /api/premium](#get-apipremium)
  - [GET /api/premium/ai/signals](#get-apipremiumaisignals)
  - [GET /api/premium/whales/transactions](#get-apipremiumwhalestransactions)
  - [GET /api/premium/screener/advanced](#get-apipremiumscreeneradvanced)
  - [GET /api/premium/smart-money](#get-apipremiumsmart-money)
- [投资组合 API](#投资组合-api)
  - [POST /api/portfolio](#post-apiportfolio)
  - [GET /api/portfolio/performance](#get-apiportfolioperformance)
  - [GET /api/portfolio/tax](#get-apiportfoliotax)
- [市场数据 API](#市场数据-api)
  - [GET /api/market/coins](#get-apimarketcoins)
  - [GET /api/market/ohlc/[coinId]](#get-apimarketohlccoinid)
  - [GET /api/market/exchanges](#get-apimarketexchanges)
  - [GET /api/market/derivatives](#get-apimarketderivatives)
- [DeFi API](#defi-api)
  - [GET /api/defi/protocol-health](#get-apidefiprotocol-health)
  - [GET /api/onchain/events](#get-apionchainevents)
- [实时端点](#实时端点)
  - [GET /api/sse](#get-apisse)
  - [GET /api/ws](#get-apiws)
- [用户功能](#用户功能)
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
- [存档端点](#存档端点)
  - [GET /api/archive](#get-apiarchive)
  - [GET /api/archive/v2](#get-apiarchivev2) (重定向)
  - [GET /api/archive/status](#get-apiarchivestatus)
  - [GET /api/cron/archive](#get-apicronarchive)
  - [POST /api/archive/webhook](#post-apiarchivewebhook)
- [分析和情报](#分析和情报)
  - [GET /api/analytics/headlines](#get-apianalyticsheadlines)
  - [GET /api/analytics/credibility](#get-apianalyticscredibility)
  - [GET /api/analytics/anomalies](#get-apianalyticsanomalies)
- [V1 API（遗产）](#v1-api-遗产)
- [存储和导出](#存储和导出)
  - [GET /api/storage/cas](#get-apistoragecas)
  - [GET /api/export](#get-apiexport)
  - [GET /api/export/jobs](#get-apiexportjobs)
  - [GET /api/exports](#get-apiexports)
  - [GET /api/exports/[id]](#get-apiexportsid)
- [Feed 格式](#feed-格式)
  - [GET /api/rss](#get-apirss)
  - [GET /api/atom](#get-apiatom)
  - [GET /api/opml](#get-apiopml)
- [实用端点](#实用端点)
  - [GET /api/health](#get-apihealth)
  - [GET /api/stats](#get-apistats)
  - [GET /api/cache](#get-apicache)
  - [DELETE /api/cache](#delete-apicache)
  - [GET /status](#get-status)
- [标签和发现](#标签和发现)
  - [GET /api/tags](#get-apitags)
  - [GET /api/tags/[slug]](#get-apitagsslug)
- [网关和集成](#网关和集成)
  - [POST /api/gateway](#post-apigateway)
- [API 密钥管理](#api-密钥管理)
  - [GET /api/register](#get-apiregister)
  - [POST /api/register](#post-apiregister)
  - [GET /api/keys](#get-apikeys)
  - [POST /api/keys](#post-apikeys)
- [分析跟踪](#分析跟踪)
  - [GET /api/views](#get-apiviews)
  - [POST /api/views](#post-apiviews)
- [常见参数](#常见参数)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [速率限制](#速率限制)

---

## 新闻端点

### GET /api/news

从所有 7 个来源获取聚合新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | 文章数量（1-100） |
| `source` | string | all | 按来源过滤 |
| `page` | integer | 1 | 分页 |
| `per_page` | integer | 10 | 每页文章数 |
| `from` | ISO 日期 | - | 开始日期过滤 |
| `to` | ISO 日期 | - | 结束日期过滤 |
| `lang` | string | en | 语言代码（支持 18 种语言） |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/news?limit=5&source=coindesk"
```

**响应：**

```json
{
  "articles": [
    {
      "title": "比特币突破 100K 美元",
      "link": "https://coindesk.com/...",
      "description": "比特币达到新的历史高点...",
      "pubDate": "2026-01-22T10:30:00Z",
      "source": "CoinDesk",
      "sourceKey": "coindesk",
      "category": "general",
      "timeAgo": "2 小时前"
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

从国际加密货币新闻来源获取新闻，支持翻译成英文。

**支持来源（共 18 种语言，75 个来源）：**

| 语言 | 代码 | 来源 | 示例 |
|----------|------|---------|----------|
| 中文 | zh | 10 | 8BTC, Jinse Finance, Odaily, ChainNews, PANews, TechFlow, BlockBeats, MarsBit, Wu Blockchain, Foresight News |
| 韩语 | ko | 9 | Block Media, TokenPost, CoinDesk Korea, Decenter, Cobak, The B.Chain, Upbit Blog |
| 日语 | ja | 6 | CoinPost, CoinDesk Japan, Cointelegraph Japan, btcnews.jp, Crypto Times Japan, CoinJinja |
| 葡萄牙语 | pt | 5 | Cointelegraph Brasil, Livecoins, Portal do Bitcoin, BeInCrypto Brasil |
| 印地语 | hi | 5 | CoinSwitch, CoinDCX, WazirX, ZebPay, Crypto News India |
| 西班牙语 | es | 5 | Cointelegraph Español, Diario Bitcoin, CriptoNoticias, BeInCrypto Español |
| 德语 | de | 4 | BTC-ECHO, Cointelegraph Deutsch, Coincierge, CryptoMonday |
| 法语 | fr | 4 | Journal du Coin, Cryptonaute, Cointelegraph France, Cryptoast |
| 波斯语 | fa | 4 | Arz Digital, Mihan Blockchain, Ramz Arz, Nobitex |
| 土耳其语 | tr | 3 | Cointelegraph Türkçe, Koin Medya, Coinsider |
| 俄语 | ru | 3 | ForkLog, Cointelegraph Russia, Bits.Media |
| 意大利语 | it | 3 | Cointelegraph Italia, The Cryptonomist, Criptovalute.it |
| 印度尼西亚语 | id | 3 | Cointelegraph Indonesia, Blockchain Media, Pintu Academy |
| 越南语 | vi | 2 | Tạp chí Bitcoin, Coin68 |
| 泰语 | th | 2 | Siam Blockchain, Bitcoin Addict Thailand |
| 波兰语 | pl | 2 | Kryptowaluty.pl, Bitcoin.pl |
| 荷兰语 | nl | 2 | Bitcoin Magazine NL, Crypto Insiders |
| 阿拉伯语 | ar | 2 | Cointelegraph Arabic, ArabiCrypto |

**地区：**
- `asia` - 韩语、中文、日语来源（30 个来源）
- `europe` - 德语、法语、俄语、土耳其语、意大利语、荷兰语、波兰语来源（23 个来源）
- `latam` - 西班牙语、葡萄牙语来源（10 个来源）
- `mena` - 阿拉伯语、波斯语来源（6 个来源）
- `sea` - 印度尼西亚语、越南语、泰语来源（7 个来源）

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `language` | string | all | 按语言过滤：`ko`、`zh`、`ja`、`es`、`pt`、`de`、`fr`、`ru`、`tr`、`it`、`id`、`nl`、`pl`、`vi`、`th`、`ar`、`hi`、`fa` 或 `all` |
| `region` | string | all | 按地区过滤：`asia`、`europe`、`latam`、`mena`、`sea` 或 `all` |
| `translate` | boolean | false | 将标题/描述翻译成英文 |
| `limit` | integer | 20 | 文章数量（1-100） |
| `sources` | boolean | false | 返回来源信息而不是文章 |

**示例 - 获取韩语新闻：**

```bash
curl "https://cryptocurrency.cv/api/news/international?language=ko&limit=10"
```

**示例 - 获取所有亚洲新闻并翻译：**

```bash
curl "https://cryptocurrency.cv/api/news/international?region=asia&translate=true"
```

**示例 - 获取来源信息：**

```bash
curl "https://cryptocurrency.cv/api/news/international?sources=true"
```

**响应：**

```json
{
  "articles": [
    {
      "id": "blockmedia-abc123",
      "title": "比特币价格上涨",
      "titleEnglish": "Bitcoin Price Rises",
      "description": "比特币达到新的高点...",
      "descriptionEnglish": "Bitcoin reaches new highs...",
      "link": "https://blockmedia.co.kr/...",
      "source": "Block Media",
      "sourceKey": "blockmedia",
      "language": "ko",
      "pubDate": "2026-01-22T10:30:00Z",
      "category": "general",
      "region": "asia",
      "timeAgo": "2 小时前"
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

**翻译说明：**
- 需要 `GROQ_API_KEY` 环境变量
- 翻译结果缓存 7 天
- 每秒最多 1 个翻译请求
- 原始文本始终与翻译结果一起保留

---

### POST /api/news/extract

从 URL 提取完整的文章内容，包括元数据。

**请求体：**

| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `url` | string | 是 | 文章 URL |

**示例：**

```bash
curl -X POST "https://cryptocurrency.cv/api/news/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://coindesk.com/article/..."}'
```

**响应：**

```json
{
  "url": "https://coindesk.com/article/...",
  "title": "比特币突破 100K 美元",
  "content": "比特币经历了历史性的突破...",
  "author": "Jane Doe",
  "published_date": "2026-01-22T10:00:00Z",
  "word_count": 850,
  "reading_time_minutes": 4
}
```

---

### GET /api/bitcoin

比特币特定新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | 文章数量 |
| `lang` | string | en | 语言代码 |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/bitcoin?limit=5"
```

---

### GET /api/defi

去中心化金融新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | 文章数量 |
| `lang` | string | en | 语言代码 |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/defi?limit=10"
```

---

### GET /api/breaking

最新的突发新闻（更新频率更高）。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `limit` | integer | 5 | 文章数量 |
| `lang` | string | en | 语言代码 |

**缓存：** 1 分钟（与其他端点的 5 分钟相比）

**示例：**

```bash
curl "https://cryptocurrency.cv/api/breaking"
```

---

### GET /api/search

按关键词搜索新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `q` | string | **必需** | 搜索查询 |
| `limit` | integer | 10 | 结果数量 |
| `lang` | string | en | 语言代码 |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/search?q=ethereum+etf&limit=20"
```

**响应包括：**

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

从最近的新闻中提取的热门话题。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | 话题数量 |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/trending"
```

**响应：**

```json
{
  "topics": [
    {
      "topic": "比特币",
      "count": 45,
      "sentiment": "看涨",
      "recentHeadlines": [
        "比特币突破 100K 美元",
        "机构买盘加速"
      ]
    },
    {
      "topic": "ETF",
      "count": 32,
      "sentiment": "看涨",
      "recentHeadlines": [...]
    }
  ],
  "fetchedAt": "2026-01-22T12:30:00Z"
}
```

---

## AI 驱动端点

> **注意：** AI 端点需要 `GROQ_API_KEY` 环境变量用于自托管部署。

### GET /api/digest

AI 生成的每日新闻摘要。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `period` | string | 24h | 时间段：`6h`、`12h`、`24h` |
| `format` | string | full | 输出格式：`full`、`brief`、`newsletter` |

**示例：**

```bash
curl "https://cryptocurrency.cv/api/digest?period=24h&format=full"
```

**响应：**
undefined
### POST /api/警报/[id]?action=test

测试触发警报（用于测试Webhooks）。

```bash
curl -X POST "https://cryptocurrency.cv/api/alerts/alert_123?action=test"
```

---

### POST /api/新闻通讯

订阅电子邮件摘要。

**请求体：**

```json
{
  "action": "subscribe",
  "email": "user@example.com",
  "frequency": "daily",
  "categories": ["bitcoin", "defi"]
}
```

**响应：**

```json
{
  "success": true,
  "message": "已发送验证电子邮件",
  "subscriptionId": "sub-xyz789"
}
```

---

### GET /api/新闻通讯

新闻通讯API信息和验证端点。

**查询参数：**

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `action` | string | `verify`、`unsubscribe` 或 `stats` |
| `token` | string | 验证/取消订阅令牌 |

**示例 - 验证订阅：**

```bash
curl "https://cryptocurrency.cv/api/newsletter?action=verify&token=xxx"
```

---

### POST /api/新闻通讯/subscribe

直接订阅端点，带有速率限制。

**请求体：**

```json
{
  "email": "user@example.com"
}
```

**响应：**

```json
{
  "success": true,
  "message": "订阅成功",
  "subscribed": true
}
```

**速率限制：** 每分钟每IP 5次尝试

---

### POST /api/投资组合

跟踪投资组合持仓并获取相关新闻。

**请求体：**

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

**获取投资组合价值：**

```bash
curl "https://cryptocurrency.cv/api/portfolio?id=portfolio-123"
```

**响应：**

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

注册Webhooks以接收服务器到服务器的通知。

**请求体：**

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

**响应：**

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

**Webhook有效载荷：**

```json
{
  "event": "news.breaking",
  "timestamp": "2026-01-22T10:00:00Z",
  "signature": "sha256=...",
  "data": {
    "article": {
      "title": "SEC批准比特币ETF",
      "link": "https://..."
    }
  }
}
```

---

### POST /api/webhooks/test

向注册的Webhook发送测试有效载荷（需要身份验证）。

**头部：**

```
X-API-Key: YOUR_API_KEY
```

**请求体：**

```json
{
  "webhookId": "wh-abc123"
}
```

**响应：**

```json
{
  "success": true,
  "message": "测试Webhook已投递",
  "webhookId": "wh-abc123",
  "statusCode": 200,
  "responseTime": 245
}
```

---

### GET /api/webhooks/queue

检查异步Webhook投递队列状态。

**响应：**

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

## 市场数据

### GET /api/来源

列出所有可用的新闻来源。

**示例：**

```bash
curl "https://cryptocurrency.cv/api/sources"
```

**响应：**

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

API使用统计和详细指标。

**响应：**

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
      "latestArticle": "比特币达到10万美元里程碑",
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

**缓存：** 5分钟

---

## 归档端点

历史新闻归档，**零配置**设置。不需要API密钥！

### GET /api/归档

查询历史归档新闻文章。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `date` | string | - | 特定日期（YYYY-MM-DD） |
| `start` | string | - | 日期范围开始 |
| `end` | string | - | 日期范围结束 |
| `source` | string | - | 按来源过滤 |
| `ticker` | string | - | 按ticker过滤（BTC、ETH等） |
| `search` | string | - | 全文搜索 |
| `limit` | integer | 50 | 最大结果数（1-200） |
| `offset` | integer | 0 | 分页偏移量 |
| `stats` | boolean | false | 仅返回统计数据 |
| `index` | boolean | false | 仅返回索引 |

**示例：**

```bash
# 获取特定日期的文章
curl "https://cryptocurrency.cv/api/archive?date=2026-01-15"

# 搜索比特币新闻，时间范围为上周
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&start=2026-01-17"

# 获取归档统计数据
curl "https://cryptocurrency.cv/api/archive?stats=true"
```

---

### GET /api/归档/状态

检查归档健康状况并获取设置说明。

**示例：**

```bash
curl "https://cryptocurrency.cv/api/archive/status"
```

**响应：**

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
      "description": "无需配置！",
      "testNow": "在浏览器中访问/api/cron/archive"
    },
    "cronJobOrg": {
      "url": "https://cron-job.org（免费）",
      "steps": ["..."]
    }
  }
}
```

---

### GET /api/归档/v2

查询增强的V2归档，具有高级过滤、情绪分析和ticker跟踪。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `start_date` | string | - | 开始日期（YYYY-MM-DD） |
| `end_date` | string | - | 结束日期（YYYY-MM-DD） |
| `source` | string | - | 按来源名称过滤 |
| `ticker` | string | - | 按ticker过滤（BTC、ETH等） |
| `q` | string | - | 搜索查询 |
| `sentiment` | string | - | 过滤：`positive`、`negative` 或 `neutral` |
| `tags` | string | - | 逗号分隔的标签过滤器 |
| `limit` | integer | 50 | 最大结果数（1-200） |
| `offset` | integer | 0 | 分页偏移量 |
| `format` | string | full | 响应格式：`full`、`simple` 或 `minimal` |
| `lang` | string | en | 语言代码用于翻译 |
| `stats` | boolean | false | 仅返回归档统计数据 |
| `trending` | boolean | false | 返回热门ticker |
| `hours` | integer | 24 | 热门ticker的小时数（与`trending=true`一起使用） |
| `market` | string | - | 获取特定月份的市场历史记录（YYYY-MM） |

**示例 - 获取增强文章：**

```bash
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&sentiment=positive&limit=20"
```

**示例 - 获取热门ticker：**

```bash
curl "https://cryptocurrency.cv/api/archive?trending=true&hours=24"
```

**响应（热门ticker）：**

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

**示例 - 获取归档统计数据：**

```bash
curl "https://cryptocurrency.cv/api/archive?stats=true"
```

**响应（统计数据）：**

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

### GET /api/cron/归档

触发新闻归档。适用于外部cron服务。

```bash
curl "https://cryptocurrency.cv/api/cron/archive"
```
undefined
undefined
undefined
undefined
undefined
undefined
| `?action=config` | 服务器配置 |
| `?action=time` | 服务器时间 |
| `?action=symbols&symbol=BTC` | 符号解析 |
| `?action=search&query=bitcoin` | 符号搜索 |
| `?action=history&symbol=BTC&from=...&to=...&resolution=D` | 历史OHLCV |
| `?action=quotes&symbols=BTC,ETH` | 实时报价 |
| `?action=marks&symbol=BTC&from=...&to=...` | 图表标记（新闻） |

---

## 观察列表 API

用户观察列表管理，具有本地存储回退。

### GET /api/watchlist

获取用户的观察列表。

| 参数 | 描述 |
|-----------|-------------|
| `check` | 检查特定币是否被观察 |
| `prices` | 包含当前价格 |

### POST /api/watchlist

将币添加到观察列表。

```json
{ "coinId": "bitcoin", "notes": "Long-term hold" }
```

### DELETE /api/watchlist

从观察列表中删除币。

```json
{ "coinId": "bitcoin" }
```

---

## 计费 API

订阅和计费管理（需要身份验证）。

### GET /api/billing

获取当前订阅状态。

### POST /api/billing/subscribe

创建新订阅。

### POST /api/billing/cancel

取消订阅。

---

## SDKs

官方SDK可用于快速集成：

- [Python SDK](sdks/python.md)
- [JavaScript SDK](sdks/javascript.md)
- [TypeScript SDK](sdks/typescript.md)
- [React Hooks](sdks/react.md)
- [Go SDK](sdks/go.md)
- [PHP SDK](sdks/php.md)

---

## 需要帮助？

- 📖 [主文档](index.md)
- 💬 [GitHub 讨论](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [报告问题](https://github.com/nirholas/free-crypto-news/issues)