# 📚 API 参考文档

Free Crypto News API 完整文档。所有接口**100% 免费**，无需 API 密钥。

**基础 URL：** `https://news-crypto.vercel.app`

---

## 目录

- [新闻接口](#新闻接口)
  - [GET /api/news](#get-apinews)
  - [GET /api/news/international](#get-apinewsinternational)
  - [POST /api/news/extract](#post-apinewsextract)
  - [GET /api/news/categories](#get-apinewscategories)
  - [GET /api/bitcoin](#get-apibitcoin)
  - [GET /api/defi](#get-apidefi)
  - [GET /api/breaking](#get-apibreaking)
  - [GET /api/search](#get-apisearch)
  - [GET /api/trending](#get-apitrending)
- [AI 智能接口](#ai-智能接口)
  - [GET /api/digest](#get-apidigest)
  - [GET /api/sentiment](#get-apisentiment)
  - [GET /api/summarize](#get-apisummarize)
  - [GET /api/ask](#get-apiask)
  - [POST /api/ai](#post-apiai)
  - [GET /api/ai/brief](#get-apiaibrief)
  - [POST /api/ai/debate](#post-apiaidebate)
  - [POST /api/ai/counter](#post-apiaicounter)
- [交易与市场 API](#交易与市场-api)
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
  - [GET /api/ai/agent](#get-apiaiagent)
  - [POST /api/ai/agent](#post-apiaiagent)
  - [GET /api/narratives](#get-apinarratives)
  - [GET /api/entities](#get-apientities)
  - [GET /api/claims](#get-apiclaims)
  - [GET /api/clickbait](#get-apiclickbait)
  - [GET /api/origins](#get-apiorigins)
  - [GET /api/relationships](#get-apirelationships)
- [研究与分析 API](#研究与分析-api)
  - [GET /api/regulatory](#get-apiregulatory)
  - [GET /api/predictions](#get-apipredictions)
  - [GET /api/influencers](#get-apiinfluencers)
  - [GET /api/academic](#get-apiacademic)
  - [GET /api/citations](#get-apicitations)
  - [GET /api/coverage-gap](#get-apicoverage-gap)
- [实时接口](#实时接口)
  - [GET /api/sse](#get-apisse)
  - [GET /api/ws](#get-apiws)
- [用户功能](#用户功能)
  - [POST /api/alerts](#post-apialerts)
  - [GET /api/alerts](#get-apialerts)
  - [POST /api/newsletter](#post-apinewsletter)
  - [POST /api/webhooks](#post-apiwebhooks)
- [工具接口](#工具接口)
  - [GET /api/health](#get-apihealth)
  - [GET /api/stats](#get-apistats)
  - [GET /api/cache](#get-apicache)
- [订阅源格式](#订阅源格式)
  - [GET /api/rss](#get-apirss)
  - [GET /api/atom](#get-apiatom)
  - [GET /api/opml](#get-apiopml)
- [通用参数](#通用参数)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [速率限制](#速率限制)

---

## 新闻接口

### GET /api/news

从所有 7 个来源获取聚合新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 10 | 文章数量 (1-100) |
| `source` | string | all | 按来源筛选 |
| `page` | integer | 1 | 分页页码 |
| `per_page` | integer | 10 | 每页文章数 |
| `from` | ISO date | - | 开始日期筛选 |
| `to` | ISO date | - | 结束日期筛选 |
| `lang` | string | en | 语言代码（支持18种语言） |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/news?limit=5&source=coindesk"
```

**响应：**

```json
{
  "articles": [
    {
      "title": "比特币突破 10 万美元",
      "link": "https://coindesk.com/...",
      "description": "比特币创下历史新高...",
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
  "lang": "zh-CN",
  "availableLanguages": ["en", "zh-CN", "ja-JP", "ko-KR", ...],
  "responseTime": "245ms"
}
```

---

### GET /api/news/international

获取国际加密货币新闻源，支持可选的英文翻译。

**支持的来源（18种语言，共75个来源）：**

| 语言 | 代码 | 来源数 | 示例 |
|------|------|--------|------|
| 中文 | zh | 10 | 8BTC、金色财经、Odaily、链闻、PANews、TechFlow、BlockBeats、火星财经、吴说区块链、Foresight News |
| 韩语 | ko | 9 | Block Media、TokenPost、CoinDesk Korea、Decenter、Cobak |
| 日语 | ja | 6 | CoinPost、CoinDesk Japan、Cointelegraph Japan、btcnews.jp |
| 葡萄牙语 | pt | 5 | Cointelegraph Brasil、Livecoins、Portal do Bitcoin |
| 西班牙语 | es | 5 | Cointelegraph Español、Diario Bitcoin、CriptoNoticias |
| 德语 | de | 4 | BTC-ECHO、Cointelegraph Deutsch、Coincierge |
| 法语 | fr | 4 | Journal du Coin、Cryptonaute、Cointelegraph France |

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `language` | string | all | 按语言筛选：`ko`、`zh`、`ja`、`es`、`pt`、`de`、`fr` 等 |
| `region` | string | all | 按地区筛选：`asia`、`europe`、`latam`、`mena`、`sea` |
| `translate` | boolean | false | 将标题/描述翻译成英文 |
| `limit` | integer | 20 | 文章数量 (1-100) |

**示例 - 获取中文新闻：**

```bash
curl "https://news-crypto.vercel.app/api/news/international?language=zh&limit=10"
```

---

### POST /api/news/extract

从 URL 提取完整文章内容，包括元数据。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `url` | string | 是 | 要提取的文章 URL |

**示例：**

```bash
curl -X POST "https://news-crypto.vercel.app/api/news/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://coindesk.com/article/..."}'
```

**响应：**

```json
{
  "url": "https://coindesk.com/article/...",
  "title": "比特币突破 10 万美元",
  "content": "比特币经历了历史性的上涨...",
  "author": "张三",
  "published_date": "2026-01-22T10:00:00Z",
  "word_count": 850,
  "reading_time_minutes": 4
}
```

---

### GET /api/bitcoin

比特币专题新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 10 | 文章数量 |
| `lang` | string | en | 语言代码 |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/bitcoin?limit=5"
```

---

### GET /api/defi

DeFi 和去中心化金融新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 10 | 文章数量 |
| `lang` | string | en | 语言代码 |

---

### GET /api/breaking

最新突发新闻（更高刷新率）。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 5 | 文章数量 |
| `lang` | string | en | 语言代码 |

**缓存：** 1 分钟（其他接口为 5 分钟）

---

### GET /api/search

按关键词搜索新闻。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `q` | string | **必填** | 搜索查询 |
| `limit` | integer | 10 | 结果数量 |
| `lang` | string | en | 语言代码 |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/search?q=ethereum+etf&limit=20"
```

---

### GET /api/trending

从近期新闻中提取的热门话题。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 10 | 话题数量 |

**响应：**

```json
{
  "topics": [
    {
      "topic": "比特币",
      "count": 45,
      "sentiment": "看涨",
      "recentHeadlines": [
        "比特币创新高",
        "机构买入加速"
      ]
    }
  ],
  "fetchedAt": "2026-01-22T12:30:00Z"
}
```

---

## AI 智能接口

> **注意：** AI 接口需要为自托管部署设置 `GROQ_API_KEY` 环境变量。

### GET /api/digest

AI 生成的每日新闻摘要。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `period` | string | 24h | 时间段：`6h`、`12h`、`24h` |
| `format` | string | full | 输出格式：`full`、`brief`、`newsletter` |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/digest?period=24h&format=full"
```

**响应：**

```json
{
  "headline": "比特币 ETF 获批引发历史性涨势",
  "tldr": "SEC 今日批准了首个现货比特币 ETF，引发 BTC 价格上涨 15%。随着主要银行宣布加密货币托管服务，机构采用正在加速。",
  "marketSentiment": {
    "overall": "看涨",
    "reasoning": "监管明确和机构采用推动积极情绪"
  },
  "sections": [
    {
      "title": "比特币与 ETF",
      "summary": "比特币的历史性一天...",
      "articles": ["https://..."]
    }
  ],
  "mustRead": [
    {
      "title": "SEC 批准现货比特币 ETF",
      "source": "CoinDesk",
      "why": "影响市场的监管决定"
    }
  ],
  "tickers": [
    { "symbol": "BTC", "mentions": 89, "sentiment": "看涨" },
    { "symbol": "ETH", "mentions": 45, "sentiment": "中性" }
  ]
}
```

---

### GET /api/sentiment

AI 驱动的新闻情绪分析。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | integer | 20 | 分析文章数量 |

**响应：**

```json
{
  "articles": [
    {
      "title": "比特币飙升 10%",
      "link": "...",
      "source": "CoinDesk",
      "sentiment": "非常看涨",
      "confidence": 95,
      "reasoning": "价格上涨伴随机构资金流入",
      "impactLevel": "高",
      "timeHorizon": "即时",
      "affectedAssets": ["BTC", "ETH"]
    }
  ],
  "market": {
    "overall": "看涨",
    "score": 65,
    "confidence": 82,
    "summary": "ETF 新闻推动强劲看涨势头",
    "keyDrivers": ["ETF 获批", "机构买入", "技术突破"]
  }
}
```

---

### GET /api/summarize

摘要特定文章。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | **必填** | 要摘要的文章 URL |

---

### GET /api/ask

询问有关近期加密新闻的问题。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `q` | string | **必填** | 自然语言问题 |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/ask?q=今天比特币发生了什么"
```

---

### POST /api/ai

统一的 AI 接口用于高级分析。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `action` | string | 是 | 操作类型：summarize、sentiment、facts、factcheck、questions、categorize、translate |
| `title` | string | 否 | 文章标题（提高准确性） |
| `content` | string | 是 | 要分析的文章内容 |
| `options.length` | string | 否 | 用于摘要：short、medium、long |
| `options.targetLanguage` | string | 否 | 用于翻译：目标语言 |

---

### POST /api/ai/debate

生成任何文章或话题的多空观点对比。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `article` | object | 否* | 要辩论的文章（`title` 和 `content`） |
| `topic` | string | 否* | 要辩论的话题 |

*需要 `article` 或 `topic` 中的至少一个。

**示例：**

```bash
curl -X POST "https://news-crypto.vercel.app/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "2026年比特币达到20万美元"}'
```

---

### POST /api/ai/counter

用结构化反驳论点挑战任何声明。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `claim` | string | 是 | 要挑战的声明 |
| `context` | string | 否 | 附加上下文 |

---

## 交易与市场 API

### GET /api/arbitrage

扫描跨交易所套利机会。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `pairs` | string | BTC,ETH | 逗号分隔的交易对 |
| `minSpread` | number | 0.5 | 最小价差百分比 |
| `exchanges` | string | all | 按交易所筛选 |

**响应：**

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

基于新闻情绪和市场数据的 AI 交易信号。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `asset` | string | BTC | 分析资产 |
| `timeframe` | string | 4h | 信号时间周期：1h、4h、1d |

**响应：**

```json
{
  "asset": "BTC",
  "signal": "买入",
  "confidence": 0.78,
  "factors": [
    { "type": "sentiment", "value": "看涨", "weight": 0.4 },
    { "type": "technical", "value": "突破", "weight": 0.3 },
    { "type": "onchain", "value": "积累", "weight": 0.3 }
  ],
  "priceTarget": 105000,
  "stopLoss": 94000,
  "riskReward": 2.1,
  "generatedAt": "2026-01-22T12:30:00Z"
}
```

---

### GET /api/funding

永续合约交易所资金费率。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `symbol` | string | BTCUSDT | 交易对 |
| `exchanges` | string | all | 筛选交易所 |

---

### GET /api/options

主要衍生品交易所的期权流向数据。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `asset` | string | BTC | 标的资产 |
| `exchange` | string | deribit | deribit、okx、bybit |
| `type` | string | all | call、put 或 all |

---

### GET /api/liquidations

实时和历史清算数据。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `symbol` | string | all | 交易对筛选 |
| `side` | string | all | long、short 或 all |
| `minValue` | number | 10000 | 最小美元价值 |
| `period` | string | 1h | 1h、4h、24h |

---

### GET /api/whale-alerts

大额区块链交易和巨鲸动向。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `asset` | string | all | BTC、ETH、USDT 等 |
| `minValue` | number | 1000000 | 最小美元价值 |
| `type` | string | all | transfer、exchange_in、exchange_out |

**响应：**

```json
{
  "alerts": [
    {
      "txHash": "abc123...",
      "asset": "BTC",
      "amount": 500,
      "valueUsd": 49500000,
      "from": "未知钱包",
      "to": "Coinbase",
      "type": "exchange_in",
      "timestamp": "2026-01-22T12:20:00Z",
      "sentiment": "看跌"
    }
  ],
  "hourlyFlow": {
    "exchangeInflow": 125000000,
    "exchangeOutflow": 95000000,
    "netFlow": "流入"
  }
}
```

---

### GET /api/orderbook

跨交易所聚合订单簿深度。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `symbol` | string | BTCUSDT | 交易对 |
| `depth` | number | 20 | 档位数 |
| `exchanges` | string | all | 逗号分隔的交易所 |

---

### GET /api/fear-greed

加密货币恐惧与贪婪指数。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `days` | number | 1 | 历史天数 (1-365) |

**响应：**

```json
{
  "value": 72,
  "classification": "贪婪",
  "previousClose": 68,
  "change": 4,
  "history": [
    { "date": "2026-01-21", "value": 68, "classification": "贪婪" }
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

## AI 分析 API

### POST /api/detect/ai-content

使用统计和语言分析检测 AI 生成的内容。完全离线工作 - 无需外部 AI API。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `text` | string | 是* | 要分析的单个文本（最少100个字符） |
| `texts` | array | 是* | 批量分析的文本数组（最多50个） |
| `quick` | boolean | 否 | 使用快速模式获得更快但不太详细的结果 |

*需要 `text` 或 `texts` 中的一个。

**判定等级：**

| 判定 | 置信度 | 描述 |
|------|--------|------|
| `human` | 0-20% | 很可能是人类撰写 |
| `likely_human` | 20-40% | 可能是人类撰写 |
| `uncertain` | 40-60% | 无法确定 |
| `likely_ai` | 60-80% | 可能是 AI 生成 |
| `ai` | 80-100% | 很可能是 AI 生成 |

---

### GET /api/ai/agent

AI 市场情报代理，提供实时市场分析和信号聚合。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `format` | string | full | 输出格式：`full`、`summary`、`signals`、`opportunities`、`risks` |

**市场阶段：**

| 阶段 | 描述 |
|------|------|
| `accumulation` | 聪明钱买入，价格盘整 |
| `markup` | 上涨趋势，动量为正 |
| `distribution` | 聪明钱卖出，价格见顶 |
| `markdown` | 下跌趋势，动量为负 |
| `ranging` | 横盘，无明确方向 |
| `capitulation` | 恐慌性抛售，可能触底 |
| `euphoria` | 极度贪婪，可能见顶 |

---

### GET /api/narratives

AI 检测的加密新闻叙事聚类。

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `period` | string | 24h | 时间窗口：6h、12h、24h、7d |
| `limit` | number | 10 | 叙事数量 |

---

### GET /api/entities

新闻文章中的命名实体识别。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | - | 要分析的文章 URL |
| `text` | string | - | 要分析的原始文本 |

---

### GET /api/claims

从文章中提取和验证声明。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | 必填 | 文章 URL |

---

### GET /api/clickbait

检测标题中的标题党和煽情内容。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `headline` | string | 必填 | 要分析的标题 |

---

### GET /api/origins

检测新闻故事的原始来源。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | 必填 | 文章 URL |

---

### GET /api/relationships

从文章中提取"谁做了什么"的关系。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | 必填 | 文章 URL |

---

## 实时接口

### GET /api/sse

用于实时新闻更新的服务器发送事件流。

**示例（JavaScript）：**

```javascript
const eventSource = new EventSource('/api/sse');

eventSource.addEventListener('news', (event) => {
  const data = JSON.parse(event.data);
  console.log('新文章:', data.articles);
});

eventSource.addEventListener('breaking', (event) => {
  const article = JSON.parse(event.data);
  alert(`突发: ${article.title}`);
});
```

**事件：**

| 事件 | 描述 |
|------|------|
| `connected` | 连接已建立 |
| `news` | 有新文章 |
| `breaking` | 突发新闻警报 |
| `price` | 价格更新 |
| `heartbeat` | 保活心跳 |

---

### GET /api/ws

WebSocket 连接信息（用于独立 WS 服务器）。

> 📖 查看 [实时指南](./REALTIME.md) 了解 WebSocket 服务器设置。

---

## 用户功能

### POST /api/alerts

创建可配置的警报规则。

**警报条件类型：**

| 类型 | 描述 |
|------|------|
| `price_above` | 价格超过阈值 |
| `price_below` | 价格跌破阈值 |
| `price_change_pct` | 1h 或 24h 百分比变化 |
| `volume_spike` | 成交量超过基准倍数 |
| `breaking_news` | 可选关键词的突发新闻 |
| `ticker_mention` | 可选情绪筛选的代币提及 |
| `whale_movement` | 超过美元阈值的大额转账 |
| `fear_greed_change` | 恐惧贪婪指数变化 |

---

### POST /api/newsletter

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

---

### POST /api/webhooks

注册 Webhook 以进行服务器到服务器通知。

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

---

## 归档接口

### GET /api/archive

查询历史归档新闻文章。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `date` | string | - | 特定日期 (YYYY-MM-DD) |
| `start` | string | - | 范围开始日期 |
| `end` | string | - | 范围结束日期 |
| `source` | string | - | 按来源筛选 |
| `ticker` | string | - | 按代币筛选（BTC、ETH 等） |
| `search` | string | - | 全文搜索 |
| `limit` | integer | 50 | 最大结果数 (1-200) |

---

### GET /api/archive/v2

查询带有高级筛选、情绪分析和代币追踪的增强版 V2 归档。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `start_date` | string | - | 开始日期 (YYYY-MM-DD) |
| `end_date` | string | - | 结束日期 (YYYY-MM-DD) |
| `ticker` | string | - | 按代币筛选 |
| `sentiment` | string | - | 筛选：`positive`、`negative`、`neutral` |
| `trending` | boolean | false | 返回热门代币 |

---

## 工具接口

### GET /api/health

全面的健康检查接口，包含来源状态和系统指标。

**响应：**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T12:30:00Z",
  "summary": {
    "healthy": 18,
    "degraded": 2,
    "down": 0,
    "total": 20
  },
  "system": {
    "cache": {
      "news": { "hits": 1250, "misses": 45, "backend": "memory" },
      "market": { "hits": 890, "misses": 23, "backend": "memory" },
      "ai": { "hits": 320, "misses": 12, "backend": "memory" }
    }
  }
}
```

---

### GET /api/stats

API 使用统计和详细指标。

---

### GET /api/cache

获取新闻、AI 和翻译缓存的缓存统计。

---

### DELETE /api/cache

清除所有缓存。

---

## 订阅源格式

### GET /api/rss

RSS 2.0 订阅源输出。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `feed` | string | all | 订阅源类型：`all`、`bitcoin`、`defi` |
| `limit` | integer | 20 | 条目数量 |

---

### GET /api/atom

Atom 订阅源输出。

---

### GET /api/opml

所有来源订阅源的 OPML 导出。

---

## 通用参数

### 语言支持

`lang` 参数支持 18 种语言：

| 代码 | 语言 |
|------|------|
| `en` | 英语（默认） |
| `zh-CN` | 简体中文 |
| `zh-TW` | 繁体中文 |
| `ja-JP` | 日语 |
| `ko-KR` | 韩语 |
| `es-ES` | 西班牙语 |
| `fr-FR` | 法语 |
| `de-DE` | 德语 |
| `pt-BR` | 葡萄牙语（巴西） |
| `ru-RU` | 俄语 |
| `ar` | 阿拉伯语 |
| `hi-IN` | 印地语 |
| `vi-VN` | 越南语 |
| `th-TH` | 泰语 |
| `id-ID` | 印尼语 |
| `tr-TR` | 土耳其语 |
| `nl-NL` | 荷兰语 |
| `pl-PL` | 波兰语 |

**示例：**

```bash
curl "https://news-crypto.vercel.app/api/news?lang=zh-CN"
```

---

## 响应格式

所有 JSON 响应包含：

```json
{
  "data": { ... },
  "fetchedAt": "2026-01-22T12:30:00Z",
  "responseTime": "245ms"
}
```

### HTTP 头部

| 头部 | 值 |
|------|------|
| `Content-Type` | `application/json` |
| `Cache-Control` | `public, s-maxage=300, stale-while-revalidate=600` |
| `Access-Control-Allow-Origin` | `*` |

---

## 错误处理

### 错误响应格式

```json
{
  "error": "错误类型",
  "message": "详细错误信息",
  "status": 400
}
```

### 常见错误

| 状态码 | 错误 | 描述 |
|--------|------|------|
| 400 | Bad Request | 无效参数 |
| 400 | Unsupported language | 不支持的语言代码 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 超出速率限制 |
| 500 | Internal Error | 服务器端错误 |
| 503 | Service Unavailable | 上游来源不可用 |

---

## 速率限制

公共 API 有宽松的速率限制：

| 层级 | 限制 |
|------|------|
| **公共** | 1000 请求/分钟 |
| **每 IP** | 100 请求/分钟 |
| **突发** | 50 请求/秒 |

### 速率限制头部

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706012400
```

### 最佳实践

1. **缓存响应** - 大多数接口有 5 分钟缓存
2. **使用分页** - 不要一次获取所有文章
3. **尊重缓存头部** - 重新获取前检查 `Cache-Control`
4. **优雅处理错误** - 实现指数退避

---

## SDK

官方 SDK 可供快速集成：

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
