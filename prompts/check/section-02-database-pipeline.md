# Section 2: Database & Data Pipeline (Agents 6–10)

> These agents build the database schema, migrations, data ingestion workers, caching layer, and real-time streaming infrastructure.

---

## Agent 6 — Database Schema & Migrations

**Goal:** Design and implement the complete PostgreSQL + TimescaleDB database schema for a CoinGecko/DeFiLlama competitor.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:**
- The existing free-crypto-news repo has 14 tables in `src/lib/db/schema.ts` using Drizzle ORM. Those tables are: articles, pricesHistory, marketSnapshots, predictions, tagScores, userWatchlists, coins, providerHealth, alerts, socialMetrics, derivativesSnapshots, stablecoinSnapshots, gasFeesHistory, newsArticles.
- This agent builds a NEW, much larger schema for the full Crypto Vision platform. The news tables from free-crypto-news will be imported later.

**Files to create:**

```
src/db/
  index.ts              (DB connection with Drizzle)
  migrate.ts            (migration runner)
  seed.ts               (seed data for development)
  schema/
    index.ts            (re-exports all schemas)
    coins.ts            (coin/token metadata)
    prices.ts           (OHLCV, tickers, historical)
    markets.ts          (exchanges, trading pairs)
    defi.ts             (protocols, TVL, yields)
    onchain.ts          (transactions, whale movements)
    news.ts             (articles, sentiment)
    social.ts           (social metrics, influencers)
    users.ts            (accounts, API keys, usage)
    billing.ts          (subscriptions, invoices, payments)
    alerts.ts           (user alerts, notifications)
    derivatives.ts      (futures, options, liquidations)
    nft.ts              (collections, floor prices, sales)
    stablecoins.ts      (supply, peg deviation)
    macro.ts            (economic indicators, correlations)
    governance.ts       (proposals, voting)
    bridge.ts           (cross-chain bridge data)
drizzle/
  0001_initial.sql
```

**Schema Details:**

1. **coins.ts:**
```
coins: id, symbol, name, slug, logo_url, description, website, whitepaper_url,
  genesis_date, categories[], platforms (jsonb: {chain: contract_address}),
  market_cap_rank, coingecko_id, cmc_id, created_at, updated_at
  
coin_categories: id, name, slug, description, market_cap, volume_24h, updated_at
```

2. **prices.ts:**
```
price_ticks: coin_id, timestamp, price_usd, price_btc, price_eth,
  volume_24h, market_cap, circulating_supply, total_supply, max_supply
  → TimescaleDB hypertable, compressed after 7d, retention 5y

ohlcv_1m: coin_id, timestamp, open, high, low, close, volume
  → TimescaleDB hypertable, compressed after 24h, retention 90d

ohlcv_1h: coin_id, timestamp, open, high, low, close, volume
  → hypertable, compressed after 7d, retention 2y

ohlcv_1d: coin_id, timestamp, open, high, low, close, volume
  → hypertable, no compression, indefinite retention

all_time_highs: coin_id, price_usd, timestamp, percent_from_ath
```

3. **markets.ts:**
```
exchanges: id, name, slug, logo_url, url, country, year_established,
  trust_score, trade_volume_24h_btc, has_trading_incentive,
  centralized (bool), api_url, websocket_url, status, created_at, updated_at

trading_pairs: id, exchange_id, coin_id, base_symbol, quote_symbol,
  price, volume_24h, spread, last_traded_at, trust_score,
  is_anomaly (bool), is_stale (bool)

orderbook_snapshots: exchange_id, pair_id, timestamp,
  bids (jsonb top 50), asks (jsonb top 50), spread, depth_2pct
  → TimescaleDB hypertable
```

4. **defi.ts:**
```
defi_protocols: id, name, slug, logo_url, url, description,
  category (dex/lending/bridge/yield/etc), chains[], tvl, tvl_change_1d,
  tvl_change_7d, mcap_tvl_ratio, fees_24h, revenue_24h,
  treasury, governance_token_id, audit_links[], created_at, updated_at

defi_tvl_history: protocol_id, timestamp, tvl, chain_tvls (jsonb)
  → TimescaleDB hypertable

defi_yields: protocol_id, chain, pool_name, apy, tvl, il_risk,
  stablecoin (bool), reward_tokens[], audited (bool), timestamp
  → hypertable

dex_volumes: protocol_id, timestamp, volume_24h, trades_24h, unique_users
  → hypertable
```

5. **onchain.ts:**
```
whale_transactions: id, chain, tx_hash, from_address, to_address,
  from_label, to_label, token_id, amount, usd_value, tx_type,
  block_number, timestamp

address_labels: address, chain, label, category (exchange/whale/fund/bridge),
  entity_name, verified (bool)

chain_metrics: chain, timestamp, active_addresses, transactions,
  avg_fee, total_fees, tps, block_time, unique_senders
  → hypertable

token_holder_snapshots: coin_id, timestamp, holder_count,
  top_10_pct, top_50_pct, top_100_pct, gini_coefficient
  → hypertable
```

6. **users.ts:**
```
users: id, email, name, avatar_url, provider (github/google/email),
  provider_id, role (free/developer/pro/enterprise/admin),
  created_at, updated_at, last_login_at, is_active (bool)

api_keys: id, user_id, key_hash (sha256), key_prefix (first 8 chars),
  name, tier (free/developer/pro/enterprise), permissions[],
  rate_limit, daily_limit, monthly_limit, expires_at,
  last_used_at, usage_count, is_active (bool), created_at

api_usage_log: id, api_key_id, endpoint, method, status_code,
  response_time_ms, ip_address, user_agent, timestamp
  → TimescaleDB hypertable, retention 90d
```

7. **billing.ts:**
```
subscriptions: id, user_id, stripe_customer_id, stripe_subscription_id,
  plan (free/developer/pro/enterprise), status, current_period_start,
  current_period_end, cancel_at_period_end (bool), created_at

invoices: id, user_id, stripe_invoice_id, amount_cents, currency,
  status (paid/open/void/uncollectible), period_start, period_end,
  paid_at, created_at

x402_payments: id, user_id, tx_hash, chain, amount, token,
  endpoint, timestamp
```

8. **Additional tables** in derivatives.ts, nft.ts, stablecoins.ts, macro.ts, governance.ts, bridge.ts should follow similar patterns with TimescaleDB hypertables for time-series data.

**Instructions:**
- Use Drizzle ORM with `drizzle-orm/pg-core`
- Use `pgTable` for regular tables, mark hypertables with a comment — a migration script will `SELECT create_hypertable(...)` them
- All timestamps should be `timestamp('...', { withTimezone: true })`
- Add proper indexes: coin_id + timestamp for time-series, GIN indexes for jsonb columns, unique constraints where needed
- The `src/db/index.ts` should use `@neondatabase/serverless` for serverless and `pg` for long-running workers
- Include comprehensive JSDoc comments on each table
- Do NOT touch any files outside `src/db/` and `drizzle/`
- Commit message: `feat(db): add comprehensive database schema for Crypto Vision`

---

## Agent 7 — Price Data Pipeline Workers

**Goal:** Build data pipeline workers that continuously ingest price data from multiple exchanges.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/workers/
  index.ts                  (worker orchestrator)
  config.ts                 (intervals, retry config)
  prices/
    binance.ts              (Binance WebSocket + REST)
    coinbase.ts             (Coinbase WebSocket)
    coingecko.ts            (CoinGecko REST fallback)
    kraken.ts               (Kraken WebSocket)
    okx.ts                  (OKX WebSocket)
    bybit.ts                (Bybit WebSocket)
    aggregator.ts           (VWAP price aggregation)
    ohlcv-builder.ts        (builds 1m/1h/1d candles from ticks)
  shared/
    ws-manager.ts           (WebSocket connection manager with reconnect)
    circuit-breaker.ts      (circuit breaker for upstream APIs)
    rate-limiter.ts         (per-exchange rate limiting)
    deduplicator.ts         (prevent duplicate writes)
    queue.ts                (in-memory task queue with backpressure)
```

**Requirements:**

1. **Binance worker:** Connect to `wss://stream.binance.com:9443`. Subscribe to `@miniTicker` for all USDT pairs. Parse 24h stats. Fallback to REST `/api/v3/ticker/24hr` if WS disconnects. Handle rate limits (1200 req/min REST).

2. **Coinbase worker:** Connect to Coinbase Advanced Trade WebSocket. Subscribe to `ticker` channel. Parse price, volume, 24h change.

3. **CoinGecko worker:** REST fallback for coins not on major exchanges. Hit `/coins/markets` with pagination (250 per page, 50+ pages). Respect 30 req/min rate limit (free tier). Cache for 60s.

4. **Aggregator:** Compute VWAP (Volume-Weighted Average Price) across all exchange feeds. Weight by 24h volume. Detect and discard outlier prices (>3 standard deviations from mean). Emit aggregated price every 1s.

5. **OHLCV builder:** Build 1-minute candles from raw ticks. Roll up 1m → 1h and 1h → 1d on schedule. Write to respective hypertables.

6. **WebSocket manager:** Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 60s). Connection health monitoring (ping/pong). Graceful shutdown. Connection pooling. Metrics: connected/disconnected/messages_received/errors.

7. **Circuit breaker:** States: closed/open/half-open. Open after 5 consecutive failures. Half-open after 30s. Close after 3 successful requests. Per-exchange isolation.

8. **Worker orchestrator (index.ts):** Start all workers. Graceful shutdown on SIGTERM/SIGINT. Health endpoint on port 3001. Report worker status. Restart failed workers.

**Instructions:**
- Use native `WebSocket` (Bun has built-in support) or `ws` library
- Write to PostgreSQL via Drizzle ORM (using schema from Agent 6)
- Write hot data to Redis (pipeline cache keys)
- Each worker should be independently testable
- Include error handling for every network call
- Log with structured JSON (pino)
- Do NOT touch any files outside `src/workers/` 
- Commit message: `feat(pipeline): add price data ingestion workers`

---

## Agent 8 — News & Alternative Data Pipeline

**Goal:** Build workers for news ingestion, sentiment analysis, social metrics, and alternative data sources.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/workers/
  news/
    rss-fetcher.ts          (fetch 50+ RSS feeds in parallel)
    article-parser.ts       (extract title, body, images, entities)
    sentiment-analyzer.ts   (AI-powered sentiment scoring)
    deduplicator.ts         (fuzzy dedup via title similarity)
    categorizer.ts          (auto-categorize: bitcoin/defi/nft/etc)
  social/
    twitter-tracker.ts      (X/Twitter via API v2)
    reddit-monitor.ts       (Reddit API for r/cryptocurrency etc)
    telegram-scanner.ts     (Telegram channel monitoring)
    social-scorer.ts        (engagement scoring across platforms)
  alternative/
    fear-greed.ts           (Alternative.me Fear & Greed Index)
    github-activity.ts      (GitHub commit activity for top projects)
    google-trends.ts        (search interest tracking)
    whale-alert.ts          (whale-alert.io API integration)
    defillama.ts            (DeFiLlama TVL/yields ingestion)
    l2beat.ts               (L2Beat L2 data ingestion)
```

**Requirements:**

1. **RSS fetcher:** Maintain a list of 50+ crypto news RSS feeds (CoinDesk, CoinTelegraph, The Block, Decrypt, Bitcoin Magazine, etc). Fetch in parallel with p-limit (10 concurrent). Parse with `fast-xml-parser`. Extract: title, link, pubDate, description, author, source. Interval: every 60s.

2. **Article parser:** Follow article links and extract full text using `@mozilla/readability` or similar. Extract named entities (coin names, people, companies). Extract images for OG previews.

3. **Sentiment analyzer:** Use Google Gemini API (existing in free-crypto-news) to score sentiment -1 to +1. Batch articles for efficiency. Cache results. Fall back to simple keyword-based scoring if API is unavailable.

4. **Deduplicator:** Use Jaccard similarity on tokenized titles. Threshold: 0.7 similarity = duplicate. Keep the earliest article. Link duplicates for "same story from multiple sources" feature.

5. **Social scorer:** Combine Twitter mentions, Reddit post score, and Telegram views into a composite engagement score per coin. Normalize to 0-100. Track 1h/24h/7d trends.

6. **Fear & Greed:** Fetch from Alternative.me API every 5 minutes. Store in time-series table. Calculate simple moving average (7d, 30d).

7. **DeFiLlama integration:** Fetch `/protocols` for TVL data, `/yields` for yield farming APY, `/stablecoins` for stablecoin supply. Update every 5 minutes.

8. **Whale Alert:** Connect to whale-alert.io API. Fetch transactions > $1M. Classify by type (exchange deposit, exchange withdrawal, unknown wallet transfer). Store with address labels.

**Instructions:**
- Reuse the circuit breaker and rate limiter from Agent 7's `src/workers/shared/`
- Use the schema from Agent 6 for database writes
- All workers should export a `start()` and `stop()` function
- Include retry logic with exponential backoff for all HTTP calls
- Do NOT touch files outside `src/workers/news/`, `src/workers/social/`, `src/workers/alternative/`
- Commit message: `feat(pipeline): add news, social, and alternative data workers`

---

## Agent 9 — Cache Layer & Redis Architecture

**Goal:** Build a comprehensive Redis caching layer with smart invalidation, pub/sub, and rate limiting.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/lib/cache/
  index.ts                  (cache client initialization)
  redis.ts                  (Redis connection with retry)
  keys.ts                   (cache key schema/namespace)
  strategies/
    write-through.ts        (write to cache + DB simultaneously)
    write-behind.ts         (write to cache, async DB write)
    cache-aside.ts          (read: check cache → miss → fetch → populate)
    read-through.ts         (transparent cache layer)
  invalidation.ts           (smart cache invalidation patterns)
  warmup.ts                 (cache warming on startup)
  compression.ts            (compress large values with zstd/lz4)
  pubsub.ts                 (Redis pub/sub for real-time events)
  rate-limit.ts             (distributed rate limiting)
  leaderboard.ts            (sorted sets for trending/top coins)
```

**Requirements:**

1. **Redis connection (redis.ts):** Use `ioredis` with cluster support. Sentinel failover. Connection pooling. Auto-reconnect. TLS in production. Health check method. Lazy connection (don't connect until first use).

2. **Cache key schema (keys.ts):**
```typescript
export const CacheKeys = {
  price: (coinId: string) => `price:${coinId}`,
  priceAll: () => 'prices:all',
  ohlcv: (coinId: string, interval: string) => `ohlcv:${coinId}:${interval}`,
  coin: (slug: string) => `coin:${slug}`,
  coinList: () => 'coins:list',
  trending: () => 'trending:coins',
  fearGreed: () => 'market:fear-greed',
  globalStats: () => 'market:global',
  defiTVL: (protocol: string) => `defi:tvl:${protocol}`,
  news: (category: string) => `news:${category}`,
  newsLatest: () => 'news:latest',
  userRateLimit: (keyId: string) => `ratelimit:${keyId}`,
  userUsage: (keyId: string, date: string) => `usage:${keyId}:${date}`,
  search: (query: string) => `search:${query}`,
  exchange: (exchangeId: string) => `exchange:${exchangeId}`,
  orderbook: (pair: string) => `orderbook:${pair}`,
}

export const CacheTTL = {
  price: 10,          // 10 seconds
  ohlcv: 60,          // 1 minute
  coin: 300,          // 5 minutes
  coinList: 600,      // 10 minutes
  trending: 300,      // 5 minutes
  fearGreed: 300,     // 5 minutes
  globalStats: 60,    // 1 minute
  defiTVL: 300,       // 5 minutes
  news: 60,           // 1 minute
  search: 1800,       // 30 minutes
  exchange: 300,      // 5 minutes
  orderbook: 5,       // 5 seconds
}
```

3. **Cache-aside strategy:** Generic wrapper: `cacheAside<T>(key, ttl, fetcher) → T`. Check cache → return if hit → call fetcher on miss → store in cache → return. Include stale-while-revalidate option.

4. **Pub/Sub (pubsub.ts):** Channels: `prices:realtime` (for WebSocket broadcasting), `alerts:triggered`, `news:breaking`, `whale:detected`. Publisher and subscriber classes. JSON serialization.

5. **Rate limiting (rate-limit.ts):** Sliding window algorithm using Redis sorted sets. Support multiple windows (per-second, per-minute, per-hour, per-day). Return: `{ allowed: boolean, remaining: number, reset: number, retryAfter?: number }`. Tier-aware limits.

6. **Leaderboard (leaderboard.ts):** Use Redis sorted sets for: top gainers (24h), top losers, most traded, trending (weighted by social + volume change). Update every 10s from price pipeline.

7. **Cache warming (warmup.ts):** On startup, preload: top 100 coins by market cap, global market stats, fear & greed, trending. Prevents cold-start cache misses.

8. **Compression (compression.ts):** For values > 1KB, compress with zstd before storing. Transparent compression/decompression. Reduces Redis memory by ~60%.

**Instructions:**
- Use `ioredis` v5+ (supports Redis 7 features)
- All cache operations should be wrapped in try/catch — cache failures should never crash the API
- Include metrics hooks for cache hit/miss rates
- Do NOT touch files outside `src/lib/cache/`
- Commit message: `feat(cache): add comprehensive Redis caching layer`

---

## Agent 10 — WebSocket Real-Time Streaming Server

**Goal:** Build a production WebSocket server for real-time price streaming, alerts, and live data feeds.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/ws/
  server.ts                 (WebSocket server setup)
  channels.ts               (channel/topic management)
  auth.ts                   (API key authentication for WS)
  handlers/
    prices.ts               (real-time price streaming)
    orderbook.ts            (live orderbook updates)
    trades.ts               (live trade feed)
    alerts.ts               (user alert notifications)
    news.ts                 (breaking news push)
  rate-limit.ts             (per-connection rate limiting)
  compression.ts            (per-message deflate)
  heartbeat.ts              (ping/pong keep-alive)
  metrics.ts                (connection/message metrics)
  protocol.ts               (message format definition)
```

**Requirements:**

1. **Protocol (protocol.ts):**
```typescript
// Client → Server
type Subscribe = { type: 'subscribe', channels: string[] }
type Unsubscribe = { type: 'unsubscribe', channels: string[] }
type Auth = { type: 'auth', apiKey: string }
type Ping = { type: 'ping' }

// Server → Client
type Update = { type: 'update', channel: string, data: unknown, ts: number }
type Error = { type: 'error', code: number, message: string }
type Pong = { type: 'pong' }
type Subscribed = { type: 'subscribed', channels: string[] }

// Channel format: "prices:btc", "orderbook:btc-usdt:binance", "trades:eth-usdt",
// "alerts:user123", "news:breaking", "market:global"
```

2. **Server (server.ts):** Use Bun's built-in WebSocket server OR `ws` library. Support 10,000+ concurrent connections. Binary and text messages. Per-message deflate compression. Graceful shutdown — close all connections with 1001 code.

3. **Channel management (channels.ts):** Topic-based pub/sub. Subscribe/unsubscribe per connection. Fan-out updates from Redis pub/sub to all subscribed clients. Wildcard subscriptions (`prices:*`).

4. **Auth (auth.ts):** Optional authentication via API key. Unauthenticated users: limited to 5 channels, prices only. Authenticated: up to 50 channels, all data types. Validate API key against database/cache.

5. **Price handler:** Subscribe to Redis pub/sub `prices:realtime`. Transform into client-friendly format. Throttle per-client: max 1 update per coin per second for free tier, real-time for paid.

6. **Orderbook handler:** Stream top-of-book updates. Clients can subscribe to specific pairs on specific exchanges. Delta updates (only send changes).

7. **Rate limiting:** Max 100 messages/second per connection. Max 5 subscribe requests/second. Disconnect abusive clients with 1008 (Policy Violation).

8. **Heartbeat:** Server sends ping every 30s. Client must respond with pong within 10s or connection is dropped. Track latency.

9. **Metrics:** Track: total connections, messages sent/received, channels by subscriber count, bandwidth, errors. Export to Prometheus.

**Instructions:**
- Use Bun's native WebSocket if available, fall back to `ws` library
- Integrate with Redis pub/sub from Agent 9's cache layer
- Use the auth system from Agent 6's schema (api_keys table)
- Binary protocol option for high-frequency data (MessagePack)
- Do NOT touch files outside `src/ws/`
- Commit message: `feat(ws): add production WebSocket real-time streaming server`
