# API Endpoints

> The complete endpoint list (394 routes) grouped by area, the JSON response format, and worked examples for the AI endpoints. The interactive version lives at https://cryptocurrency.cv/developers and the narrative reference is [docs/API.md](../API.md).
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## Endpoints

| Endpoint                            | Description                            |
| ----------------------------------- | -------------------------------------- |
| `/api/news`                         | Latest from all sources                |
| `/api/news?category=institutional`  | Filter by category                     |
| `/api/news/categories`              | List all categories                    |
| `/api/news/international`           | International sources with translation |
| `/api/search?q=bitcoin`             | Search by keywords                     |
| `/api/defi`                         | DeFi-specific news                     |
| `/api/bitcoin`                      | Bitcoin-specific news                  |
| `/api/breaking`                     | Last 2 hours only                      |
| `/api/trending`                     | Trending topics with sentiment         |
| `/api/tags`                         | Tag discovery and filtering            |
| `/api/archive`                      | Historical news archive                |
| `/api/archive/status`               | Archive health status                  |
| `/api/rss`                          | RSS 2.0 feed                           |
| `/api/atom`                         | Atom feed                              |
| `/api/opml`                         | OPML export for RSS readers            |
| `/api/health`                       | API health check                       |
| `/api/cache`                        | Cache statistics                       |
| `/api/stats`                        | API usage statistics                   |
| `/api/webhooks`                     | Webhook registration                   |
| `/api/push`                         | Web Push notifications                 |
| `/api/newsletter`                   | Newsletter subscription                |
| `/api/alerts`                       | Configurable alert rules               |
| `/api/sse`                          | Server-Sent Events stream              |
| `/api/ws`                           | WebSocket connection info              |
| `/api/export`                       | Data export (JSON, CSV, Parquet)       |
| `/api/exports`                      | Bulk export job management             |
| `/api/storage/cas`                  | Content-addressable storage            |
| `/api/views`                        | Article view tracking                  |
| `/api/register`                     | API key registration                   |
| `/api/keys`                         | API key management                     |
| `/api/gateway`                      | Unified API gateway for integrations   |
| `/api/docs`                         | Interactive Swagger UI documentation   |
| `/api/openapi.json`                 | OpenAPI 3.1 specification              |
| `/api/v1/`                          | Legacy v1 API endpoints                |
| `/api/market/orderbook`             | Order book depth for trading pairs     |
| `/api/social`                       | Aggregated social media trends         |
| `/api/social/monitor`               | Real-time social monitoring            |
| `/api/premium/streams/orderbook`    | Real-time order book stream            |
| `/api/premium/streams/liquidations` | Real-time liquidation stream           |
| `/api/premium/export/history`       | Historical data export                 |
| `/api/cron/archive`                 | Archive maintenance (cron job)         |
| `/api/cron/social`                  | Social data collection (cron job)      |
| `/api/cron/feeds`                   | Feed health monitoring (cron job)      |
| `/api/market/orderbook`             | Order book depth for trading pairs     |
| `/api/social`                       | Aggregated social media trends         |
| `/api/social/monitor`               | Real-time social monitoring            |
| `/api/premium/streams/orderbook`    | Real-time order book stream            |
| `/api/premium/streams/liquidations` | Real-time liquidation stream           |
| `/api/premium/export/history`       | Historical data export                 |
| `/api/cron/archive`                 | Archive maintenance (cron job)         |
| `/api/cron/social`                  | Social data collection (cron job)      |
| `/api/cron/feeds`                   | Feed health monitoring (cron job)      |

### 📂 Category Filter

Filter news by specialized categories:

```bash
# Get institutional/VC research
curl "https://cryptocurrency.cv/api/news?category=institutional"

# Get on-chain analytics news
curl "https://cryptocurrency.cv/api/news?category=onchain"

# Get ETF and asset manager news
curl "https://cryptocurrency.cv/api/news?category=etf"

# Get macro economic analysis
curl "https://cryptocurrency.cv/api/news?category=macro"

# Get quantitative research
curl "https://cryptocurrency.cv/api/news?category=quant"

# List all available categories
curl "https://cryptocurrency.cv/api/news/categories"
```

Available categories: `general`, `bitcoin`, `defi`, `nft`, `research`, `institutional`, `etf`, `derivatives`, `onchain`, `fintech`, `macro`, `quant`, `journalism`, `ethereum`, `asia`, `tradfi`, `mainstream`, `mining`, `gaming`, `altl1`, `stablecoin`

### 🌍 API Translation (18 Languages)

All news endpoints support real-time translation via the `?lang=` parameter:

```bash
# Get news in Spanish
curl "https://cryptocurrency.cv/api/news?lang=es"

# Get breaking news in Japanese
curl "https://cryptocurrency.cv/api/breaking?lang=ja"

# Get DeFi news in Arabic
curl "https://cryptocurrency.cv/api/defi?lang=ar"

# Get Bitcoin news in Chinese (Simplified)
curl "https://cryptocurrency.cv/api/bitcoin?lang=zh-CN"
```

**Supported Languages:** `en`, `es`, `fr`, `de`, `pt`, `ja`, `zh-CN`, `zh-TW`, `ko`, `ar`, `ru`, `it`, `nl`, `pl`, `tr`, `vi`, `th`, `id`

**Requirements:**

- Set `GROQ_API_KEY` environment variable (FREE at [console.groq.com/keys](https://console.groq.com/keys))
- Translation is auto-enabled when `GROQ_API_KEY` is set

**Endpoints with Translation Support:**
| Endpoint | `?lang=` Support |
|----------|------------------|
| `/api/news` | ✅ |
| `/api/breaking` | ✅ |
| `/api/defi` | ✅ |
| `/api/bitcoin` | ✅ |
| `/api/archive` | ✅ |
| `/api/archive/v2` | ✅ (redirects to /api/archive) |
| `/api/trending` | Trending topics with sentiment |
| `/api/analyze` | News with topic classification |
| `/api/stats` | Analytics & statistics |
| `/api/sources` | List all sources |
| `/api/health` | API & feed health status |
| `/status` | System status dashboard (UI) |
| `/api/rss` | Aggregated RSS feed |
| `/api/atom` | Aggregated Atom feed |
| `/api/opml` | OPML export for RSS readers |
| `/api/docs` | Interactive API documentation |
| `/api/webhooks` | Webhook registration |
| `/api/archive` | Historical news archive |
| `/api/push` | Web Push notifications |
| `/api/origins` | Find original news sources |
| `/api/portfolio` | Portfolio-based news + prices |
| `/api/news/international` | International sources with translation |

### 🤖 AI-Powered Endpoints (FREE via Groq)

| Endpoint                 | Description                                                                                                                                    | Provider |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `/api/ai`                | Unified AI endpoint (7 actions)                                                                                                                | All      |
| `/api/summarize`         | AI summaries with style options (brief/detailed/bullet/eli5/technical)                                                                         | Groq     |
| `/api/ask?q=...`         | Ask questions about crypto news                                                                                                                | Groq     |
| `/api/digest`            | AI-generated news digest (6h/12h/24h periods)                                                                                                  | Groq     |
| `/api/sentiment`         | Deep sentiment analysis with confidence scores                                                                                                 | Groq     |
| `/api/entities`          | Extract entities (7 types: ticker/person/company/protocol/exchange/regulator/event)                                                            | Groq     |
| `/api/narratives`        | Identify market narratives with strength scoring                                                                                               | Groq     |
| `/api/factcheck`         | Extract & verify claims (verified/likely/unverified/disputed)                                                                                  | Groq     |
| `/api/clickbait`         | Detect clickbait with scoring (0-100) and rewritten titles                                                                                     | Groq     |
| `/api/classify`          | Event classification (13 types: funding/hack/regulation/launch/partnership/listing/airdrop/upgrade/legal/market/executive/acquisition/general) | All      |
| `/api/claims`            | Claim extraction with attribution (fact/opinion/prediction/announcement)                                                                       | All      |
| `/api/ai/brief`          | Daily brief with executive summary & market overview                                                                                           | All      |
| `/api/ai/counter`        | Counter-arguments with strength scoring                                                                                                        | All      |
| `/api/ai/debate`         | Bull vs Bear debate generation                                                                                                                 | All      |
| `/api/ai/oracle`         | The Oracle - natural language crypto intelligence chat                                                                                         | Groq     |
| `/api/ai/summarize`      | Enterprise summarization with compression ratio                                                                                                | Groq     |
| `/api/ai/entities`       | Enterprise entity extraction with graph support                                                                                                | Groq     |
| `/api/ai/relationships`  | Relationship extraction (11 types) with clustering                                                                                             | Groq     |
| `/api/ai/synthesize`     | Auto-cluster duplicate articles into comprehensive summaries                                                                                   | Groq     |
| `/api/ai/explain`        | AI explains why any topic is trending with full context                                                                                        | Groq     |
| `/api/ai/portfolio-news` | Score news by relevance to your portfolio holdings                                                                                             | Groq     |
| `/api/ai/correlation`    | Detect correlations between news and price movements                                                                                           | Groq     |
| `/api/ai/flash-briefing` | Ultra-short AI summaries for voice assistants                                                                                                  | Groq     |
| `/api/ai/narratives`     | Track crypto narratives through lifecycle phases (emerging/growing/peak/declining)                                                             | Groq     |
| `/api/ai/cross-lingual`  | Regional sentiment divergence & alpha signal detection                                                                                         | Groq     |
| `/api/ai/source-quality` | AI-powered source scoring & clickbait detection                                                                                                | Groq     |
| `/api/ai/research`       | Deep-dive research reports on any crypto topic                                                                                                 | Groq     |
| `/api/detect/ai-content` | AI-generated content detection (offline, no API needed)                                                                                        | None     |
| `/api/i18n/translate`    | Article translation (18 languages)                                                                                                             | Groq     |

**Supported AI Providers (priority order):**

1. **OpenAI** - `OPENAI_API_KEY`, model via `OPENAI_MODEL` (falls back to `gpt-4o`)
2. **Anthropic** - `ANTHROPIC_API_KEY`, model via `ANTHROPIC_MODEL` (falls back to `claude-3-5-sonnet-20241022`)
3. **Groq** - `GROQ_API_KEY`, model via `GROQ_MODEL` (falls back to `qwen/qwen3.8-27b`) ⭐ FREE
4. **OpenRouter** - `OPENROUTER_API_KEY`, model via `OPENROUTER_MODEL` (falls back to `meta-llama/llama-3.3-70b-instruct`)
5. **Gemini** - `GEMINI_API_KEY`, model via `GEMINI_MODEL` (falls back to `gemini-2.0-flash`)

Model names are configuration, not constants: they all live in
`src/lib/ai-models.ts` and are overridable per deployment. Groq additionally
walks a fallback chain when a model is decommissioned mid-flight.

### 🧠 RAG System (Retrieval-Augmented Generation)

Production-grade question answering over crypto news using vector search + LLMs.

```typescript
import { askUltimate, askFast, searchNews } from '@/lib/rag';

// Ask natural language questions
const answer = await askUltimate("What happened to Bitcoin after the ETF approval?");
// Returns: answer + sources + confidence score + suggested follow-ups

// Fast mode for quick queries  
const quick = await askFast("BTC price news");

// Search documents
const results = await searchNews("Ethereum merge", { currencies: ['ETH'] });
```

**RAG Capabilities:**

| Feature | Description |
|---------|-------------|
| **Hybrid Search** | BM25 + semantic vector search with RRF fusion |
| **Query Routing** | Intelligent strategy selection (semantic/keyword/temporal/agentic) |
| **Advanced Reranking** | LLM reranking + time decay + source credibility + MMR diversity |
| **Self-RAG** | Adaptive retrieval with hallucination detection |
| **Contextual Compression** | Extract key facts, reduce context to relevant content |
| **Answer Attribution** | Inline citations `[1]`, `[2]` with source quotes |
| **Confidence Scoring** | Multi-dimensional quality assessment (high/medium/low) |
| **Conversation Memory** | Multi-turn context for follow-up questions |
| **Suggested Questions** | AI-generated follow-up questions |
| **Related Articles** | Content discovery based on context |

**Service Modes:**

| Mode | Function | Speed | Use Case |
|------|----------|-------|----------|
| Fast | `askFast()` | ~220ms | Quick queries, high volume |
| Balanced | `askUltimate()` | ~520ms | Most use cases (recommended) |
| Complete | `askComplete()` | ~850ms | Maximum quality, all features |

**Example Response:**

```json
{
  "answer": "Bitcoin rose 10% [1] after the SEC approved spot ETFs [2]...",
  "sources": [
    { "title": "Bitcoin Surges Post-ETF", "source": "CoinDesk", "url": "..." }
  ],
  "confidence": { "overall": 0.87, "level": "high" },
  "suggestedQuestions": [
    { "question": "How did other cryptocurrencies react?", "type": "expansion" }
  ],
  "citations": {
    "claims": [{ "claim": "Bitcoin rose 10%", "sourceIndex": 1 }]
  }
}
```

📖 **Full RAG documentation:** [docs/RAG.md](../RAG.md) | **Roadmap:** [docs/RAG-ROADMAP.md](../RAG-ROADMAP.md)

### 📊 Analytics & Intelligence

| Endpoint                     | Description                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/api/analytics/anomalies`   | Detect unusual patterns (volume spikes/coordinated publishing/sentiment shifts/ticker surges/source outages) |
| `/api/analytics/credibility` | Source credibility scoring with accuracy/timeliness metrics                                                  |
| `/api/analytics/headlines`   | Headline mutation tracking with sentiment shift detection                                                    |
| `/api/analytics/causality`   | Causal inference (Granger/diff-in-diff/event study methods)                                                  |
| `/api/regulatory`            | Multi-jurisdictional regulatory tracking (15 jurisdictions, 30+ agencies)                                    |
| `/api/influencers`           | Influencer reliability scoring with accuracy rates                                                           |
| `/api/predictions`           | Prediction tracking with outcome resolution & leaderboards                                                   |
| `/api/citations`             | Academic citation network with bibliometric metrics                                                          |

### 🔗 Relationship & Entity Analysis

| Endpoint              | Description                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/relationships`  | Extract entity relationships (11 types: partnership/competition/investment/acquisition/collaboration/conflict/regulation/development/market_impact/mention/association) |
| `/api/predictions`    | Prediction registry with timestamped predictions & accuracy scoring                                                                                                     |
| `/api/onchain/events` | Link news to on-chain events                                                                                                                                            |

### 💼 Portfolio Tools

| Endpoint                     | Description                           |
| ---------------------------- | ------------------------------------- |
| `/api/portfolio`             | Portfolio-based news + prices         |
| `/api/portfolio/performance` | Performance charts, P&L, risk metrics |
| `/api/portfolio/tax`         | Tax report generation (Form 8949)     |

### � Research & Backtesting

| Endpoint                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `/api/research/backtest` | Strategy backtesting with historical news data |
| `/api/academic`          | Academic access program registration           |
| `/api/citations`         | Academic citation network analysis             |
| `/api/predictions`       | Prediction tracking with accuracy scoring      |

**Backtest Example:**

```bash
# Backtest a sentiment-based strategy
curl -X POST "https://fcn.dev/api/research/backtest" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "sentiment_momentum", "asset": "BTC", "period": "1y"}'
```

### 📡 Social Monitoring

| Endpoint                       | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `/api/social/monitor`          | Discord & Telegram channel monitoring via webhooks |
| `/api/social/influencer-score` | Influencer reliability scoring                     |

**Social Monitor Example:**

```bash
# Ingest messages via webhook integration
curl -X POST "https://fcn.dev/api/social/monitor" \
  -H "Content-Type: application/json" \
  -d '{"platform": "discord", "channel": "alpha-chat", "content": "BTC bullish"}'
```

### 🗄️ Data Storage & Export

| Endpoint            | Description                                      |
| ------------------- | ------------------------------------------------ |
| `/api/storage/cas`  | Content-addressable storage (IPFS-style hashing) |
| `/api/export`       | Export data in CSV/JSON/Parquet formats          |
| `/api/exports`      | Bulk export job management                       |
| `/api/exports/[id]` | Download export file                             |

### �🔔 Real-Time & Infrastructure

| Endpoint                    | Description                                  |
| --------------------------- | -------------------------------------------- |
| `/api/sse`                  | Server-Sent Events for real-time news stream |
| `/api/ws`                   | WebSocket connection info & SSE fallback     |
| `/api/webhooks`             | Webhook registration & management            |
| `/api/push`                 | Web Push notification registration           |
| `/api/newsletter/subscribe` | Newsletter subscription                      |
| `/api/alerts`               | Price & news alerts                          |
| `/api/cache`                | Cache management                             |
| `/api/views`                | Article view tracking                        |
| `/api/keys`                 | API key management                           |
| `/api/gateway`              | Unified API gateway                          |
| `/api/billing`              | Subscription & billing management            |
| `/api/billing/usage`        | Current billing usage                        |
| `/api/upgrade`              | API key tier upgrades (x402)                 |
| `/api/register`             | User registration                            |

**SSE Real-Time Stream:**

```javascript
const events = new EventSource("/api/sse?sources=coindesk,theblock");
events.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 🐦 Social Intelligence

| Endpoint                  | Description                              |
| ------------------------- | ---------------------------------------- |
| `/api/social/discord`     | Discord channel monitoring               |
| `/api/social/x/lists`     | Manage X/Twitter influencer lists        |
| `/api/social/x/sentiment` | X sentiment from custom influencer lists |

### 🐦 X/Twitter Sentiment (No API Key!)

Automated X/Twitter sentiment analysis without paid API:

```bash
# Get sentiment from default crypto influencers
curl https://fcn.dev/api/social/x/sentiment

# Create custom influencer list
curl -X POST https://fcn.dev/api/social/x/lists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ETH Builders",
    "users": [
      {"username": "VitalikButerin", "category": "founder", "weight": 0.9},
      {"username": "sassal0x", "category": "influencer", "weight": 0.8}
    ]
  }'

# Get sentiment from your list
curl https://fcn.dev/api/social/x/sentiment?list=list_xxx
```

**Features:**

- ✅ **No API key required** - Uses Nitter RSS feeds
- ✅ **Automated cron** - Updates every 30 minutes
- ✅ **Custom lists** - Track your own influencers
- ✅ **AI analysis** - Groq-powered sentiment scoring
- ✅ **Webhook alerts** - Discord/Slack/Telegram notifications

### 📈 Market Data

| Endpoint                        | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `/api/market/coins`             | List all coins with market data               |
| `/api/market/trending`          | Trending cryptocurrencies                     |
| `/api/market/categories`        | Market categories                             |
| `/api/market/exchanges`         | Exchange listings                             |
| `/api/market/search`            | Search coins                                  |
| `/api/market/compare`           | Compare multiple coins                        |
| `/api/market/history/[coinId]`  | Historical price data                         |
| `/api/market/ohlc/[coinId]`     | OHLC candlestick data                         |
| `/api/market/snapshot/[coinId]` | Real-time coin snapshot                       |
| `/api/market/social/[coinId]`   | Social metrics for coin                       |
| `/api/market/tickers/[coinId]`  | Trading pairs for coin                        |
| `/api/market/defi`              | DeFi market overview                          |
| `/api/market/derivatives`       | Derivatives market data                       |
| `/api/charts`                   | Chart data for visualizations                 |
| `/api/fear-greed`               | Crypto Fear & Greed Index with 30-day history |

### 🏗️ DeFi Tools

| Endpoint                                     | Description                     |
| -------------------------------------------- | ------------------------------- |
| `/api/defi`                                  | DeFi news and protocol coverage |
| `/api/defi/protocol-health`                  | Protocol health & risk scoring  |
| `/api/defi/protocol-health?action=ranking`   | Protocol safety rankings        |
| `/api/defi/protocol-health?action=incidents` | Security incident tracker       |

**Protocol Health Example:**

```bash
# Get AAVE v3 health score
curl "https://fcn.dev/api/defi/protocol-health?protocol=aave-v3"

# Get top lending protocols by safety
curl "https://fcn.dev/api/defi/protocol-health?action=ranking&category=lending"

# Get recent security incidents
curl "https://fcn.dev/api/defi/protocol-health?action=incidents&limit=20"
```

### 📺 Integrations

| Endpoint                        | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `/api/integrations/tradingview` | TradingView widgets & Pine Script generation |
| `/api/tradingview`              | TradingView webhook receiver                 |

**TradingView Example:**

```bash
# Get chart widget embed code
curl "https://fcn.dev/api/integrations/tradingview?action=widget&type=chart&symbol=BTC"

# Generate Pine Script indicator
curl "https://fcn.dev/api/integrations/tradingview?action=indicator&name=newsAlert"
```

### 📊 Trading Tools

| Endpoint                 | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `/api/arbitrage`         | Cross-exchange arbitrage scanner with triangular arb       |
| `/api/trading/arbitrage` | Real-time arbitrage opportunities (spot + triangular)      |
| `/api/funding`           | Funding rate dashboard (Binance, Bybit, OKX, Hyperliquid)  |
| `/api/options`           | Options flow, volatility surface, max pain, gamma exposure |
| `/api/trading/options`   | Options dashboard from Deribit, OKX, Bybit                 |
| `/api/liquidations`      | Real-time liquidations feed (CoinGlass integration)        |
| `/api/orderbook`         | Multi-exchange order book aggregation                      |
| `/api/trading/orderbook` | Aggregated orderbook with slippage & liquidity analysis    |

**Supported Exchanges:**

- **Arbitrage:** Binance, Bybit, OKX, Kraken, Coinbase, KuCoin
- **Options:** Deribit, OKX, Bybit
- **Order Book:** Binance, Bybit, OKX, Kraken, Coinbase (aggregated)
- **Funding Rates:** Binance, Bybit, OKX, Hyperliquid

**Arbitrage Features:**

- Cross-exchange spot arbitrage
- Triangular arbitrage detection
- Real-time spread monitoring
- Profit estimation with fees
- Volume analysis

**Options Analytics:**

- Unusual options activity detection
- Volatility surface visualization
- Max pain analysis
- Gamma exposure tracking
- Block trade monitoring

**Order Book Analysis:**

- Multi-exchange aggregation
- Slippage estimation for orders
- Liquidity depth visualization
- Order book imbalance detection
- Support/resistance levels

**Supported Exchanges:**

- **Arbitrage:** Binance, Bybit, OKX, Kraken, Coinbase, KuCoin
- **Options:** Deribit, OKX, Bybit
- **Order Book:** Binance, Bybit, OKX, Kraken, Coinbase (aggregated)
- **Funding Rates:** Binance, Bybit, OKX, Hyperliquid

**Arbitrage Features:**

- Cross-exchange spot arbitrage
- Triangular arbitrage detection
- Real-time spread monitoring
- Profit estimation with fees
- Volume analysis

**Options Analytics:**

- Unusual options activity detection
- Volatility surface visualization
- Max pain analysis
- Gamma exposure tracking
- Block trade monitoring

**Order Book Analysis:**

- Multi-exchange aggregation
- Slippage estimation for orders
- Liquidity depth visualization
- Order book imbalance detection
- Support/resistance levels

**Arbitrage Scanner Example:**

```bash
# Get cross-exchange arbitrage opportunities
curl "https://fcn.dev/api/arbitrage?minProfit=0.5&limit=20"

# Get triangular arbitrage opportunities
curl "https://fcn.dev/api/trading/arbitrage?type=triangular&minSpread=0.3"
```

**Options Flow Example:**

```bash
# Get options dashboard
curl "https://fcn.dev/api/options?view=dashboard&underlying=BTC"

# Get max pain analysis
curl "https://fcn.dev/api/trading/options?view=maxpain&underlying=ETH"

# Get volatility surface
curl "https://fcn.dev/api/trading/options?view=surface"
```

**Order Book Example:**

```bash
# Get aggregated order book
curl "https://fcn.dev/api/orderbook?symbol=BTC&market=spot"

# Estimate slippage for $100k order
curl "https://fcn.dev/api/trading/orderbook?symbol=BTCUSDT&view=slippage&size=100000"
```

### 🐋 Whale Intelligence

| Endpoint            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `/api/whale-alerts` | Monitor large transactions across blockchains        |
| `/api/influencers`  | Influencer reliability tracking & prediction scoring |

**Whale Alerts Example:**

```bash
# Get recent whale transactions
curl "https://fcn.dev/api/whale-alerts?limit=50"

# Filter by blockchain
curl "https://fcn.dev/api/whale-alerts?blockchain=ethereum&minUsd=1000000"
```

### 🏛️ Regulatory Intelligence

| Endpoint                               | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| `/api/regulatory`                      | Regulatory news with jurisdiction & agency tracking |
| `/api/regulatory?action=jurisdictions` | Jurisdiction profiles                               |
| `/api/regulatory?action=agencies`      | Agency information                                  |
| `/api/regulatory?action=deadlines`     | Upcoming compliance deadlines                       |
| `/api/regulatory?action=summary`       | Intelligence summary                                |

### 📰 Coverage & Research

| Endpoint            | Description                                   |
| ------------------- | --------------------------------------------- |
| `/api/coverage-gap` | Analyze under-covered topics and assets       |
| `/api/extract`      | Full article content extraction from URLs     |
| `/api/academic`     | Academic access program for researchers       |
| `/api/citations`    | Citation network analysis for academic papers |

### 💎 Premium API (x402 Micropayments)

Premium endpoints powered by x402 USDC micropayments. Pay per request or get access passes.

| Endpoint                           | Description                         | Price |
| ---------------------------------- | ----------------------------------- | ----- |
| `/api/premium`                     | Premium API documentation & pricing | Free  |
| `/api/premium/ai/sentiment`        | Advanced AI sentiment analysis      | $0.02 |
| `/api/premium/ai/analyze`          | Deep article analysis               | $0.03 |
| `/api/premium/ai/signals`          | Premium trading signals             | $0.05 |
| `/api/premium/ai/summary`          | Extended summaries                  | $0.02 |
| `/api/premium/ai/compare`          | Multi-asset AI comparison           | $0.03 |
| `/api/premium/whales/alerts`       | Real-time whale alerts              | $0.05 |
| `/api/premium/whales/transactions` | Whale transaction history           | $0.03 |
| `/api/premium/smart-money`         | Smart money flow tracking           | $0.05 |
| `/api/premium/screener/advanced`   | Advanced coin screener              | $0.03 |
| `/api/premium/analytics/screener`  | Analytics screener                  | $0.03 |
| `/api/premium/market/coins`        | Premium market data                 | $0.02 |
| `/api/premium/market/history`      | Extended price history              | $0.02 |
| `/api/premium/defi/protocols`      | DeFi protocol analytics             | $0.03 |
| `/api/premium/streams/prices`      | Real-time price streams             | $0.01 |
| `/api/premium/portfolio/analytics` | Portfolio analytics                 | $0.03 |
| `/api/premium/export/portfolio`    | Portfolio data export               | $0.05 |
| `/api/premium/alerts/whales`       | Whale alert configuration           | $0.02 |
| `/api/premium/alerts/custom`       | Custom alert rules                  | $0.02 |
| `/api/premium/api-keys`            | API key management                  | Free  |

**Access Passes:**
| Pass | Price | Duration |
|------|-------|----------|
| 1 Hour Pass | $0.25 | 1 hour |
| 24 Hour Pass | $2.00 | 24 hours |
| Weekly Pass | $10.00 | 7 days |

**How to Pay:**

```bash
# 1. Make request, receive 402 with payment requirements
curl https://fcn.dev/api/premium/ai/sentiment

# 2. Pay with USDC using x402-compatible wallet
# 3. Include payment proof in header
curl -H "X-Payment: <base64-payment>" https://fcn.dev/api/premium/ai/sentiment
```

### 🔐 Admin API

### 🔢 Versioned API (v1)

Stable versioned API with x402 micropayment support for production integrations.

| Endpoint                           | Description                    |
| ---------------------------------- | ------------------------------ |
| `/api/v1`                          | API documentation & pricing    |
| `/api/v1/coins`                    | Coin listings with market data |
| `/api/v1/coin/[coinId]`            | Individual coin details        |
| `/api/v1/market-data`              | Global market data             |
| `/api/v1/trending`                 | Trending coins                 |
| `/api/v1/search`                   | Search coins                   |
| `/api/v1/exchanges`                | Exchange listings              |
| `/api/v1/defi`                     | DeFi protocols data            |
| `/api/v1/gas`                      | Gas price tracker              |
| `/api/v1/global`                   | Global crypto market stats     |
| `/api/v1/assets`                   | Asset listings                 |
| `/api/v1/assets/[assetId]/history` | Asset price history            |
| `/api/v1/historical/[coinId]`      | Historical data                |
| `/api/v1/alerts`                   | Price alerts                   |
| `/api/v1/export`                   | Data export                    |
| `/api/v1/usage`                    | API usage stats                |
| `/api/v1/x402`                     | x402 payment info              |

> 💡 AI endpoints require `GROQ_API_KEY` (free at [console.groq.com](https://console.groq.com/keys))


---

## Response Format

```json
{
  "articles": [
    {
      "title": "Bitcoin Hits New ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin surpassed...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2h ago"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

## 🤖 AI Endpoint Examples

**Ask questions about crypto news:**

```bash
curl "https://cryptocurrency.cv/api/ask?q=What%20is%20happening%20with%20Bitcoin%20today"
```

**Get AI-powered summaries:**

```bash
curl "https://cryptocurrency.cv/api/summarize?limit=5&style=brief"
```

**Daily digest:**

```bash
curl "https://cryptocurrency.cv/api/digest?period=24h"
```

**Deep sentiment analysis:**

```bash
curl "https://cryptocurrency.cv/api/sentiment?asset=BTC"
```

**Extract entities (people, companies, tickers):**

```bash
curl "https://cryptocurrency.cv/api/entities?type=person"
```

**Identify market narratives:**

```bash
curl "https://cryptocurrency.cv/api/narratives?emerging=true"
```

**News-based trading signals:**

```bash
curl "https://cryptocurrency.cv/api/signals?min_confidence=70"
```

**Fact-check claims:**

```bash
curl "https://cryptocurrency.cv/api/factcheck?type=prediction"
```

**Detect clickbait:**

```bash
curl "https://cryptocurrency.cv/api/clickbait?threshold=50"
```

### 🆕 AI Products

**Daily Brief** - Comprehensive crypto news digest:

```bash
curl "https://cryptocurrency.cv/api/ai/brief?format=full"
```

**Bull vs Bear Debate** - Generate balanced perspectives:

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Bitcoin reaching $200k in 2026"}'
```

**Counter-Arguments** - Challenge any claim:

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Ethereum will flip Bitcoin by market cap"}'
```

