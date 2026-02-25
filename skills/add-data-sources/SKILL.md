---
name: add-data-sources
description: Prompts to integrate 50+ new crypto data sources into free-crypto-news, wiring them through the provider chain framework with circuit breakers, anomaly detection, and consensus. Covers market data, on-chain analytics, DeFi, derivatives, social, news, and blockchain-specific APIs.
license: MIT
metadata:
  category: data-sources
  difficulty: advanced
  author: free-crypto-news
  tags: [providers, api, data-sources, defi, on-chain, derivatives, social, market-data]
---

# Add Data Sources — Prompt Playbook

> **Goal**: Expand free-crypto-news from 3 market-price adapters to 50+ data sources across all 15 DataCategories, all wired through the resilient ProviderChain framework with circuit breakers, rate limiting, consensus, and health monitoring.

## Current State

### Provider Framework (src/lib/providers/)
- **ProviderChain** supports 4 strategies: fallback, race, consensus, broadcast
- **Built-in protections**: circuit breakers, rate limiting, anomaly detection, stale-while-revalidate caching
- **15 DataCategories defined** in types.ts — only `market-price` is implemented

### Implemented Adapters
| Provider | Category | Weight |
|----------|----------|--------|
| CoinGecko | market-price | 0.40 |
| CoinCap | market-price | 0.25 |
| Binance | market-price | 0.30 |

### Client Libraries Already Built (src/lib/apis/)
CoinMarketCap, CryptoQuant, DefiLlama, Glassnode, L2Beat, LunarCrush, Messari, NFT Markets (OpenSea + Reservoir), The Graph, CryptoPanic, NewsAPI — these exist but are NOT wired through the ProviderChain framework.

## How Adapters Work

Each adapter implements the `DataProvider<T>` interface:
```typescript
{
  name: string;           // e.g., 'coingecko'
  priority: number;       // lower = tried first
  weight: number;         // 0-1, for consensus fusion
  rateLimit: { maxRequests: number; windowMs: number };
  capabilities: string[];
  fetch(params: FetchParams): Promise<T>;
  healthCheck?(): Promise<boolean>;
  normalize?(raw: unknown): T;
  validate?(data: T): boolean;
}
```

Adapters go in `src/lib/providers/adapters/{category}/` and are wired into a ProviderChain in each category's `index.ts`.

---

## Prompt Sequence

### API Keys You'll Need

| Service | Free Tier | Signup URL | Used For |
|---------|-----------|------------|----------|
| CoinGecko | 30 req/min (no key) or 500/min (demo key) | https://www.coingecko.com/en/api/pricing | Already integrated |
| CoinMarketCap | 333 req/day | https://coinmarketcap.com/api/ | Market data, rankings |
| Etherscan | 5 req/sec | https://etherscan.io/apis | Gas, ETH on-chain |
| Polygonscan | 5 req/sec | https://polygonscan.com/apis | Polygon data |
| BscScan | 5 req/sec | https://bscscan.com/apis | BSC data |
| Arbiscan | 5 req/sec | https://arbiscan.io/apis | Arbitrum data |
| BaseScan | 5 req/sec | https://basescan.org/apis | Base data |
| Solscan | Free tier | https://pro.solscan.io/ | Solana on-chain |
| Helius | 50K credits/day | https://dev.helius.xyz/ | Solana RPC + DAS |
| Alchemy | 300M compute/mo | https://www.alchemy.com/ | Multi-chain RPC |
| Infura | 100K req/day | https://www.infura.io/ | Ethereum RPC |
| The Graph | 100K queries/mo | https://thegraph.com/studio/ | Subgraph data |
| Dune Analytics | Limited free | https://dune.com/settings/api | SQL on-chain queries |
| Flipside | Free tier | https://flipsidecrypto.xyz/ | SQL on-chain queries |
| CryptoQuant | Limited free | https://cryptoquant.com/pricing | Exchange flows |
| Glassnode | Limited free | https://studio.glassnode.com/ | On-chain metrics |
| Santiment | Limited free | https://app.santiment.net/ | Social + on-chain |
| LunarCrush | Free v4 | https://lunarcrush.com/developers | Social metrics |
| Messari | Free tier | https://messari.io/api | Research data |
| DeFi Pulse | Free | https://defipulse.com/api | DeFi TVL |
| DefiLlama | Free (no key) | https://defillama.com/docs/api | TVL, yields, DEX volumes |
| CryptoPanic | Free with key | https://cryptopanic.com/developers/api/ | News aggregation |
| NewsAPI | 100 req/day | https://newsapi.org/ | Mainstream news |
| Whale Alert | 10 req/min | https://whale-alert.io/api | Whale transactions |
| Chainlink | Free (on-chain) | N/A | Oracle prices |
| Pyth Network | Free (on-chain) | N/A | Oracle prices |
| Coinalyze | Free tier | https://coinalyze.net/api/ | Futures data |
| Laevitas | Free tier | https://www.laevitas.ch/ | Options data |
| Kaiko | Requires account | https://www.kaiko.com/ | Institutional data |
| Token Terminal | Free tier | https://tokenterminal.com/api | Protocol revenue |
| Nansen | Requires plan | https://www.nansen.ai/api | Smart money tracking |

---

### Prompt 1 — Market Price: Add 5 More Exchanges

```
Add 5 new market price provider adapters to the existing market-price ProviderChain.

Create these files in src/lib/providers/adapters/market-price/:

1. coinmarketcap.adapter.ts
   - API: pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest
   - API key via COINMARKETCAP_API_KEY env var
   - Priority: 4, Weight: 0.35
   - Rate limit: 30/min (basic plan)
   - Normalize CMC response to MarketPrice[] format
   - Map CMC IDs to CoinGecko IDs using a lookup table

2. coinpaprika.adapter.ts
   - API: api.coinpaprika.com/v1/tickers
   - No API key required
   - Priority: 5, Weight: 0.20
   - Rate limit: 10/min
   - Normalize to MarketPrice[] format

3. kraken.adapter.ts
   - API: api.kraken.com/0/public/Ticker
   - No API key required
   - Priority: 6, Weight: 0.25
   - Rate limit: 15/sec
   - Uses pair format (XXBTZUSD) — include pair mapping table

4. okx.adapter.ts
   - API: www.okx.com/api/v5/market/tickers?instType=SPOT
   - No API key required
   - Priority: 7, Weight: 0.20
   - Rate limit: 20/sec

5. bybit.adapter.ts
   - API: api.bybit.com/v5/market/tickers?category=spot
   - No API key required
   - Priority: 8, Weight: 0.20
   - Rate limit: 120/min

Update src/lib/providers/adapters/market-price/index.ts to:
- Add all 5 to the default marketPriceChain (fallback strategy)
- Create marketPriceConsensusChain with all 8 providers (consensus strategy)
- Export a factory function createMarketPriceChain(options) that lets callers pick which exchanges to include

Each adapter must:
- Implement DataProvider<MarketPrice[]> interface
- Include normalize() to convert exchange-specific response to MarketPrice format
- Include validate() to check for reasonable price ranges (> 0, not NaN)
- Include healthCheck() that pings the exchange's status/health endpoint
- Handle pagination for large coin lists
- Map exchange-specific IDs to CoinGecko IDs
```

---

### Prompt 2 — Funding Rates Category

```
Implement the "funding-rate" DataCategory with a full ProviderChain.

Create src/lib/providers/adapters/funding-rate/:

1. types.ts — Define FundingRate interface:
   { symbol, exchange, rate, nextFundingTime, markPrice, indexPrice, openInterest, timestamp }

2. binance-futures.adapter.ts
   - API: fapi.binance.com/fapi/v1/premiumIndex
   - No key required, 2400 req/min
   - Priority: 1, Weight: 0.35

3. bybit-futures.adapter.ts
   - API: api.bybit.com/v5/market/tickers?category=linear
   - No key required, 120 req/min
   - Priority: 2, Weight: 0.25

4. okx-futures.adapter.ts
   - API: www.okx.com/api/v5/public/funding-rate
   - No key required, 20 req/sec
   - Priority: 3, Weight: 0.20

5. dydx.adapter.ts
   - API: api.dydx.exchange/v3/markets
   - No key required, 100 req/10sec
   - Priority: 4, Weight: 0.15

6. hyperliquid.adapter.ts
   - API: api.hyperliquid.xyz/info (POST with {"type": "metaAndAssetCtxs"})
   - No key required
   - Priority: 5, Weight: 0.15

7. index.ts — Wire into fundingRateChain:
   - Default strategy: consensus (fuse rates from multiple exchanges)
   - Also export fundingRateFallbackChain for quick lookups

8. Register in src/lib/providers/registry-init.ts:
   registry.register('funding-rate', fundingRateChain)

Update src/app/api/funding-rates/route.ts to use the new chain instead of ad-hoc fetch calls.
```

---

### Prompt 3 — DeFi TVL + Yields Category

```
Implement "tvl" and "defi-yields" DataCategories with ProviderChains.

Create src/lib/providers/adapters/tvl/:

1. types.ts — Define TVLData interface:
   { protocol, chain, tvl, tvlChange24h, tvlChange7d, category, chains[], mcapTvl?, timestamp }

2. defillama.adapter.ts
   - API: api.llama.fi/protocols + api.llama.fi/v2/chains
   - No key required, generous rate limits
   - Priority: 1, Weight: 0.50
   - This is the gold standard for TVL data

3. defi-pulse.adapter.ts
   - API: data-api.defipulse.com/api/v1/defipulse/api/GetProjects
   - Free API key via DEFIPULSE_API_KEY
   - Priority: 2, Weight: 0.25

4. token-terminal.adapter.ts
   - API: api.tokenterminal.com/v2/protocols
   - API key via TOKEN_TERMINAL_API_KEY
   - Priority: 3, Weight: 0.25  
   - Also provides revenue data — normalize to TVLData with extra fields

5. index.ts — tvlChain (fallback, DefiLlama primary)

Create src/lib/providers/adapters/defi-yields/:

1. types.ts — Define YieldData:
   { pool, protocol, chain, apy, tvl, apyBase, apyReward, rewardTokens[], stablecoin, ilRisk, exposure, timestamp }

2. defillama-yields.adapter.ts
   - API: yields.llama.fi/pools
   - Priority: 1, Weight: 0.50

3. defi-rate.adapter.ts
   - Aggregate from on-chain sources via The Graph subgraphs (Aave, Compound, Curve)
   - Priority: 2, Weight: 0.30

4. index.ts — yieldsChain (fallback strategy)

Register both in the provider registry.
Update /api/defi, /api/yields, /api/defi/summary route handlers to use the new chains.
```

---

### Prompt 4 — On-Chain Analytics Category

```
Implement the "on-chain" DataCategory with adapters for Bitcoin and Ethereum on-chain metrics.

Create src/lib/providers/adapters/on-chain/:

1. types.ts — Define OnChainMetrics:
   {
     metric: string, // e.g., "exchange_netflow", "active_addresses"
     chain: string,
     value: number,
     timestamp: number,
     source: string,
     resolution: '1h' | '1d' | '1w',
   }

2. glassnode.adapter.ts
   - API: api.glassnode.com/v1/metrics/*
   - API key via GLASSNODE_API_KEY
   - Priority: 1, Weight: 0.40
   - Endpoints: exchange flows, miner metrics, SOPR, NUPL, active addresses
   - Rate limit: 10/min (free tier)

3. cryptoquant.adapter.ts
   - API: api.cryptoquant.com/v1/*
   - API key via CRYPTOQUANT_API_KEY
   - Priority: 2, Weight: 0.35
   - Endpoints: exchange reserves, netflow, stablecoin flows, miner flows

4. santiment.adapter.ts
   - API: api.santiment.net/graphql
   - API key via SANTIMENT_API_KEY
   - Priority: 3, Weight: 0.25
   - GraphQL queries for: daily active addresses, exchange inflow/outflow, social volume, dev activity

5. blockchain-info.adapter.ts
   - API: blockchain.info/q/* and api.blockchain.info/stats
   - No key required
   - Priority: 4, Weight: 0.15
   - BTC-specific: hashrate, difficulty, unconfirmed tx count, mempool size

6. dune.adapter.ts
   - API: api.dune.com/api/v1/query/{query_id}/execute + results
   - API key via DUNE_API_KEY
   - Priority: 5, Weight: 0.20
   - Pre-built query IDs for common metrics (DEX volume, stablecoin supply, bridge flows)
   - Cache aggressively — Dune queries can be slow

7. index.ts — onChainChain:
   - Default strategy: fallback (Glassnode → CryptoQuant → Santiment → blockchain.info → Dune)
   - Also export onChainConsensusChain for cross-source validated metrics

Register in provider registry. Update /api/onchain/* routes.
```

---

### Prompt 5 — Social Metrics Category

```
Implement the "social-metrics" DataCategory.

Create src/lib/providers/adapters/social/:

1. types.ts — Define SocialMetrics:
   {
     coin: string,
     twitterMentions: number,
     redditPosts: number,
     socialVolume: number,
     socialDominance: number,
     sentiment: number, // -1 to 1
     galaxyScore?: number,
     altRank?: number,
     influencerMentions: number,
     timestamp: number,
   }

2. lunarcrush.adapter.ts
   - API: lunarcrush.com/api4/public/coins/list
   - No key required for v4 public endpoints
   - Priority: 1, Weight: 0.40
   - Provides: Galaxy Score, AltRank, social volume, sentiment, social dominance

3. santiment-social.adapter.ts
   - API: api.santiment.net/graphql
   - API key via SANTIMENT_API_KEY
   - Priority: 2, Weight: 0.30
   - Queries: social_volume, social_dominance, sentiment_balance

4. cryptopanic-sentiment.adapter.ts
   - API: cryptopanic.com/api/v1/posts/?auth_token=KEY&filter=hot
   - API key via CRYPTOPANIC_API_KEY
   - Priority: 3, Weight: 0.15
   - Derive sentiment from vote counts (bullish/bearish ratio)

5. reddit.adapter.ts
   - API: oauth.reddit.com/r/cryptocurrency + /r/bitcoin + /r/ethereum
   - OAuth via REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
   - Priority: 4, Weight: 0.15
   - Track: post count, comment count, upvote ratio for crypto subreddits

6. index.ts — socialMetricsChain (consensus strategy to fuse sentiment from multiple sources)

Register in provider registry. Update /api/social/* routes.
```

---

### Prompt 6 — Gas Fees + Mempool Categories

```
Implement "gas-fees" and "mempool" DataCategories.

Create src/lib/providers/adapters/gas/:

1. types.ts — Define GasData:
   {
     chain: string,
     low: { gwei: number, usd: number, time: string },
     medium: { gwei: number, usd: number, time: string },
     high: { gwei: number, usd: number, time: string },
     baseFee?: number,
     timestamp: number,
   }

2. etherscan.adapter.ts
   - API: api.etherscan.io/api?module=gastracker&action=gasoracle
   - API key via ETHERSCAN_API_KEY (5/sec free)
   - Priority: 1, Weight: 0.35

3. alchemy-gas.adapter.ts
   - API: eth-mainnet.g.alchemy.com/v2/KEY (eth_gasPrice + eth_feeHistory)
   - API key via ALCHEMY_API_KEY
   - Priority: 2, Weight: 0.35

4. blocknative.adapter.ts
   - API: api.blocknative.com/gasprices/blockprices
   - API key via BLOCKNATIVE_API_KEY
   - Priority: 3, Weight: 0.30
   - Excellent gas prediction quality

5. index.ts — gasChain (consensus strategy — fuse gas estimates)

Create src/lib/providers/adapters/mempool/:

1. types.ts — Define MempoolData:
   {
     chain: string,
     txCount: number,
     totalFees: number,
     feeHistogram: Array<[number, number]>,
     recommendedFees: { fastest: number, halfHour: number, hour: number, economy: number },
     blockHeight: number,
     timestamp: number,
   }

2. mempool-space.adapter.ts
   - API: mempool.space/api
   - No key required
   - Priority: 1, Weight: 0.50
   - BTC mempool: /api/mempool, /api/v1/fees/recommended, /api/blocks/tip/height

3. blockstream.adapter.ts
   - API: blockstream.info/api
   - No key required
   - Priority: 2, Weight: 0.30

4. blockchain-com.adapter.ts
   - API: blockchain.info/q/unconfirmedcount, /q/24hrbtcsent
   - Priority: 3, Weight: 0.20

5. index.ts — mempoolChain (fallback strategy, mempool.space primary)

Register both. Update /api/gas/* and /api/bitcoin/mempool routes.
```

---

### Prompt 7 — Whale Alerts + Liquidations Categories

```
Implement "whale-alerts" and "liquidations" DataCategories.

Create src/lib/providers/adapters/whale-alerts/:

1. types.ts — Define WhaleAlert:
   {
     hash: string,
     chain: string,
     from: { address: string, label?: string, type: 'exchange' | 'whale' | 'unknown' },
     to: { address: string, label?: string, type: 'exchange' | 'whale' | 'unknown' },
     amount: number,
     amountUsd: number,
     symbol: string,
     timestamp: number,
   }

2. whale-alert-api.adapter.ts
   - API: api.whale-alert.io/v1/transactions
   - API key via WHALE_ALERT_API_KEY (10/min free)
   - Priority: 1, Weight: 0.40

3. etherscan-whale.adapter.ts
   - API: Monitor large ERC-20 transfers via api.etherscan.io/api?module=account&action=tokentx
   - Filter for transfers > $1M USD
   - Priority: 2, Weight: 0.25

4. arkham.adapter.ts
   - API: If available, Arkham Intelligence API for labeled address tracking
   - Priority: 3, Weight: 0.35

5. index.ts — whaleAlertChain

Create src/lib/providers/adapters/liquidations/:

1. types.ts — Define LiquidationData:
   {
     exchange: string,
     symbol: string,
     side: 'long' | 'short',
     quantity: number,
     price: number,
     amountUsd: number,
     timestamp: number,
   }

2. coinalyze.adapter.ts
   - API: api.coinalyze.net/v1/liquidation-history
   - API key via COINALYZE_API_KEY
   - Priority: 1, Weight: 0.35

3. binance-liquidations.adapter.ts
   - WebSocket: wss://fstream.binance.com/ws/!forceOrder@arr
   - Buffer last 5 minutes of liquidations, serve via fetch()
   - Priority: 2, Weight: 0.35

4. bybit-liquidations.adapter.ts
   - Similar WebSocket approach for Bybit
   - Priority: 3, Weight: 0.30

5. index.ts — liquidationsChain

Register both. Update /api/whale-alerts and /api/liquidations routes.
```

---

### Prompt 8 — Stablecoin Flows + Fear & Greed

```
Implement "stablecoin-flows" and "fear-greed" DataCategories.

Create src/lib/providers/adapters/stablecoin/:

1. types.ts — Define StablecoinFlow:
   {
     stablecoin: string, // USDT, USDC, DAI, etc.
     totalSupply: number,
     supplyChange24h: number,
     supplyChange7d: number,
     chainBreakdown: Array<{ chain: string, supply: number, change24h: number }>,
     exchangeReserves: number,
     timestamp: number,
   }

2. defillama-stablecoins.adapter.ts
   - API: stablecoins.llama.fi/stablecoins + stablecoins.llama.fi/stablecoinchains
   - No key required
   - Priority: 1, Weight: 0.50

3. cryptoquant-stables.adapter.ts
   - API: api.cryptoquant.com/v1/stablecoin/*
   - Priority: 2, Weight: 0.30

4. dune-stables.adapter.ts
   - Pre-built Dune queries for stablecoin supply and flows
   - Priority: 3, Weight: 0.20

5. index.ts — stablecoinChain

Create src/lib/providers/adapters/fear-greed/:

1. types.ts — Define FearGreedData:
   {
     value: number, // 0-100
     classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed',
     previousClose: number,
     change24h: number,
     timestamp: number,
     components?: { volatility: number, momentum: number, social: number, dominance: number, trends: number },
   }

2. alternative-me.adapter.ts
   - API: api.alternative.me/fng/?limit=1
   - No key, generous limits
   - Priority: 1, Weight: 0.40

3. coingecko-fng.adapter.ts
   - Derive from CoinGecko's BTC data (volatility + volume analysis)
   - Priority: 2, Weight: 0.30

4. composite-fng.adapter.ts
   - Build our OWN composite index from:
     - BTC 30-day realized volatility
     - BTC momentum (SMA 50 vs SMA 200)
     - Social sentiment (from social-metrics chain)
     - BTC dominance change
     - Google Trends data for "bitcoin"
   - Priority: 3, Weight: 0.30

5. index.ts — fearGreedChain (consensus to fuse multiple F&G signals)

Register both. Update relevant route handlers.
```

---

### Prompt 9 — Order Book + Open Interest + OHLCV

```
Implement the remaining derivatives/trading DataCategories: "order-book", "open-interest", "ohlcv".

For each category, create adapters in src/lib/providers/adapters/{category}/:

ORDER BOOK (src/lib/providers/adapters/orderbook/):
- binance.adapter.ts — api.binance.com/api/v3/depth (no key, 5000 weight/min)
- kraken.adapter.ts — api.kraken.com/0/public/Depth (no key)  
- okx.adapter.ts — www.okx.com/api/v5/market/books (no key)
- Type: OrderBookData { exchange, symbol, bids: [price, qty][], asks: [price, qty][], spread, spreadPct, timestamp }
- Strategy: broadcast (get all books for comparison / aggregated book)

OPEN INTEREST (src/lib/providers/adapters/open-interest/):
- binance-oi.adapter.ts — fapi.binance.com/fapi/v1/openInterest
- bybit-oi.adapter.ts — api.bybit.com/v5/market/open-interest
- okx-oi.adapter.ts — www.okx.com/api/v5/public/open-interest
- coinalyze-oi.adapter.ts — api.coinalyze.net/v1/open-interest
- Type: OpenInterestData { symbol, exchange, openInterest, openInterestUsd, change24h, timestamp }
- Strategy: consensus (fuse OI from multiple venues)

OHLCV (src/lib/providers/adapters/ohlcv/):
- coingecko-ohlcv.adapter.ts — api.coingecko.com/api/v3/coins/{id}/ohlc
- binance-ohlcv.adapter.ts — api.binance.com/api/v3/klines
- kraken-ohlcv.adapter.ts — api.kraken.com/0/public/OHLC
- Type: OHLCVData { symbol, exchange, timeframe, candles: Array<{ open, high, low, close, volume, timestamp }> }
- Strategy: fallback (CoinGecko primary, Binance fallback)

Wire all into ProviderChains, register in provider registry, update route handlers.
```

---

### Prompt 10 — Provider Registry Initialization + Health Dashboard

```
Create a centralized provider registry initialization and health dashboard.

Requirements:
1. Create src/lib/providers/registry-init.ts that:
   - Imports ALL category chains (market-price, funding-rate, tvl, defi-yields, on-chain, social-metrics, gas-fees, mempool, whale-alerts, liquidations, stablecoin-flows, fear-greed, order-book, open-interest, ohlcv)
   - Registers each with the global registry
   - Only enables adapters whose API keys are configured (check env vars)
   - Logs which providers are active on startup
   - Export an initProviders() function called from app initialization

2. Create src/app/api/providers/health/route.ts:
   - GET /api/providers/health — returns health for all registered chains
   - Response: { chains: { [category]: { status, providers: [{ name, state, successRate, avgLatency }] } } }

3. Create src/app/api/providers/[category]/route.ts:
   - GET /api/providers/{category} — fetch data through the chain for any category
   - Supports all FetchParams as query params

4. Create src/app/(admin)/admin/providers/page.tsx:
   - Dashboard showing all provider chains
   - Per-provider: circuit breaker state (green/yellow/red), success rate, latency, last error
   - Real-time updates via SSE or polling
   - Ability to manually trip/reset circuit breakers

5. Update src/app/layout.tsx or a server component to call initProviders() on app startup

6. Add provider health to the /api/health endpoint response
```

---

## New Data Sources NOT Yet In The Codebase

These are additional APIs worth integrating in future prompts:

### Blockchain RPCs (Multi-Chain)
- **QuickNode** — Multi-chain RPC with enhanced APIs
- **Ankr** — Free public RPCs + premium advanced queries
- **Chainstack** — Enterprise RPCs with archive nodes

### Solana Ecosystem
- **Jupiter** (jup.ag/api) — DEX aggregator, token prices, swap routes
- **Birdeye** (public-api.birdeye.so) — Solana token analytics
- **Tensor** (api.tensor.so) — Solana NFT data

### L2 / Rollup Data
- **L2Beat** — Already have client, needs adapter
- **Orbiter Finance** — Bridge volume data
- **LayerZero Scan** — Cross-chain message data

### Protocol-Specific
- **Lido** (stake.lido.fi/api) — ETH staking data
- **EigenLayer** — Restaking metrics
- **Uniswap** (The Graph) — DEX volume, TVL, pool data
- **Aave** (The Graph) — Lending rates, utilization
- **MakerDAO** — DAI supply, collateral ratios

### Alternative Data
- **Google Trends** (via SerpAPI or unofficial) — Search interest
- **GitHub** (api.github.com) — Developer activity per project
- **Electric Capital** — Developer report data
- **Token Unlocks** (token.unlocks.app/api) — Vesting schedules

## Execution Order

| Phase | Prompts | New Providers | Categories Completed |
|-------|---------|---------------|---------------------|
| **1** | 1 (Exchanges) | +5 | market-price (8 total) |
| **2** | 2 (Funding) + 3 (DeFi) | +10 | funding-rate, tvl, defi-yields |
| **3** | 4 (On-Chain) + 5 (Social) | +9 | on-chain, social-metrics |
| **4** | 6 (Gas/Mempool) + 7 (Whales) | +11 | gas-fees, mempool, whale-alerts, liquidations |
| **5** | 8 (Stables/FNG) + 9 (Trading) | +14 | stablecoin-flows, fear-greed, order-book, open-interest, ohlcv |
| **6** | 10 (Registry) | 0 | All 15 categories wired + dashboard |

**Total: ~50+ new provider adapters across all 15 DataCategories.**
