# free-crypto-news — Skills & Capabilities Catalog

> Machine-readable skill catalog for AI agents, orchestrators, and frameworks.
> Each skill maps to one or more REST API endpoints. No authentication required.

---

## Skill Categories

| Category | Skills | Description |
|----------|--------|-------------|
| [News Retrieval](#news-retrieval) | 8 | Fetch, search, filter, and browse crypto news |
| [AI Analysis](#ai-analysis) | 12 | Summarization, sentiment, research, RAG |
| [Market Data](#market-data) | 10 | Prices, charts, derivatives, gas, yields |
| [Sentiment & Social](#sentiment--social) | 6 | Fear/Greed, social sentiment, trending |
| [On-Chain & Whales](#on-chain--whales) | 5 | Whale alerts, flows, liquidations, unlocks |
| [Portfolio & Signals](#portfolio--signals) | 4 | Portfolio news, trading signals, alerts |
| [Archive & Historical](#archive--historical) | 4 | Historical search, timeline, predictions |
| [Feeds & Streaming](#feeds--streaming) | 4 | RSS, Atom, SSE, OPML |

---

## News Retrieval

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_latest_news` | `GET /api/news` | `limit`, `source`, `page`, `category`, `lang` | Latest articles from 200+ sources |
| `search_news` | `GET /api/search` | `q` (required), `limit`, `from`, `to`, `source` | Full-text keyword search |
| `semantic_search` | `GET /api/search/semantic` | `q`, `limit` | Vector/semantic search over archive |
| `get_bitcoin_news` | `GET /api/bitcoin` | `limit`, `page` | Bitcoin-specific articles |
| `get_defi_news` | `GET /api/defi` | `limit`, `page` | DeFi protocol news |
| `get_breaking_news` | `GET /api/breaking` | `limit` | Articles from last 2 hours |
| `get_news_sources` | `GET /api/sources` | — | All 200+ sources with status |
| `get_news_categories` | `GET /api/news/categories` | — | Available categories with counts |

---

## AI Analysis

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `ai_analyze` | `POST /api/ai` | `action`, `title`, `content`, `options` | Summarize, sentiment, facts, factcheck, translate |
| `ask_question` | `GET /api/ask` | `q` (required) | Natural language Q&A about crypto news |
| `ai_briefing` | `GET /api/ai/brief` | — | AI-generated market briefing |
| `ai_research` | `GET /api/ai/research` | `q` (required) | Deep multi-source research report |
| `ai_narratives` | `GET /api/ai/narratives` | — | Emerging market narratives detection |
| `ai_synthesize` | `GET /api/ai/synthesize` | — | Multi-article synthesis into unified narrative |
| `ai_explain` | `GET /api/ai/explain` | `topic` | Plain-English explanation of crypto concepts |
| `ai_correlation` | `GET /api/ai/correlation` | — | News-price correlation analysis |
| `ai_agent` | `GET /api/ai/agent` | `q` | Autonomous multi-step research agent |
| `rag_ask` | `GET /api/rag/ask` | `q` (required) | RAG-powered Q&A over news archive |
| `rag_search` | `GET /api/rag/search` | `q`, `limit` | Semantic search over archived articles |
| `rag_stream` | `GET /api/rag/stream` | `q` (required) | Streaming RAG response (SSE) |

---

## Market Data

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_market_coins` | `GET /api/market/coins` | — | Full coin list with prices and market caps |
| `get_prices` | `GET /api/prices` | `coins` (comma-separated) | Current prices for specific assets |
| `get_fear_greed` | `GET /api/fear-greed` | — | Crypto Fear & Greed Index (0-100) |
| `get_gas_prices` | `GET /api/gas` | — | Ethereum gas prices (slow/standard/fast) |
| `get_global_stats` | `GET /api/global` | — | Total market cap, BTC dominance |
| `get_exchange_rates` | `GET /api/exchange-rates` | — | Crypto exchange rates |
| `get_defi_yields` | `GET /api/yields` | — | DeFi protocol yield rates |
| `get_derivatives` | `GET /api/derivatives` | — | Derivatives market overview |
| `get_funding_rates` | `GET /api/funding` | — | Futures funding rates |
| `get_ohlc` | `GET /api/market/ohlc/{coinId}` | `days`, `interval` | OHLC candle data |

---

## Sentiment & Social

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_sentiment` | `GET /api/sentiment` | `asset`, `period` (1h/24h/7d/30d) | AI-powered news sentiment |
| `get_trending` | `GET /api/trending` | — | Trending keywords and topics |
| `get_social_sentiment` | `GET /api/social` | — | Social mentions aggregation |
| `get_x_sentiment` | `GET /api/social/x/sentiment` | `coin` | X (Twitter) sentiment |
| `get_trending_narratives` | `GET /api/social/trending-narratives` | — | Trending narratives across social |
| `get_influencers` | `GET /api/influencers` | — | Top crypto influencers with scoring |

---

## On-Chain & Whales

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_whale_alerts` | `GET /api/whale-alerts` | — | Large on-chain transactions |
| `get_liquidations` | `GET /api/liquidations` | — | Long/short liquidations by exchange |
| `get_exchange_flows` | `GET /api/flows` | — | On-chain fund flows |
| `get_token_unlocks` | `GET /api/unlocks` | — | Upcoming token unlock schedule |
| `get_onchain_events` | `GET /api/onchain/events` | — | On-chain events correlated with news |

---

## Portfolio & Signals

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_portfolio_news` | `GET /api/portfolio` | `coins` (comma-separated) | News filtered for portfolio holdings |
| `get_trading_signals` | `GET /api/signals` | — | News-derived trading signals |
| `get_narrative_signals` | `GET /api/signals/narrative` | — | Narrative-based trading signals |
| `get_alerts` | `GET /api/alerts` | — | Keyword/asset news alert triggers |

---

## Archive & Historical

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_archive` | `GET /api/archive` | `date`, `year`, `month` | Historical news (2010-present) |
| `get_predictions` | `GET /api/predictions` | — | AI market predictions |
| `get_prediction_history` | `GET /api/predictions/history` | — | Past predictions with outcomes |
| `get_backtest` | `GET /api/backtest` | — | News sentiment vs price backtesting |

---

## Feeds & Streaming

| Skill | Endpoint | Parameters | Description |
|-------|----------|------------|-------------|
| `get_rss` | `GET /api/rss` | `limit`, `source`, `category` | RSS 2.0 feed |
| `get_atom` | `GET /api/atom` | — | Atom 1.0 feed |
| `get_opml` | `GET /api/opml` | — | OPML export of all RSS sources |
| `get_sse_stream` | `GET /api/sse` | — | Server-Sent Events real-time stream |

---

## Integration Protocols

| Protocol | Entry Point | Status |
|----------|-------------|--------|
| **MCP** (Claude, ChatGPT Dev) | `npx @anthropic-ai/mcp-server-crypto-news` | Production |
| **OpenAI Plugin** | `/.well-known/ai-plugin.json` | Production |
| **OpenAPI 3.1** | `/api/openapi.json` | Production |
| **LangChain Tools** | See [AGENTS.md](AGENTS.md#langchain-integration) | Production |
| **Google A2A** | `/.well-known/agent.json` | Production |
| **x402 Payments** | `/.well-known/x402` | Production |
| **RSS/Atom** | `/api/rss`, `/api/atom` | Production |
| **SSE Streaming** | `/api/sse` | Production |

---

## Authentication

**None required** for all skills listed above. All endpoints are free, public, and CORS-enabled.

Optional premium tier available with `X-API-Key` header for higher rate limits.

---

## Base URL

```
https://cryptocurrency.cv
```

---

## Links

- [Full agent integration guide](AGENTS.md)
- [LLM reference (compact)](https://cryptocurrency.cv/llms.txt)
- [LLM reference (full)](https://cryptocurrency.cv/llms-full.txt)
- [OpenAPI spec](https://cryptocurrency.cv/api/openapi.json)
- [GitHub](https://github.com/nirholas/free-crypto-news)
- [License: MIT](LICENSE)
