# free-crypto-news — AI Agent Integration Guide

> Free, real-time cryptocurrency news API aggregating 200+ sources. No API key required.
> REST JSON, RSS/Atom, WebSocket, GraphQL, AI analysis, MCP server, ChatGPT plugin.
> Open source (MIT). https://cryptocurrency.cv

---

## Quick Start for Agents

```bash
# Latest news (no auth needed)
curl https://cryptocurrency.cv/api/news

# Search
curl "https://cryptocurrency.cv/api/search?q=bitcoin+ETF"

# AI briefing
curl https://cryptocurrency.cv/api/ai/brief

# Sentiment
curl "https://cryptocurrency.cv/api/sentiment?asset=BTC"
```

---

## Discovery Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **LLM docs (compact)** | https://cryptocurrency.cv/llms.txt | Concise API reference for LLMs |
| **LLM docs (full)** | https://cryptocurrency.cv/llms-full.txt | Complete inline reference with schemas |
| **OpenAPI 3.1 spec** | https://cryptocurrency.cv/api/openapi.json | Machine-readable API specification |
| **ChatGPT plugin** | https://cryptocurrency.cv/.well-known/ai-plugin.json | OpenAI plugin manifest |
| **Agent card** | https://cryptocurrency.cv/.well-known/agent.json | Standard agent discovery metadata |
| **AI permissions** | https://cryptocurrency.cv/ai.txt | AI crawling/training permissions |
| **x402 discovery** | https://cryptocurrency.cv/.well-known/x402 | Autonomous payment endpoints |
| **Health check** | https://cryptocurrency.cv/api/health | API status and uptime |

---

## MCP Server (Model Context Protocol)

Install for Claude Desktop, Claude Code, or any MCP-compatible client:

```bash
npx -y @smithery/cli install cryptocurrency-news
```

Or configure manually:

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-crypto-news"]
    }
  }
}
```

### MCP Tools (20)

| Tool | Description |
|------|-------------|
| `get_crypto_news` | Latest news from 200+ sources (category, limit, ticker) |
| `search_crypto_news` | Full-text search across archive |
| `get_bitcoin_news` | Bitcoin-specific news |
| `get_defi_news` | DeFi protocol news |
| `get_breaking_news` | Articles from last 2 hours |
| `get_market_data` | Prices, market caps, 24h change |
| `get_fear_greed_index` | Crypto Fear & Greed Index |
| `get_gas_prices` | Ethereum gas prices |
| `get_regulatory_news` | Regulatory and legal updates |
| `get_whale_alerts` | Large on-chain transactions |
| `get_funding_rates` | Perpetual futures funding rates |
| `get_liquidations` | Recent liquidation events |
| `get_defi_yields` | DeFi protocol yield rates |
| `get_ai_market_brief` | AI-generated market summary |
| `compare_coins` | Compare multiple coins |
| `get_exchange_flows` | Exchange inflow/outflow data |
| `get_token_unlocks` | Upcoming token unlock schedules |
| `get_social_sentiment` | Social media sentiment for a coin |
| `get_news_sources` | List all 200+ news sources |
| `get_trending_topics` | Trending keywords and topics |

All tools are annotated with `readOnlyHint: true` — no confirmation prompts needed.

---

## ChatGPT Plugin

Manifest: `https://cryptocurrency.cv/.well-known/ai-plugin.json`
OpenAPI: `https://cryptocurrency.cv/api/openapi.json`

### Available Actions

| Action | Endpoint | Description |
|--------|----------|-------------|
| `getLatestNews` | `GET /api/news` | Latest crypto news |
| `searchNews` | `GET /api/search` | Search by keywords |
| `getDefiNews` | `GET /api/defi` | DeFi-specific news |
| `getBitcoinNews` | `GET /api/bitcoin` | Bitcoin-specific news |
| `getBreakingNews` | `GET /api/breaking` | Last 2 hours |
| `getSources` | `GET /api/sources` | All 200+ sources |

---

## Core API Endpoints

### News

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Latest articles (limit, source, page, category, lang) |
| `GET /api/search?q={query}` | Full-text search |
| `GET /api/search/semantic?q={query}` | Semantic vector search |
| `GET /api/bitcoin` | Bitcoin news |
| `GET /api/defi` | DeFi news |
| `GET /api/breaking` | Last 2 hours |
| `GET /api/trending` | Trending keywords |
| `GET /api/sources` | All sources with status |
| `GET /api/rss` | RSS 2.0 feed |
| `GET /api/atom` | Atom 1.0 feed |

### AI & Intelligence

| Endpoint | Description |
|----------|-------------|
| `POST /api/ai` | Summarize, sentiment, facts, factcheck, translate |
| `GET /api/ask?q={question}` | Natural language Q&A |
| `GET /api/ai/brief` | AI market briefing |
| `GET /api/ai/research?q={topic}` | Deep research mode |
| `GET /api/ai/narratives` | Emerging market narratives |
| `GET /api/ai/synthesize` | Multi-article synthesis |
| `GET /api/ai/explain` | Plain-English explainer |
| `GET /api/ai/correlation` | News-price correlation |
| `GET /api/ai/agent` | Autonomous research agent |
| `GET /api/rag/ask?q={question}` | RAG-powered Q&A |
| `GET /api/rag/search?q={query}` | Semantic archive search |
| `GET /api/rag/stream?q={query}` | Streaming RAG (SSE) |

### Market Data

| Endpoint | Description |
|----------|-------------|
| `GET /api/market/coins` | Full coin list with prices |
| `GET /api/sentiment?asset={ticker}` | AI sentiment analysis |
| `GET /api/fear-greed` | Fear & Greed Index |
| `GET /api/prices?coins={list}` | Current prices |
| `GET /api/gas` | Ethereum gas prices |
| `GET /api/whale-alerts` | Large transactions |
| `GET /api/liquidations` | Liquidation data |
| `GET /api/funding` | Futures funding rates |
| `GET /api/yields` | DeFi yield rates |

### Archive & Historical

| Endpoint | Description |
|----------|-------------|
| `GET /api/archive?date={YYYY-MM-DD}` | Historical news by date |
| `GET /api/archive/v2` | Enhanced archive with filtering |
| `GET /api/predictions` | AI market predictions |
| `GET /api/predictions/history` | Historical predictions with outcomes |

---

## SDKs

```typescript
// TypeScript / JavaScript
import { CryptoNewsClient } from 'free-crypto-news';
const client = new CryptoNewsClient();
const news = await client.getLatestNews({ limit: 10 });
```

```python
# Python
from free_crypto_news import CryptoNewsClient
client = CryptoNewsClient()
news = client.get_latest_news(limit=10)
```

```tsx
// React Hook
import { useCryptoNews } from 'free-crypto-news/react';
const { articles, loading } = useCryptoNews({ limit: 10 });
```

---

## LangChain Integration

```python
from langchain.tools import Tool
import requests

API = "https://cryptocurrency.cv"

tools = [
    Tool(name="CryptoNews", description="Latest crypto headlines",
         func=lambda _: requests.get(f"{API}/api/news").json()),
    Tool(name="SearchCryptoNews", description="Search crypto news by keyword",
         func=lambda q: requests.get(f"{API}/api/search", params={"q": q}).json()),
    Tool(name="FearGreedIndex", description="Crypto Fear & Greed Index",
         func=lambda _: requests.get(f"{API}/api/fear-greed").json()),
]
```

---

## Agent-to-Agent (A2A) Compatibility

Compatible with Google A2A protocol, OpenAI function calling, Anthropic tool use,
LangChain agents, AutoGPT, CrewAI, and Swarm multi-agent orchestration.

```json
{
  "agent": {
    "name": "Free Crypto News",
    "description": "Real-time crypto news from 200+ sources",
    "capabilities": ["news", "search", "market_data", "sentiment", "ai_analysis", "rag"],
    "endpoints": {
      "discovery": "/.well-known/agent.json",
      "openapi": "/api/openapi.json",
      "llms_txt": "/llms.txt",
      "mcp": "npx @anthropic-ai/mcp-server-crypto-news"
    }
  }
}
```

---

## Common Agent Workflows

1. **Market briefing** → `GET /api/ai/brief` + `GET /api/fear-greed`
2. **Topic research** → `GET /api/search?q={topic}` + `GET /api/ai/research?q={topic}`
3. **Portfolio check** → `GET /api/portfolio?coins=BTC,ETH,SOL` + `GET /api/sentiment`
4. **Breaking alerts** → `GET /api/breaking` + `GET /api/whale-alerts`
5. **Historical analysis** → `GET /api/archive?date=2025-01-01` + `GET /api/rag/ask?q={question}`
6. **Sentiment trading** → `GET /api/sentiment?asset=BTC&period=24h` + `GET /api/signals`

---

## Response Format

All news endpoints return:

```json
{
  "articles": [{
    "id": "coindesk-1234",
    "title": "Bitcoin Hits New ATH",
    "link": "https://coindesk.com/...",
    "description": "Bitcoin surged past...",
    "pubDate": "2026-03-27T10:30:00Z",
    "source": "CoinDesk",
    "sourceKey": "coindesk",
    "category": "bitcoin",
    "timeAgo": "2h ago",
    "sentiment": "bullish",
    "tags": ["bitcoin", "price", "ath"]
  }],
  "totalCount": 1,
  "fetchedAt": "2026-03-27T12:00:00Z"
}
```

---

## Authentication

**None required.** All endpoints are public, free, and CORS-enabled (`Access-Control-Allow-Origin: *`).

Premium endpoints (optional) use `X-API-Key` header.

---

## Rate Limits

| Tier | Requests/min | Auth |
|------|-------------|------|
| Free | 60 | None |
| Standard | 300 | API key |
| Enterprise | Unlimited | API key |

---

## Project

- **Live site:** https://cryptocurrency.cv
- **GitHub:** https://github.com/nirholas/free-crypto-news
- **License:** MIT
- **Author:** [nirholas](https://github.com/nirholas)
- **Skills catalog:** [SKILLS.md](SKILLS.md)
- **Full LLM docs:** [llms-full.txt](https://cryptocurrency.cv/llms-full.txt)
- **Detailed agent guide:** [docs/AGENTS.md](docs/AGENTS.md)
