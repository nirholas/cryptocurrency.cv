# Section 4: Market Data APIs (Agents 16–20)

> These agents build the core market data REST API endpoints that compete directly with CoinGecko and CoinMarketCap.

---

## Agent 16 — Coin & Token API Endpoints

**Goal:** Build the coin/token metadata and listing API endpoints — the foundation of any crypto data API.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/coins/
  route.ts                          (GET /coins — list all coins with pagination)
  [coinId]/
    route.ts                        (GET /coins/:coinId — full coin detail)
    market-chart/route.ts           (GET /coins/:coinId/market-chart — historical prices)
    ohlc/route.ts                   (GET /coins/:coinId/ohlc — OHLCV candles)
    tickers/route.ts                (GET /coins/:coinId/tickers — all exchange pairs)
    history/route.ts                (GET /coins/:coinId/history — snapshot at date)
  list/route.ts                     (GET /coins/list — simple ID/name/symbol list)
  markets/route.ts                  (GET /coins/markets — sorted by market cap)
  categories/route.ts               (GET /coins/categories — DeFi, L1, L2, Meme, etc)
  categories/[categoryId]/route.ts  (GET /coins/categories/:id — coins in category)
src/lib/services/
  coins.ts                          (coin service layer)
```

**API Specifications:**

1. **GET /api/v1/coins/list**
```
Query: per_page (default 100, max 250), page (default 1)
Response: [{ id: "bitcoin", symbol: "btc", name: "Bitcoin", platforms: {} }]
Cache: 10 minutes
No auth required
```

2. **GET /api/v1/coins/markets**
```
Query: vs_currency (usd/btc/eth), category, order (market_cap_desc, volume_desc, 
  price_change_24h_desc), per_page, page, sparkline (bool, 7d prices), 
  price_change_percentage (1h,24h,7d,14d,30d,200d,1y)
Response: [{ id, symbol, name, image, current_price, market_cap, market_cap_rank,
  fully_diluted_valuation, total_volume, high_24h, low_24h, price_change_24h,
  price_change_percentage_24h, market_cap_change_24h, circulating_supply,
  total_supply, max_supply, ath, ath_change_percentage, ath_date,
  atl, atl_change_percentage, atl_date, sparkline_in_7d, 
  price_change_percentage_1h, ...7d, ...30d, last_updated }]
Cache: 60 seconds
```

3. **GET /api/v1/coins/:coinId**
```
Query: localization (bool), tickers (bool), market_data (bool), 
  community_data (bool), developer_data (bool), sparkline (bool)
Response: { id, symbol, name, description, links, image, 
  genesis_date, market_cap_rank, market_data: { current_price, market_cap,
  total_volume, high_24h, low_24h, price_change_*, sparkline_7d },
  community_data: { twitter_followers, reddit_subscribers },
  developer_data: { forks, stars, subscribers, total_issues, closed_issues,
  pull_requests_merged, commit_count_4_weeks },
  categories, platforms, last_updated }
Cache: 5 minutes
```

4. **GET /api/v1/coins/:coinId/market-chart**
```
Query: vs_currency, days (1/7/14/30/90/180/365/max), interval (daily/hourly)
Response: { prices: [[timestamp, price]], market_caps: [[ts, mc]], total_volumes: [[ts, vol]] }
Cache: varies by days (1d = 60s, 7d = 300s, 30d+ = 600s)
```

5. **GET /api/v1/coins/:coinId/ohlc**
```
Query: vs_currency, days (1/7/14/30/90/180/365)
Response: [[timestamp, open, high, low, close]]
Cache: 300s
```

6. **GET /api/v1/coins/:coinId/tickers**
```
Query: exchange_ids, include_exchange_logo (bool), page, order (volume_desc, trust_score_desc)
Response: { tickers: [{ base, target, market: { name, identifier, has_trading_incentive },
  last, volume, converted_last, converted_volume, trust_score, bid_ask_spread,
  timestamp, last_traded_at, last_fetch_at, is_anomaly, is_stale, trade_url }] }
```

**Instructions:**
- Use Zod for request validation on all query parameters
- Use the service layer pattern: route.ts calls service function, service queries DB/cache
- CoinGecko-compatible response format where possible (for easy migration by users)
- Add `X-CG-Compatible: true` header for drop-in CoinGecko replacement
- Include comprehensive OpenAPI annotations (JSDoc or decorators)
- Cache with cache-aside pattern (check Redis → miss → query DB → populate Redis)
- Rate limiting via middleware (not in individual routes)
- Do NOT touch files outside `src/app/api/v1/coins/` and `src/lib/services/coins.ts`
- Commit message: `feat(api): add coin listing, detail, and market chart endpoints`

---

## Agent 17 — Exchange & Ticker API Endpoints

**Goal:** Build exchange-related API endpoints for exchange metadata, tickers, and volume data.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/exchanges/
  route.ts                          (GET /exchanges — list all exchanges)
  list/route.ts                     (GET /exchanges/list — simple list)
  [exchangeId]/
    route.ts                        (GET /exchanges/:id — exchange detail)
    tickers/route.ts                (GET /exchanges/:id/tickers — all pairs)
    volume-chart/route.ts           (GET /exchanges/:id/volume-chart — history)
src/app/api/v1/exchange-rates/
  route.ts                          (GET /exchange-rates — BTC to fiat/crypto)
src/lib/services/
  exchanges.ts                      (exchange service layer)
```

**API Specifications:**

1. **GET /api/v1/exchanges**
```
Query: per_page (max 250), page
Response: [{ id, name, year_established, country, url, image, 
  trust_score, trust_score_rank, trade_volume_24h_btc, 
  trade_volume_24h_btc_normalized }]
Cache: 5 minutes
```

2. **GET /api/v1/exchanges/:exchangeId**
```
Response: { name, year_established, country, description, url, image,
  facebook_url, reddit_url, telegram_url, slack_url, twitter_handle,
  has_trading_incentive, centralized, trust_score, trust_score_rank,
  trade_volume_24h_btc, trade_volume_24h_btc_normalized, 
  tickers: [...top 100 tickers by volume], status_updates }
```

3. **GET /api/v1/exchanges/:exchangeId/tickers**
```
Query: coin_ids (filter by coin), include_exchange_logo, page, order
Response: { name, tickers: [{ base, target, market, last, volume, 
  cost_to_move_up_usd, cost_to_move_down_usd, converted_last, 
  converted_volume, trust_score, bid_ask_spread_percentage,
  timestamp, last_traded_at, last_fetch_at, is_anomaly, is_stale }] }
```

4. **GET /api/v1/exchanges/:exchangeId/volume-chart**
```
Query: days (1/7/14/30/90/180/365)
Response: [[timestamp, volume_btc]]
```

5. **GET /api/v1/exchange-rates**
```
Response: { rates: { btc: { name, unit, value, type }, eth: { ... }, usd: { ... },
  eur: { ... }, gbp: { ... }, jpy: { ... }, ... 50+ currencies } }
Cache: 60 seconds
```

**Data Sources:**
- Aggregate from Binance, Coinbase, Kraken, OKX, Bybit REST APIs
- CoinGecko as fallback for smaller exchanges
- Exchange trust scores calculated from: age, regulatory compliance, proof of reserves, incident history

**Instructions:**
- CoinGecko-compatible response format
- Use Redis-cached exchange data from the data pipeline
- Include exchange logos served from Cloud Storage or CDN
- Support filtering exchanges by: country, centralized/decentralized, minimum trust score
- Do NOT touch files outside `src/app/api/v1/exchanges/`, `src/app/api/v1/exchange-rates/`, and `src/lib/services/exchanges.ts`
- Commit message: `feat(api): add exchange listing, tickers, and volume endpoints`

---

## Agent 18 — Global Market Data & Trending

**Goal:** Build global market overview, trending coins, and market aggregate endpoints.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/global/
  route.ts                          (GET /global — global market data)
  decentralized-finance/route.ts    (GET /global/defi — DeFi global stats)
src/app/api/v1/search/
  route.ts                          (GET /search — search coins, exchanges, categories)
  trending/route.ts                 (GET /search/trending — trending coins)
src/app/api/v1/simple/
  price/route.ts                    (GET /simple/price — simple price lookup)
  supported-vs-currencies/route.ts  (GET /simple/supported-vs-currencies)
  token-price/
    [platformId]/route.ts           (GET /simple/token-price/:platform — by contract)
src/app/api/v1/fear-greed/
  route.ts                          (GET /fear-greed — current + historical)
src/lib/services/
  global.ts
  search.ts
  simple.ts
```

**API Specifications:**

1. **GET /api/v1/global**
```
Response: { data: { active_cryptocurrencies, upcoming_icos, ongoing_icos, ended_icos,
  markets, total_market_cap: { usd, btc, eth, ... }, total_volume: { ... },
  market_cap_percentage: { btc: 52.3, eth: 17.1, ... }, 
  market_cap_change_percentage_24h_usd, updated_at } }
Cache: 60 seconds
```

2. **GET /api/v1/global/defi**
```
Response: { data: { defi_market_cap, eth_market_cap, defi_to_eth_ratio,
  trading_volume_24h, defi_dominance, top_coin_name, top_coin_defi_dominance } }
```

3. **GET /api/v1/search/trending**
```
Response: { coins: [{ item: { id, coin_id, name, symbol, market_cap_rank,
  thumb, small, large, slug, price_btc, score } }], nfts: [...], categories: [...] }
Ranking factors: search volume (40%), price change velocity (30%), social volume (20%), whale activity (10%)
Cache: 5 minutes
```

4. **GET /api/v1/search?query=bitcoin**
```
Response: { coins: [{ id, name, api_symbol, symbol, market_cap_rank, thumb, large }],
  exchanges: [{ id, name, market_type, thumb, large }],
  categories: [{ id, name }] }
Full-text search using PostgreSQL tsvector or Redis search
```

5. **GET /api/v1/simple/price**
```
Query: ids (comma-sep), vs_currencies (comma-sep), include_market_cap, 
  include_24hr_vol, include_24hr_change, include_last_updated_at, precision
Response: { bitcoin: { usd: 95000, usd_market_cap: 1800000000000, 
  usd_24h_vol: 45000000000, usd_24h_change: 2.5, last_updated_at: 1709330000 } }
Cache: 10 seconds (hot path — most used endpoint)
```

6. **GET /api/v1/simple/token-price/:platformId**
```
Query: contract_addresses (comma-sep), vs_currencies, include_market_cap, etc.
Response: { "0x...": { usd: 1.50, ... } }
Platforms: ethereum, polygon-pos, arbitrum-one, optimistic-ethereum, avalanche, 
  base, solana, bsc
```

7. **GET /api/v1/fear-greed**
```
Query: days (default 1, max 365)
Response: { value: 72, label: "Greed", timestamp, history: [{ value, label, timestamp }] }
```

**Instructions:**
- The `/simple/price` endpoint is THE most-called endpoint — optimize aggressively (Redis first, never hit DB)
- Implement search using PostgreSQL `to_tsvector` with `ts_rank_cd` for ranking
- Trending algorithm should be calculated by a background worker and cached
- Support CORS for browser-based usage
- CoinGecko-compatible response format
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add global market data, search, trending, and simple price endpoints`

---

## Agent 19 — OHLCV & Historical Data API

**Goal:** Build comprehensive historical data endpoints with flexible time ranges and intervals.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/historical/
  route.ts                          (GET /historical — historical price data)
  ohlcv/route.ts                    (GET /historical/ohlcv — OHLCV candles)
  market-cap/route.ts               (GET /historical/market-cap — historical MC)
  volume/route.ts                   (GET /historical/volume — historical volume)
  dominance/route.ts                (GET /historical/dominance — BTC/ETH dominance)
  ath/route.ts                      (GET /historical/ath — ATH tracker)
  snapshots/route.ts                (GET /historical/snapshots — market snapshots)
src/app/api/v1/compare/
  route.ts                          (GET /compare — compare coins over time)
src/lib/services/
  historical.ts                     (historical data service)
```

**API Specifications:**

1. **GET /api/v1/historical/ohlcv**
```
Query: coin_id, vs_currency, interval (1m/5m/15m/1h/4h/1d/1w/1M), 
  from (unix timestamp), to (unix timestamp), limit (max 5000)
Response: { data: [{ timestamp, open, high, low, close, volume }], 
  meta: { coin_id, interval, from, to, count } }
Interval routing: 1m/5m/15m → ohlcv_1m table, 1h/4h → ohlcv_1h, 1d/1w/1M → ohlcv_1d
Roll-up logic for 5m/15m/4h/1w/1M from base intervals
```

2. **GET /api/v1/historical**
```
Query: coin_id, vs_currency, from, to, interval (auto/hourly/daily)
Response: { prices: [[ts, price]], market_caps: [[ts, mc]], volumes: [[ts, vol]] }
Auto interval: <2d → hourly, <90d → daily, >90d → daily (sampled)
```

3. **GET /api/v1/historical/dominance**
```
Query: from, to, interval
Response: { data: [{ timestamp, btc_dominance, eth_dominance, 
  stablecoin_dominance, defi_dominance, other }] }
```

4. **GET /api/v1/historical/ath**
```
Query: coin_ids (comma-sep)
Response: { bitcoin: { ath_price: 108000, ath_date: "2025-01-20", 
  current_price: 95000, percent_from_ath: -12.03, 
  days_since_ath: 405, ath_market_cap: 2100000000000 } }
```

5. **GET /api/v1/compare**
```
Query: coin_ids (comma-sep, max 10), vs_currency, days, include_market_cap, include_volume
Response: { coins: { bitcoin: { prices: [...], market_caps: [...] }, 
  ethereum: { prices: [...], market_caps: [...] } } }
Normalize start values to 100 for easy comparison
```

**Performance Requirements:**
- Queries over large time ranges should use TimescaleDB continuous aggregates
- Support downsampling: if user requests 1y of hourly data (8760 points), server can downsample to ~1000 points and return
- Support `precision` parameter (1-18 decimal places)
- Support CSV export via `Accept: text/csv` header

**Instructions:**
- Use TimescaleDB `time_bucket()` for aggregation queries
- Create continuous aggregates for common intervals (1h, 1d) if not already existing
- Support both Unix timestamp and ISO 8601 date format
- Max response size: 10,000 data points
- Pro/Enterprise only: 1-minute data. Free: daily only. Developer: hourly.
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add OHLCV, historical data, and coin comparison endpoints`

---

## Agent 20 — Orderbook & Trading Data API

**Goal:** Build real-time orderbook depth, trade history, and liquidity analysis endpoints.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/orderbook/
  route.ts                          (GET /orderbook — order book depth)
  [exchangeId]/
    [pair]/route.ts                 (GET /orderbook/:exchange/:pair)
src/app/api/v1/trades/
  route.ts                          (GET /trades — recent trades)
  [exchangeId]/
    [pair]/route.ts                 (GET /trades/:exchange/:pair)
src/app/api/v1/liquidity/
  route.ts                          (GET /liquidity — liquidity analysis)
  [coinId]/route.ts                 (GET /liquidity/:coinId — coin liquidity)
src/app/api/v1/spreads/
  route.ts                          (GET /spreads — bid-ask spreads across exchanges)
src/lib/services/
  orderbook.ts
  trades.ts
  liquidity.ts
```

**API Specifications:**

1. **GET /api/v1/orderbook/:exchange/:pair**
```
Query: depth (10/25/50/100, default 25)
Response: { exchange, pair, timestamp, bids: [[price, quantity]], 
  asks: [[price, quantity]], spread: 0.01, spread_percentage: 0.001,
  depth_2pct_bid: 5000000, depth_2pct_ask: 4800000 }
Cache: 1 second (extremely hot)
```

2. **GET /api/v1/orderbook (aggregated)**
```
Query: coin_id, vs_currency, depth
Response: { coin_id, aggregated_bids: [...], aggregated_asks: [...],
  best_bid: { price, exchange }, best_ask: { price, exchange },
  exchanges: ["binance", "coinbase", ...] }
Aggregates orderbooks across all exchanges for the same pair
```

3. **GET /api/v1/trades/:exchange/:pair**
```
Query: limit (max 1000, default 100)
Response: { trades: [{ id, price, quantity, time, is_buyer_maker,
  quote_quantity }] }
```

4. **GET /api/v1/liquidity/:coinId**
```
Response: { coin_id, liquidity_score: 850 (0-1000), 
  depth_2pct: { bid_usd: 50000000, ask_usd: 48000000 },
  avg_spread_pct: 0.05, exchanges_count: 45, 
  top_exchanges: [{ name, volume_share_pct, spread_pct }],
  daily_volume_to_mcap_ratio: 0.03 }
Cache: 5 minutes
```

5. **GET /api/v1/spreads**
```
Query: coin_id
Response: { spreads: [{ exchange, pair, bid, ask, spread_pct, volume_24h, 
  last_updated }] }
Useful for arbitrage detection
```

**Instructions:**
- Orderbook data comes from exchange WebSocket feeds (Agent 7)
- Free tier: aggregated orderbook only (no per-exchange). Pro: per-exchange, 100 depth.
- Support MessagePack format for lower bandwidth (`Accept: application/msgpack`)
- Include `X-Data-Freshness-Ms` header showing data age in milliseconds
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add orderbook, trades, liquidity, and spread endpoints`
