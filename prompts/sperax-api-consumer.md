# Cryptocurrency.cv API — Agent Instructions for SperaxOS

> This prompt tells agents in the sperax repo how to consume the cryptocurrency.cv API.
> Place this file (or its contents) where your agents can read it — e.g. `AGENTS.md`, a skill file, or system prompt.

---

## Identity

You are a SperaxOS agent with **unlimited, free, priority access** to the cryptocurrency.cv API — a real-time crypto news and market data aggregator with 300+ endpoints.

Your requests are authenticated via a secret token header. You bypass all rate limits, payment gates (x402), and usage quotas. You are the highest-priority consumer of this API.

---

## Authentication

**Every request** must include this header:

```
x-speraxos-token: <value of SPERAXOS_API_SECRET env var>
```

- The token is stored in your environment as `SPERAXOS_API_SECRET`
- Without this header, requests are treated as anonymous and require USDC micropayment
- The token is verified via constant-time comparison — never log or expose it

### Example

```bash
curl -H "x-speraxos-token: $SPERAXOS_API_SECRET" https://cryptocurrency.cv/api/news
```

```typescript
const res = await fetch('https://cryptocurrency.cv/api/news', {
  headers: { 'x-speraxos-token': process.env.SPERAXOS_API_SECRET! },
});
const data = await res.json();
```

---

## Base URL

```
https://cryptocurrency.cv
```

All paths below are relative to this base.

---

## Route Discovery

Call this endpoint to get the **complete, live route manifest** with every available path, method, description, category, and pricing:

```
GET /api/internal/routes
```

This endpoint is **SperaxOS-only** (returns 403 without the token). It returns:

```json
{
  "_meta": {
    "baseUrl": "https://cryptocurrency.cv",
    "totalRoutes": 350,
    "totalCategories": 20,
    "auth": { "header": "x-speraxos-token" }
  },
  "categories": {
    "news": { "routes": [...], "count": 22 },
    "market": { "routes": [...], "count": 34 },
    ...
  },
  "routes": [
    {
      "path": "/api/news",
      "method": "GET",
      "description": "Latest crypto news from 120+ sources",
      "category": "news",
      "url": "https://cryptocurrency.cv/api/news",
      "price": "$0.001"
    }
  ]
}
```

**Always call `/api/internal/routes` first** if you need to discover what endpoints exist. Cache the result — it changes infrequently (hourly ISR).

---

## Key Endpoints (Quick Reference)

### News & Content

| Endpoint | Description |
|---|---|
| `GET /api/news` | Latest crypto news (supports `?limit=`, `?category=`, `?source=`, `?ticker=`) |
| `GET /api/news/categories` | News filtered by category |
| `GET /api/news/international` | International news (`?language=`, `?translate=true`) |
| `GET /api/breaking` | Breaking news alerts |
| `GET /api/search` | Full-text search (`?q=`) |
| `GET /api/search/semantic` | Semantic/vector search |
| `GET /api/trending` | Trending topics |
| `GET /api/digest` | Daily news digest |
| `GET /api/article` | Single article by ID/URL |
| `GET /api/rss` | RSS feed |

### Market Data

| Endpoint | Description |
|---|---|
| `GET /api/prices` | Current prices for top coins |
| `GET /api/market/coins` | All coins with prices and metadata |
| `GET /api/market/movers` | Top gainers and losers |
| `GET /api/market/history/:coinId` | Historical price data |
| `GET /api/market/ohlc/:coinId` | OHLC candle data |
| `GET /api/global` | Global market cap, volume, dominance |
| `GET /api/fear-greed` | Fear & Greed Index |
| `GET /api/compare` | Compare assets side by side |
| `GET /api/exchange-rates` | Crypto ↔ fiat rates |
| `GET /api/exchanges` | Exchange list with volume |

### Bitcoin

| Endpoint | Description |
|---|---|
| `GET /api/bitcoin` | Bitcoin overview (price, metrics, news) |
| `GET /api/bitcoin/blocks` | Recent blocks |
| `GET /api/bitcoin/mempool/fees` | Recommended fee rates |
| `GET /api/bitcoin/network-stats` | Hash rate, node count |
| `GET /api/bitcoin/difficulty` | Mining difficulty |
| `GET /api/bitcoin/address/:address` | Address balance/txs |

### Solana

| Endpoint | Description |
|---|---|
| `GET /api/solana` | Solana ecosystem overview |
| `GET /api/solana/tokens` | Token list |
| `GET /api/solana/defi` | Solana DeFi protocols |
| `GET /api/solana/nfts` | NFT collections |
| `GET /api/solana/priority-fees` | Priority fee estimates |

### DeFi

| Endpoint | Description |
|---|---|
| `GET /api/defi` | DeFi overview (TVL, protocols) |
| `GET /api/defi/yields` | Yield farming opportunities |
| `GET /api/defi/bridges` | Cross-chain bridge data |
| `GET /api/stablecoins` | Stablecoin data |
| `GET /api/stablecoins/depeg` | Depeg monitoring |
| `GET /api/gas` | Gas prices (ETH, L2s) |
| `GET /api/dex-volumes` | DEX volume aggregation |

### On-Chain Analytics

| Endpoint | Description |
|---|---|
| `GET /api/onchain/metrics` | Key on-chain metrics |
| `GET /api/onchain/exchange-flows` | Exchange inflow/outflow |
| `GET /api/onchain/whale-metrics` | Whale accumulation/distribution |
| `GET /api/onchain/miner-metrics` | Miner revenue, hash rate |
| `GET /api/onchain/uniswap/pools` | Uniswap pool data |
| `GET /api/onchain/aave/rates` | Aave lending/borrow rates |

### Social & Sentiment

| Endpoint | Description |
|---|---|
| `GET /api/social` | Social activity overview |
| `GET /api/social/trending-narratives` | Trending crypto narratives |
| `GET /api/social/sentiment` | Social sentiment analysis |
| `GET /api/social/influencers` | Top crypto influencers |
| `GET /api/sentiment` | Market sentiment index |

### Trading & Derivatives

| Endpoint | Description |
|---|---|
| `GET /api/derivatives` | Derivatives overview |
| `GET /api/liquidations` | Liquidation events |
| `GET /api/funding-rates` | Funding rates |
| `GET /api/orderbook` | Aggregated orderbook |
| `GET /api/arbitrage` | Cross-exchange arbitrage |
| `GET /api/signals` | Trading signals |

### AI & Analysis

| Endpoint | Description |
|---|---|
| `GET /api/ai` | AI capabilities overview |
| `GET /api/ai/summarize` | Article summarizer |
| `GET /api/ai/explain` | Explain crypto concepts |
| `GET /api/ai/research` | AI research assistant |
| `GET /api/ai/flash-briefing` | AI flash briefing |
| `GET /api/ai/narratives` | Narrative detection |
| `GET /api/ask` | Ask anything about crypto |
| `GET /api/forecast` | Price forecasting |

### RAG (Retrieval Augmented Generation)

| Endpoint | Description |
|---|---|
| `POST /api/rag/ask` | Ask with RAG context (JSON body: `{ "question": "..." }`) |
| `GET /api/rag/search` | RAG-powered search |
| `GET /api/rag/summary/:crypto` | RAG summary for a crypto |
| `GET /api/rag/stream` | Streaming RAG response |
| `GET /api/rag/timeline` | RAG timeline view |

### Premium (also free for SperaxOS)

| Endpoint | Description |
|---|---|
| `GET /api/premium/ai/sentiment` | AI sentiment analysis |
| `GET /api/premium/ai/signals` | AI buy/sell signals |
| `GET /api/premium/ai/analyze` | AI deep analysis |
| `GET /api/premium/whales/transactions` | Whale transaction tracking |
| `GET /api/premium/smart-money` | Smart money flows |
| `GET /api/premium/screener/advanced` | Advanced screener |
| `GET /api/premium/market/history` | 5-year historical data |
| `GET /api/premium/defi/protocols` | 500+ DeFi protocols |

### Other Categories

| Endpoint | Description |
|---|---|
| `GET /api/l2` | Layer 2 overview |
| `GET /api/gaming` | Crypto gaming |
| `GET /api/nft` | NFT market data |
| `GET /api/macro` | Macro economics |
| `GET /api/oracle/chainlink` | Chainlink price feeds |
| `GET /api/predictions` | Price predictions |
| `GET /api/archive` | Historical news archive |

---

## Common Query Parameters

Most endpoints accept these:

| Parameter | Type | Description |
|---|---|---|
| `limit` | integer | Number of results (default varies, max typically 100) |
| `offset` | integer | Pagination offset |
| `sort` | string | Sort field (e.g. `pubDate`, `marketCap`) |
| `order` | string | `asc` or `desc` |
| `ticker` | string | Filter by ticker symbol (e.g. `BTC`, `ETH`) |
| `category` | string | Filter by category |
| `source` | string | Filter by news source |
| `q` | string | Search query (for search endpoints) |
| `language` | string | ISO 639-1 language code (for international endpoints) |

---

## Response Format

All responses are JSON. Standard shape:

```json
{
  "articles": [...],          // or "data", "coins", "results" depending on endpoint
  "meta": {
    "total": 1234,
    "limit": 20,
    "offset": 0,
    "cached": true
  }
}
```

Error responses:

```json
{
  "error": "Error Title",
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "requestId": "req_abc123"
}
```

---

## Response Headers You'll See

| Header | Value | Meaning |
|---|---|---|
| `X-SperaxOS` | `1` | Confirms you're authenticated as SperaxOS |
| `X-Priority` | `speraxos` | Priority routing applied |
| `X-RateLimit-Limit` | `unlimited` | No rate limit for you |
| `X-RateLimit-Remaining` | `unlimited` | No rate limit for you |
| `X-Response-Time` | `42ms` | Server-side response time |
| `Cache-Control` | varies | Caching policy |

---

## Path Parameters

Routes with `:param` segments require substitution:

- `/api/bitcoin/blocks/:hash` → `/api/bitcoin/blocks/00000000000000000002a...`
- `/api/market/history/:coinId` → `/api/market/history/bitcoin`
- `/api/social/coins/:symbol` → `/api/social/coins/BTC`
- `/api/v1/coin/:coinId` → `/api/v1/coin/ethereum`

---

## POST Endpoints

These endpoints accept JSON body:

```
POST /api/rag/ask          → { "question": "What happened with Bitcoin today?" }
POST /api/rag/batch        → { "questions": ["...", "..."] }
POST /api/rag/feedback     → { "responseId": "...", "rating": 5 }
POST /api/ai/entities/extract → { "text": "..." }
POST /api/ai/blog-generator   → { "topic": "...", "style": "..." }
POST /api/ai/agent         → { "message": "...", "context": {...} }
POST /api/ai/agent/orchestrator → { "task": "...", "agents": [...] }
POST /api/batch            → { "requests": [{ "path": "/api/news" }, ...] }
```

Always set `Content-Type: application/json`.

---

## Best Practices for Agents

1. **Always include the token header** — without it you'll hit 402 payment gates
2. **Use `/api/internal/routes` for discovery** — it's the complete, live manifest
3. **Cache the manifest** — it only changes when we deploy
4. **Use `?limit=` to control payload size** — don't fetch 100 articles if you need 5
5. **Prefer specific endpoints over general ones** — `/api/bitcoin` is faster than `/api/news?ticker=BTC`
6. **Use `/api/search?q=` for natural language queries** — it supports full-text search
7. **Use `/api/rag/ask` for complex questions** — it uses RAG with the full news corpus
8. **Stream when possible** — `/api/ai/summarize/stream`, `/api/rag/stream`, `/api/news/stream` return SSE
9. **Check `_meta` in responses** — it tells you cache age, total results, and pagination info
10. **Never expose the token** — don't log it, don't include it in user-facing responses

---

## Rate Limits & Access

| Consumer | Rate Limit | Payment | Notes |
|---|---|---|---|
| **SperaxOS (you)** | **Unlimited** | **None** | Priority routing, all endpoints |
| Pro API key ($29/mo) | 50K/day | None (key-based) | All endpoints |
| Enterprise key ($99/mo) | 500K/day | None (key-based) | Priority, SLA |
| Anonymous | 10-20/hour | x402 USDC micropayment | Pay per request |
| `/api/sample` | 10/hour | Free | 2 headlines, 2 prices only |

**You are SperaxOS. You have no limits. Use the full API.**

---

## Environment Variables

Your service needs:

```env
SPERAXOS_API_SECRET=<the shared secret token>
```

This is the only credential needed. No API key registration, no OAuth, no USDC wallet.

---

## Quick Start Code

### TypeScript / Node.js

```typescript
const BASE_URL = 'https://cryptocurrency.cv';
const TOKEN = process.env.SPERAXOS_API_SECRET;

async function fetchAPI(path: string, params?: Record<string, string>) {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'x-speraxos-token': TOKEN! },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Examples
const news = await fetchAPI('/api/news', { limit: '10' });
const btc = await fetchAPI('/api/bitcoin');
const sentiment = await fetchAPI('/api/premium/ai/sentiment', { asset: 'BTC' });
const answer = await fetch(`${BASE_URL}/api/rag/ask`, {
  method: 'POST',
  headers: {
    'x-speraxos-token': TOKEN!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ question: 'What is the latest on Ethereum?' }),
}).then(r => r.json());
```

### Python

```python
import os, requests

BASE_URL = "https://cryptocurrency.cv"
HEADERS = {"x-speraxos-token": os.environ["SPERAXOS_API_SECRET"]}

def fetch_api(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

news = fetch_api("/api/news", {"limit": 10})
btc = fetch_api("/api/bitcoin")
sentiment = fetch_api("/api/premium/ai/sentiment", {"asset": "BTC"})
```

---

## Streaming (SSE)

For real-time data, use Server-Sent Events endpoints:

```typescript
const es = new EventSource(
  'https://cryptocurrency.cv/api/news/stream',
  // Note: EventSource doesn't support custom headers natively.
  // Use fetch with ReadableStream instead:
);

// Better: fetch-based SSE
const res = await fetch('https://cryptocurrency.cv/api/news/stream', {
  headers: { 'x-speraxos-token': TOKEN! },
});
const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## Error Handling

| Status | Meaning | Action |
|---|---|---|
| 200 | Success | Process the data |
| 304 | Not Modified | Use cached version |
| 400 | Bad Request | Check your query parameters |
| 403 | Forbidden | Token is missing or invalid — check `SPERAXOS_API_SECRET` |
| 404 | Not Found | Endpoint doesn't exist — check `/api/internal/routes` |
| 429 | Rate Limited | Should never happen for SperaxOS — if it does, token is not being sent |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Unavailable | Temporary — retry after `Retry-After` header value |
