---
name: add-data-sources
description: Prompts to integrate 70+ new crypto data sources into free-crypto-news, wiring them through the ProviderChain framework with circuit breakers, anomaly detection, and consensus. Covers market data, on-chain analytics, DeFi, derivatives, social, news, Solana ecosystem, L2s, NFTs, prediction markets, RWA, MEV, and more.
license: MIT
metadata:
  category: data-sources
  difficulty: advanced
  author: free-crypto-news
  tags: [providers, api, data-sources, defi, on-chain, derivatives, social, market-data, solana, nft, mev, rwa]
---

# Add Data Sources — Prompt Playbook

> **Goal**: Expand free-crypto-news from 3 market-price adapters to 70+ data sources across all 15 DataCategories, plus new categories. All wired through the resilient ProviderChain framework with circuit breakers, rate limiting, consensus, and health monitoring.

## Current State

### Provider Framework (src/lib/providers/)
- **ProviderChain** supports 4 strategies: fallback, race, consensus, broadcast
- **Built-in protections**: circuit breakers, rate limiting, anomaly detection, stale-while-revalidate caching
- **15 DataCategories defined** in types.ts — only `market-price` has adapters

### Implemented Adapters (3 total)
| Provider | Category | Weight |
|----------|----------|--------|
| CoinGecko | market-price | 0.40 |
| CoinCap | market-price | 0.25 |
| Binance | market-price | 0.30 |

### Partially Implemented (in adapters/ but need wiring or testing)
| Provider | Category | Status |
|----------|----------|--------|
| CoinMarketCap | market-price | Adapter exists, needs integration |
| CoinPaprika | market-price | Adapter exists |
| CryptoCompare | market-price | Adapter exists |
| DeFiLlama TVL | tvl | Adapter exists |
| DeFiLlama Yields | defi-yields | Adapter exists |
| Binance Futures | funding-rate | Adapter exists |
| Bybit | funding-rate | Adapter exists |
| OKX | funding-rate | Adapter exists |

### Client Libraries (src/lib/apis/) — NOT wired through ProviderChain
CoinMarketCap, CryptoQuant, DeFiLlama, Glassnode, L2Beat, LunarCrush, Messari, NFT Markets (OpenSea + Reservoir), The Graph, CryptoPanic, NewsAPI

### External APIs Already Referenced in Codebase (fetch calls exist)
Binance, Bybit, OKX, Kraken, KuCoin, MEXC, Gemini, Coinbase, Bitfinex,
dYdX, Hyperliquid, 1inch, DeFiLlama, GeckoTerminal, DEXScreener,
Etherscan, Arbiscan, BaseScan, Polygonscan, Blockchain.info, Blockchair,
CryptoQuant, Glassnode, Santiment, IntoTheBlock, Dune, Flipside,
Arkham Intelligence, SimpleHash, CryptoRank, Mobula, Hashrateindex,
Coinalyze, Circle, InsurAce, NexusMutual, DeFi Safety, DeFiYield

## How Adapters Work

Each adapter implements `DataProvider<T>`:
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

Adapters go in `src/lib/providers/adapters/{category}/` and are wired into a ProviderChain in `index.ts`.

---

## API Keys You'll Need

| Service | Free Tier | Signup URL | Category |
|---------|-----------|------------|----------|
| CoinGecko | 30/min (no key) or 500/min (demo) | https://www.coingecko.com/en/api/pricing | Already integrated |
| CoinMarketCap | 333/day | https://coinmarketcap.com/api/ | Market data |
| CoinGlass | 10/min | https://www.coinglass.com/pricing | Derivatives |
| Etherscan | 5/sec | https://etherscan.io/apis | ETH on-chain |
| Polygonscan | 5/sec | https://polygonscan.com/apis | Polygon |
| BscScan | 5/sec | https://bscscan.com/apis | BSC |
| Arbiscan | 5/sec | https://arbiscan.io/apis | Arbitrum |
| BaseScan | 5/sec | https://basescan.org/apis | Base |
| Solscan | Free tier | https://pro.solscan.io/ | Solana |
| Helius | 50K credits/day | https://dev.helius.xyz/ | Solana RPC + DAS |
| Alchemy | 300M compute/mo | https://www.alchemy.com/ | Multi-chain RPC |
| Infura | 100K/day | https://www.infura.io/ | Ethereum RPC |
| The Graph | 100K queries/mo | https://thegraph.com/studio/ | Subgraph data |
| Dune Analytics | Limited free | https://dune.com/settings/api | SQL on-chain |
| Flipside | Free tier | https://flipsidecrypto.xyz/ | SQL on-chain |
| CryptoQuant | Limited free | https://cryptoquant.com/pricing | Exchange flows |
| Glassnode | Limited free | https://studio.glassnode.com/ | On-chain metrics |
| Santiment | Limited free | https://app.santiment.net/ | Social + on-chain |
| LunarCrush | Free v4 | https://lunarcrush.com/developers | Social metrics |
| Messari | Free tier | https://messari.io/api | Research |
| DeFiLlama | Free (no key) | https://defillama.com/docs/api | TVL, yields, DEX |
| CryptoPanic | Free with key | https://cryptopanic.com/developers/api/ | News |
| NewsAPI | 100/day | https://newsapi.org/ | Mainstream news |
| Whale Alert | 10/min | https://whale-alert.io/api | Whale txs |
| OpenSea | Free tier | https://docs.opensea.io/ | NFT data |
| Reservoir | Free tier | https://reservoir.tools/ | NFT aggregation |
| Token Terminal | Free tier | https://tokenterminal.com/api | Protocol revenue |
| CoinGlass | Free tier | https://www.coinglass.com/pricing | Derivatives data |
| Coinalyze | Free tier | https://coinalyze.net/api/ | Futures OI, liq |
| DEXScreener | Free (no key) | https://docs.dexscreener.com/ | DEX pair data |
| GeckoTerminal | Free (no key) | https://www.geckoterminal.com/dex-api | On-chain DEX |
| Birdeye | Free tier | https://docs.birdeye.so/ | Solana analytics |
| Jupiter | Free (no key) | https://station.jup.ag/docs/apis | Solana DEX agg |
| Token Unlocks | Free tier | https://token.unlocks.app/api | Vesting data |
| Polymarket | Free (no key) | https://docs.polymarket.com/ | Prediction markets |
| Alternative.me | Free (no key) | https://alternative.me/crypto/fear-and-greed-index/ | Fear & Greed |
| Mempool.space | Free (no key) | https://mempool.space/docs/api | BTC mempool |
| Chainlink | Free (on-chain) | N/A | Oracle prices |
| Pyth Network | Free (on-chain) | N/A | Oracle prices |
| L2Beat | Free (no key) | https://l2beat.com/api | L2 TVL |
| Electric Capital | Free reports | https://www.electriccapital.com/ | Dev activity |
| Nansen | Requires plan | https://www.nansen.ai/api | Smart money |
| Artemis | Free tier | https://www.artemis.xyz/ | DeFi analytics |

---

## Prompt Sequence

### Prompt 1 — Market Price: Wire Existing + Add 5 Exchanges

```
Wire the existing partially-implemented market price adapters and add 5 new ones.

Project: /workspaces/free-crypto-news

Current state:
- CoinGecko, CoinCap, Binance are wired (3 adapters)
- CoinMarketCap, CoinPaprika, CryptoCompare adapters exist but may need fixes
- External fetches also exist for Kraken, KuCoin, MEXC, Gemini, Coinbase, Bitfinex

Create/update in src/lib/providers/adapters/market-price/:

1. FIX existing: coinmarketcap.adapter.ts, coinpaprika.adapter.ts, cryptocompare.adapter.ts
   - Ensure they implement DataProvider<MarketPrice[]> correctly
   - Add normalize(), validate(), healthCheck()

2. NEW: kraken.adapter.ts
   - API: api.kraken.com/0/public/Ticker
   - No key, 15 req/sec
   - Priority: 6, Weight: 0.25
   - Pair mapping: XXBTZUSD → BTC

3. NEW: kucoin.adapter.ts
   - API: api.kucoin.com/api/v1/market/allTickers
   - No key, 30 req/sec
   - Priority: 7, Weight: 0.20

4. NEW: coinbase.adapter.ts
   - API: api.exchange.coinbase.com/products/*/ticker
   - No key, 10 req/sec
   - Priority: 8, Weight: 0.25

5. NEW: gemini.adapter.ts
   - API: api.gemini.com/v1/pubticker/*
   - No key, 5 req/sec
   - Priority: 9, Weight: 0.15

6. NEW: mexc.adapter.ts
   - API: api.mexc.com/api/v3/ticker/24hr
   - No key, 20 req/sec
   - Priority: 10, Weight: 0.15

Update index.ts:
- marketPriceChain (fallback, all 9 providers)
- marketPriceConsensusChain (consensus, all 9 with weights)
- createMarketPriceChain(options) factory

Each adapter: DataProvider<MarketPrice[]>, normalize(), validate(), healthCheck(), CoinGecko ID mapping.
```

---

### Prompt 2 — Funding Rates: Wire + Add New

```
Complete the funding-rate category — adapters exist but need wiring + new sources.

Project: /workspaces/free-crypto-news

Current: Binance Futures, Bybit, OKX adapters exist in adapters/funding-rate/ but may not be fully wired.

Requirements:
1. FIX existing: binance-futures.adapter.ts, bybit.adapter.ts, okx.adapter.ts
2. NEW: dydx.adapter.ts
   - API: api.dydx.exchange/v3/markets
   - No key, 100/10sec
   - Priority: 4, Weight: 0.15

3. NEW: hyperliquid.adapter.ts
   - API: api.hyperliquid.xyz/info (POST {"type": "metaAndAssetCtxs"})
   - No key
   - Priority: 5, Weight: 0.15

4. NEW: coinglass-funding.adapter.ts
   - API: open-api-v3.coinglass.com/api/futures/funding-rates-history
   - API key via COINGLASS_API_KEY
   - Priority: 6, Weight: 0.20
   - Aggregated funding rates across multiple exchanges

5. Wire into fundingRateChain (consensus) and fundingRateFallbackChain
6. Register in provider registry
7. Update src/app/api/funding-rates/route.ts to use chain

Types already defined. Strategy: consensus to fuse rates from multiple exchanges.
```

---

### Prompt 3 — TVL + DeFi Yields: Wire + Expand

```
Complete tvl and defi-yields categories with more sources.

Project: /workspaces/free-crypto-news

Current: DeFiLlama TVL and Yields adapters exist.

TVL — src/lib/providers/adapters/tvl/:
1. FIX existing: defillama.adapter.ts
2. NEW: token-terminal-tvl.adapter.ts
   - API: api.tokenterminal.com/v2/protocols
   - TOKEN_TERMINAL_API_KEY
   - Priority: 2, Weight: 0.25

3. NEW: l2beat.adapter.ts
   - API: l2beat.com/api/tvl (already have client at src/lib/apis/l2beat.ts)
   - No key, Priority: 3, Weight: 0.20
   - L2-specific TVL data

DeFi Yields — src/lib/providers/adapters/defi-yields/:
4. FIX existing: defillama-yields.adapter.ts
5. NEW: aave-yields.adapter.ts
   - Via The Graph subgraph for Aave v3 across chains
   - THEGRAPH_API_KEY
   - Priority: 2, Weight: 0.25

6. NEW: compound-yields.adapter.ts
   - API: api.compound.fi or The Graph subgraph
   - Priority: 3, Weight: 0.20

Wire tvlChain and yieldsChain, register, update routes.
```

---

### Prompt 4 — On-Chain Analytics

```
Implement the "on-chain" DataCategory with 5 adapters.

Project: /workspaces/free-crypto-news

Types in src/lib/providers/adapters/on-chain/types.ts:
{
  metric: string,      // "exchange_netflow", "active_addresses", etc.
  chain: string,
  value: number,
  timestamp: number,
  source: string,
  resolution: '1h' | '1d' | '1w',
}

Create:
1. glassnode.adapter.ts
   - API: api.glassnode.com/v1/metrics/* (already have client)
   - GLASSNODE_API_KEY, 10/min free
   - Metrics: exchange flows, miner metrics, SOPR, NUPL, active addresses
   - Priority: 1, Weight: 0.40

2. cryptoquant.adapter.ts
   - API: api.cryptoquant.com/v1/* (already have client)
   - CRYPTOQUANT_API_KEY
   - Metrics: exchange reserves, netflow, stablecoin flows, miner flows
   - Priority: 2, Weight: 0.35

3. santiment.adapter.ts
   - API: api.santiment.net/graphql
   - SANTIMENT_API_KEY
   - GraphQL: daily active addresses, exchange flows, social volume, dev activity
   - Priority: 3, Weight: 0.25

4. blockchain-info.adapter.ts
   - API: blockchain.info/q/* and api.blockchain.info/stats
   - No key
   - BTC-specific: hashrate, difficulty, mempool, unconfirmed txs
   - Priority: 4, Weight: 0.15

5. dune.adapter.ts
   - API: api.dune.com/api/v1/query/{id}/execute + results
   - DUNE_API_KEY
   - Pre-built query IDs for: DEX volume, stablecoin supply, bridge flows
   - Cache aggressively (Dune queries can be slow)
   - Priority: 5, Weight: 0.20

Wire onChainChain (fallback) + onChainConsensusChain, register, update /api/onchain/* routes.
```

---

### Prompt 5 — Social Metrics

```
Implement "social-metrics" DataCategory with 4 adapters.

Project: /workspaces/free-crypto-news

Types:
{
  coin: string,
  twitterMentions: number,
  redditPosts: number,
  socialVolume: number,
  socialDominance: number,
  sentiment: number,       // -1 to 1
  galaxyScore?: number,
  altRank?: number,
  influencerMentions: number,
  timestamp: number,
}

Create:
1. lunarcrush.adapter.ts
   - API: lunarcrush.com/api4/public/coins/list (already have client)
   - No key for v4 public
   - Galaxy Score, AltRank, social volume, sentiment, dominance
   - Priority: 1, Weight: 0.40

2. santiment-social.adapter.ts
   - API: api.santiment.net/graphql
   - SANTIMENT_API_KEY
   - Queries: social_volume, social_dominance, sentiment_balance
   - Priority: 2, Weight: 0.30

3. cryptopanic-sentiment.adapter.ts
   - API: cryptopanic.com/api/v1/posts/?auth_token=KEY&filter=hot
   - CRYPTOPANIC_API_KEY
   - Derive sentiment from bullish/bearish vote ratio
   - Priority: 3, Weight: 0.15

4. reddit.adapter.ts
   - API: oauth.reddit.com/r/cryptocurrency + /r/bitcoin + /r/ethereum
   - REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
   - Track: post count, comment count, upvote ratio
   - Priority: 4, Weight: 0.15

Wire socialMetricsChain (consensus), register, update /api/social/* routes.
```

---

### Prompt 6 — Gas Fees + Mempool

```
Implement "gas-fees" and "mempool" DataCategories.

Project: /workspaces/free-crypto-news

GAS — src/lib/providers/adapters/gas/:
Types: { chain, low/medium/high: {gwei, usd, time}, baseFee, timestamp }

1. etherscan.adapter.ts — api.etherscan.io/api?module=gastracker, ETHERSCAN_API_KEY, 5/sec
2. alchemy-gas.adapter.ts — eth_gasPrice + eth_feeHistory, ALCHEMY_API_KEY
3. fee-history.adapter.ts: eth_feeHistory over public RPCs, no key (Blocknative's gas API shut down 2026-06-19)
gasChain: consensus (fuse estimates)

MEMPOOL — src/lib/providers/adapters/mempool/:
Types: { chain, txCount, totalFees, feeHistogram, recommendedFees, blockHeight, timestamp }

4. mempool-space.adapter.ts — mempool.space/api, no key, BTC mempool/fees/blocks
5. blockstream.adapter.ts — blockstream.info/api, no key
6. blockchain-com.adapter.ts — blockchain.info/q/*, no key
mempoolChain: fallback (mempool.space primary)

Register both, update /api/gas/* and /api/bitcoin/mempool routes.
```

---

### Prompt 7 — Whale Alerts + Liquidations

```
Implement "whale-alerts" and "liquidations" DataCategories.

Project: /workspaces/free-crypto-news

WHALE ALERTS:
Types: { hash, chain, from/to: {address, label, type}, amount, amountUsd, symbol, timestamp }

1. whale-alert-api.adapter.ts — api.whale-alert.io/v1/transactions, WHALE_ALERT_API_KEY, 10/min
2. etherscan-whale.adapter.ts — filter large ERC-20 transfers >$1M
3. arkham.adapter.ts — api.arkhamintelligence.com (already in codebase), labeled addresses

LIQUIDATIONS:
Types: { exchange, symbol, side: 'long'|'short', quantity, price, amountUsd, timestamp }

4. coinglass-liq.adapter.ts — open-api-v3.coinglass.com/api/futures/liquidation, COINGLASS_API_KEY
5. binance-liq.adapter.ts — wss://fstream.binance.com/ws/!forceOrder@arr, buffer 5min
6. bybit-liq.adapter.ts — similar WebSocket approach

Register both, update /api/whale-alerts and /api/liquidations routes.
```

---

### Prompt 8 — Stablecoin Flows + Fear & Greed

```
Implement "stablecoin-flows" and "fear-greed" DataCategories.

Project: /workspaces/free-crypto-news

STABLECOINS:
Types: { stablecoin, totalSupply, supplyChange24h/7d, chainBreakdown[], exchangeReserves, timestamp }

1. defillama-stablecoins.adapter.ts — stablecoins.llama.fi/*, no key
2. cryptoquant-stables.adapter.ts — api.cryptoquant.com/v1/stablecoin/*
3. dune-stables.adapter.ts — pre-built queries for stablecoin flows

FEAR & GREED:
Types: { value: 0-100, classification, previousClose, change24h, components?, timestamp }

4. alternative-me.adapter.ts — api.alternative.me/fng/, no key
5. coingecko-fng.adapter.ts — derive from BTC volatility + volume analysis
6. composite-fng.adapter.ts — OUR OWN composite from: BTC realized vol, SMA 50/200 momentum, social sentiment, BTC dominance, Google Trends

fearGreedChain: consensus (fuse multiple F&G signals — this is our differentiator)
Register both, update routes.
```

---

### Prompt 9 — Order Book + Open Interest + OHLCV

```
Implement "order-book", "open-interest", "ohlcv" DataCategories.

Project: /workspaces/free-crypto-news

ORDER BOOK (strategy: broadcast):
Types: { exchange, symbol, bids/asks: [price,qty][], spread, spreadPct, timestamp }
1. binance-orderbook.adapter.ts — api.binance.com/api/v3/depth, no key
2. kraken-orderbook.adapter.ts — api.kraken.com/0/public/Depth
3. okx-orderbook.adapter.ts — www.okx.com/api/v5/market/books

OPEN INTEREST (strategy: consensus):
Types: { symbol, exchange, openInterest, openInterestUsd, change24h, timestamp }
4. coinglass-oi.adapter.ts — open-api-v3.coinglass.com/api/futures/openInterest, COINGLASS_API_KEY
5. binance-oi.adapter.ts — fapi.binance.com/fapi/v1/openInterest
6. bybit-oi.adapter.ts — api.bybit.com/v5/market/open-interest
7. okx-oi.adapter.ts — www.okx.com/api/v5/public/open-interest

OHLCV (strategy: fallback):
Types: { symbol, exchange, timeframe, candles: Array<{open,high,low,close,volume,timestamp}> }
8. coingecko-ohlcv.adapter.ts — api.coingecko.com/api/v3/coins/{id}/ohlc
9. binance-ohlcv.adapter.ts — api.binance.com/api/v3/klines
10. kraken-ohlcv.adapter.ts — api.kraken.com/0/public/OHLC

Register all, update /api/orderbook, /api/options (open interest), /api/ohlc routes.
```

---

### Prompt 10 — DEXScreener + GeckoTerminal (Trending Tokens)

```
Add DEXScreener and GeckoTerminal adapters for real-time DEX pair data and trending tokens.
These are CRITICAL for capturing the memecoin/new-token audience.

Project: /workspaces/free-crypto-news

Both APIs are FREE with no key required. References already exist in codebase.

Create new DataCategory "dex-pairs" in src/lib/providers/types.ts:
  | 'dex-pairs'

Types in src/lib/providers/adapters/dex-pairs/types.ts:
{
  pairAddress: string,
  chain: string,
  dex: string,
  baseToken: { address: string, symbol: string, name: string },
  quoteToken: { address: string, symbol: string, name: string },
  priceUsd: number,
  priceChange: { m5: number, h1: number, h6: number, h24: number },
  volume: { h1: number, h6: number, h24: number },
  liquidity: { usd: number },
  fdv: number,
  pairCreatedAt: number,
  txns: { h1: { buys: number, sells: number }, h24: { buys: number, sells: number } },
}

1. dexscreener.adapter.ts
   - API: api.dexscreener.com/latest/dex/tokens/{address}
   - Also: /search?q={query}, /pairs/{chain}/{pairAddress}
   - No key, 300/min
   - Priority: 1, Weight: 0.50
   - CRITICAL: Trending tokens list at /token-boosts/latest/v1

2. geckoterminal.adapter.ts
   - API: api.geckoterminal.com/api/v2/networks/{chain}/pools/{address}
   - Also: /networks/{chain}/trending_pools, /search/pools?query={q}
   - No key, 30/min
   - Priority: 2, Weight: 0.35

3. birdeye.adapter.ts (Solana-specific)
   - API: public-api.birdeye.so/defi/tokenlist
   - BIRDEYE_API_KEY
   - Priority: 3, Weight: 0.25
   - Solana token analytics, trending tokens

4. jupiter.adapter.ts (Solana DEX aggregator)
   - API: price.jup.ag/v6/price?ids={mints}
   - Also: token.jup.ag/all (token list with metadata)
   - No key
   - Priority: 4, Weight: 0.20
   - Solana-specific DEX prices

Wire dexPairsChain (fallback), register.

Create/update API routes:
- GET /api/dex/pairs?chain=solana&address=xxx
- GET /api/dex/trending?chain=all
- GET /api/dex/search?q=pepe
- GET /api/dex/new-pairs?chain=base&minLiquidity=10000
```

---

### Prompt 11 — Derivatives: CoinGlass + Options

```
Add CoinGlass as a comprehensive derivatives data source plus options data.

Project: /workspaces/free-crypto-news

CoinGlass provides aggregated data from ALL major exchanges — it's the definitive
derivatives data source. Sign up for free API key at coinglass.com/pricing.

Create new DataCategory "derivatives-aggregate" in types.ts:

Types:
{
  symbol: string,
  openInterest: number,
  openInterestChange24h: number,
  longShortRatio: { ratio: number, longPercent: number, shortPercent: number },
  fundingRate: number,
  liquidations24h: { long: number, short: number, total: number },
  volume24h: number,
  topTraderRatio: { longPercent: number, shortPercent: number },
  exchangeBreakdown: Array<{ exchange: string, oi: number, volume: number }>,
  timestamp: number,
}

1. coinglass-aggregate.adapter.ts
   - API: open-api-v3.coinglass.com/api/futures/
   - Endpoints: openInterest, fundingRate, liquidation, longShortRatio, topTrader
   - COINGLASS_API_KEY (free tier: 10/min)
   - Priority: 1, Weight: 0.60

2. coinalyze.adapter.ts
   - API: api.coinalyze.net/v1/
   - COINALYZE_API_KEY
   - OI history, funding rate history
   - Priority: 2, Weight: 0.25

3. laevitas-options.adapter.ts
   - API: laevitas.ch (options analytics)
   - Options: max pain, put/call ratio, term structure, implied volatility
   - Priority: 3, Weight: 0.15

4. deribit-options.adapter.ts
   - API: www.deribit.com/api/v2/public/
   - No key for public endpoints
   - BTC/ETH options: OI by strike, implied vol surface

Wire derivativesAggregateChain, register.

API routes:
- GET /api/derivatives?symbol=BTC — full derivatives dashboard
- GET /api/derivatives/long-short?symbol=BTC
- GET /api/derivatives/liquidations?period=24h
- GET /api/options?symbol=BTC — options analytics
- GET /api/options/max-pain?symbol=BTC
```

---

### Prompt 12 — Solana Ecosystem

```
Dedicated Solana data adapters — Solana is the #2 ecosystem after Ethereum.

Project: /workspaces/free-crypto-news

Create new DataCategory "solana-ecosystem" in types.ts:

Types (SolanaTokenData):
{
  mint: string,
  symbol: string,
  name: string,
  priceUsd: number,
  priceChange24h: number,
  volume24h: number,
  marketCap: number,
  holders: number,
  supply: { total: number, circulating: number },
  topHolders: Array<{ address: string, balance: number, percentage: number }>,
  dexVolume24h: number,
  liquidity: number,
  source: string,
  timestamp: number,
}

1. helius.adapter.ts
   - API: api.helius.xyz/v0/ (DAS API for compressed NFTs + token metadata)
   - HELIUS_API_KEY (50K credits/day free)
   - Enhanced transaction history, token metadata, webhook support
   - Priority: 1, Weight: 0.35

2. birdeye-solana.adapter.ts
   - API: public-api.birdeye.so/defi/
   - BIRDEYE_API_KEY
   - Token list, price history, OHLCV, trader analytics
   - Priority: 2, Weight: 0.30

3. jupiter-solana.adapter.ts
   - API: price.jup.ag/v6/price, token.jup.ag/all
   - No key
   - Best Solana DEX prices (aggregated)
   - Priority: 3, Weight: 0.25

4. solscan.adapter.ts
   - API: pro-api.solscan.io/v2.0/
   - SOLSCAN_API_KEY
   - Account info, token holders, DeFi activities
   - Priority: 4, Weight: 0.20

5. tensor.adapter.ts (Solana NFTs)
   - API: api.tensor.so/graphql
   - TENSOR_API_KEY
   - Solana NFT floor prices, volume, listing count
   - Priority: 5, Weight: 0.15

Wire solanaEcosystemChain, register.

API routes:
- GET /api/solana/tokens?sort=volume
- GET /api/solana/token/{mint}
- GET /api/solana/trending
- GET /api/solana/nft/collections
- GET /api/solana/defi — TVL, DEX volume on Solana
```

---

### Prompt 13 — NFT Data

```
Comprehensive NFT data across Ethereum, Solana, Bitcoin (Ordinals), and L2s.

Project: /workspaces/free-crypto-news

Existing: OpenSea + Reservoir clients in src/lib/apis/nft-markets.ts

Create new DataCategory "nft-market" in types.ts:

Types:
{
  collection: string,
  chain: string,
  marketplace: string,
  floorPrice: number,
  floorPriceUsd: number,
  volume24h: number,
  volumeChange24h: number,
  sales24h: number,
  listedCount: number,
  supply: number,
  owners: number,
  royalty: number,
  timestamp: number,
}

1. opensea.adapter.ts — wire existing client through ProviderChain
   - OPENSEA_API_KEY
   - Collections, floor price, volume, traits, events
   - Priority: 1, Weight: 0.35

2. reservoir.adapter.ts — wire existing client
   - RESERVOIR_API_KEY
   - Aggregated: collections, sales, asks/bids, collection activity
   - Priority: 2, Weight: 0.30

3. simplehash.adapter.ts
   - API: api.simplehash.com/api/v0/ (already in codebase)
   - SIMPLEHASH_API_KEY
   - Multi-chain NFTs: Ethereum, Solana, Polygon, Base
   - Priority: 3, Weight: 0.25

4. magic-eden.adapter.ts
   - API: api-mainnet.magiceden.dev/v2/
   - No key for public endpoints
   - Bitcoin Ordinals + Solana NFTs + multi-chain
   - Priority: 4, Weight: 0.20

Wire nftMarketChain, register.

API routes:
- GET /api/nft/collections?chain=ethereum&sort=volume
- GET /api/nft/collection/{slug}
- GET /api/nft/trending — top movers across all chains
- GET /api/nft/ordinals — Bitcoin Ordinals specific
- GET /api/nft/sales?period=24h — recent high-value sales
```

---

### Prompt 14 — Prediction Markets + Governance

```
Add prediction markets and governance data — unique data no competitor offers.

Project: /workspaces/free-crypto-news

PREDICTION MARKETS:
Types:
{
  market: string,
  question: string,
  outcomes: Array<{ name: string, probability: number, price: number }>,
  volume24h: number,
  totalVolume: number,
  liquidity: number,
  endDate: string,
  category: string, // 'crypto', 'politics', 'sports', etc.
  source: string,
  timestamp: number,
}

1. polymarket.adapter.ts
   - API: clob.polymarket.com/markets, gamma-api.polymarket.com
   - No key
   - Event markets, odds, volume, liquidity
   - Priority: 1, Weight: 0.50

2. kalshi.adapter.ts
   - API: trading-api.kalshi.com/v2/
   - KALSHI_API_KEY
   - US-regulated prediction markets
   - Priority: 2, Weight: 0.30

3. metaculus.adapter.ts
   - API: metaculus.com/api2/questions/
   - No key for public questions
   - Priority: 3, Weight: 0.20

GOVERNANCE:
Types:
{
  protocol: string,
  proposalId: string,
  title: string,
  status: 'active' | 'passed' | 'failed' | 'pending',
  votesFor: number,
  votesAgainst: number,
  quorum: number,
  endTime: string,
  source: string,
  timestamp: number,
}

4. tally.adapter.ts
   - API: api.tally.xyz/query (GraphQL)
   - TALLY_API_KEY (already in .env.example)
   - On-chain governance: Compound, Uniswap, Aave, ENS
   - Priority: 1, Weight: 0.50

5. snapshot.adapter.ts
   - API: hub.snapshot.org/graphql
   - No key
   - Off-chain governance for 20K+ spaces
   - Priority: 2, Weight: 0.50

Wire predictionMarketsChain, governanceChain, register.

API routes:
- GET /api/predictions/markets?category=crypto
- GET /api/predictions/trending
- GET /api/governance/proposals?protocol=uniswap&status=active
- GET /api/governance/trending
```

---

### Prompt 15 — Protocol Revenue + Token Unlocks + RWA

```
Add financial fundamentals data, token unlock schedules, and Real World Assets tracking.

Project: /workspaces/free-crypto-news

PROTOCOL REVENUE:
Types:
{
  protocol: string,
  dailyFees: number,
  dailyRevenue: number,
  weeklyRevenue: number,
  monthlyRevenue: number,
  revenueChange7d: number,
  priceToEarnings: number,
  priceToSales: number,
  fullyDilutedValuation: number,
  timestamp: number,
}

1. defillama-fees.adapter.ts
   - API: api.llama.fi/overview/fees + api.llama.fi/summary/fees/{protocol}
   - No key
   - Daily/total fees and revenue by protocol
   - Priority: 1, Weight: 0.45

2. token-terminal-revenue.adapter.ts
   - API: api.tokenterminal.com/v2/protocols
   - TOKEN_TERMINAL_API_KEY
   - Revenue, P/E, P/S, market cap multiples
   - Priority: 2, Weight: 0.35

3. artemis.adapter.ts
   - API: api.artemis.xyz/
   - ARTEMIS_API_KEY
   - Revenue + fundamental metrics
   - Priority: 3, Weight: 0.20

TOKEN UNLOCKS:
Types:
{
  project: string,
  symbol: string,
  nextUnlockDate: string,
  nextUnlockAmount: number,
  nextUnlockAmountUsd: number,
  nextUnlockPercent: number, // % of circulating supply
  vestingSchedule: Array<{ date: string, amount: number, type: string }>,
  totalLocked: number,
  totalLockedUsd: number,
  timestamp: number,
}

4. defillama-unlocks.adapter.ts
   - API: api.llama.fi/protocol/{name} (includes token data)
   - No key

5. token-unlocks.adapter.ts
   - API: token.unlocks.app/api (if available, or scrape schedule page)
   - Priority: 1, Weight: 0.50

REAL WORLD ASSETS (RWA):
Types:
{
  asset: string,
  category: 'treasury-bills' | 'real-estate' | 'commodities' | 'private-credit',
  protocol: string,
  tvl: number,
  tvlChange24h: number,
  yield: number,
  chain: string,
  timestamp: number,
}

6. defillama-rwa.adapter.ts
   - API: api.llama.fi/protocols (filter category=RWA)
   - Track Ondo, Centrifuge, Maple, Goldfinch, etc.

API routes:
- GET /api/revenue?protocol=uniswap
- GET /api/revenue/top?period=30d&sort=revenue
- GET /api/unlocks/upcoming?days=7
- GET /api/unlocks/{symbol}
- GET /api/rwa?category=treasury-bills
- GET /api/rwa/tvl — total RWA TVL across all protocols
```

---

### Prompt 16 — L2 / Rollup Data

```
Dedicated L2/rollup analytics — L2Beat data + more.

Project: /workspaces/free-crypto-news

Already have: src/lib/apis/l2beat.ts client

Types:
{
  chain: string,
  type: 'optimistic-rollup' | 'zk-rollup' | 'validium' | 'optimium',
  tvl: number,
  tvlChange7d: number,
  txCount24h: number,
  avgTps: number,
  avgGasFee: number, // in USD
  batchCost: number,
  stage: 'Stage 0' | 'Stage 1' | 'Stage 2',
  daBlobSize: number,
  timestamp: number,
}

1. l2beat.adapter.ts — wire existing client through ProviderChain
   - TVL, risk analysis, stage classification, activity
   - Priority: 1, Weight: 0.50

2. defillama-chains.adapter.ts
   - API: api.llama.fi/v2/chains
   - No key
   - TVL by chain, useful for L2 comparison
   - Priority: 2, Weight: 0.25

3. block-explorer-multi.adapter.ts
   - Aggregate from Arbiscan, BaseScan, Polygonscan, etc.
   - ETHERSCAN_API_KEY works for all Etherscan-family scanners
   - Tx count, avg gas, active addresses per L2
   - Priority: 3, Weight: 0.25

API routes:
- GET /api/l2 — all L2s ranked by TVL
- GET /api/l2/{chain} — detail page for one L2
- GET /api/l2/compare?chains=arbitrum,optimism,base
- GET /api/l2/fees — cheapest L2s right now
```

---

### Prompt 17 — MEV + Bridge Data

```
Add MEV tracking and cross-chain bridge monitoring.

Project: /workspaces/free-crypto-news

MEV Types:
{
  chain: string,
  mevType: 'sandwich' | 'arbitrage' | 'liquidation' | 'frontrun',
  extractedValue: number,
  txHash: string,
  block: number,
  searcher: string,
  victim?: string,
  timestamp: number,
}

1. flashbots.adapter.ts
   - API: blocks.flashbots.net/v1/blocks
   - No key
   - MEV blocks, searcher profit, bundle data
   - Priority: 1, Weight: 0.50

2. eigenphi.adapter.ts
   - API: eigenphi.io
   - MEV analytics, sandwich detection
   - Priority: 2, Weight: 0.30

3. zeromev.adapter.ts
   - API: zeromev.org/api
   - MEV extraction by type
   - Priority: 3, Weight: 0.20

BRIDGE Types:
{
  bridge: string,
  sourceChain: string,
  destChain: string,
  volume24h: number,
  volumeChange24h: number,
  tvl: number,
  txCount24h: number,
  timestamp: number,
}

4. defillama-bridges.adapter.ts
   - API: bridges.llama.fi/bridges + bridges.llama.fi/bridge/{id}
   - No key
   - All major bridges: volume, TVL, chains
   - Priority: 1, Weight: 0.60

5. layerzero.adapter.ts
   - Track LayerZero message volume
   - Priority: 2, Weight: 0.40

API routes:
- GET /api/mev?chain=ethereum&period=24h
- GET /api/mev/stats — aggregate MEV extraction stats
- GET /api/bridges?sort=volume
- GET /api/bridges/{name} — single bridge detail
- GET /api/bridges/flows?from=ethereum&to=arbitrum
```

---

### Prompt 18 — BTC ETF Flows + Mining Data

```
Bitcoin-specific data: ETF flows and mining metrics.

Project: /workspaces/free-crypto-news

BTC ETF Types:
{
  etf: string,          // "GBTC", "IBIT", "FBTC", etc.
  ticker: string,
  issuer: string,
  flow: number,         // daily net flow in USD
  aum: number,          // assets under management
  shares: number,
  price: number,
  premium: number,      // premium/discount to NAV
  timestamp: number,
}

1. sosovalue-etf.adapter.ts
   - API: sosovalue.com (scrape or API if available)
   - BTC + ETH ETF flows, AUM, premium/discount
   - Priority: 1, Weight: 0.50

2. coinglass-etf.adapter.ts
   - API: open-api-v3.coinglass.com/api/etf/
   - COINGLASS_API_KEY
   - ETF flow data
   - Priority: 2, Weight: 0.30

3. farside-etf.adapter.ts
   - Scrape farside.co.uk/btc/ for daily ETF flow data
   - Priority: 3, Weight: 0.20

MINING Types:
{
  chain: string,
  hashrate: number,
  difficulty: number,
  blockTime: number,
  blockReward: number,
  miningRevenue24h: number,
  poolDistribution: Array<{ pool: string, hashrate: number, blocks24h: number }>,
  timestamp: number,
}

4. hashrateindex.adapter.ts
   - API: api.hashrateindex.com (already referenced in codebase)
   - HASHRATE_INDEX_API_KEY
   - Mining profitability, hashrate, ASIC prices
   - Priority: 1, Weight: 0.40

5. blockchain-mining.adapter.ts
   - API: blockchain.info for hashrate, difficulty, pools
   - No key
   - Priority: 2, Weight: 0.30

6. miningpoolstats.adapter.ts
   - API: miningpoolstats.stream (BTC pool distribution)
   - No key
   - Priority: 3, Weight: 0.30

API routes:
- GET /api/etf/flows?date=2026-02-25
- GET /api/etf/summary — all ETFs aggregated
- GET /api/mining/hashrate?chain=bitcoin
- GET /api/mining/pools
- GET /api/mining/profitability
```

---

### Prompt 19 — News Aggregation Expansion

```
Expand news sources beyond current RSS feeds.

Project: /workspaces/free-crypto-news

Current: RSS feeds from ~40 crypto news sites. CryptoPanic and NewsAPI clients exist.

Add these news aggregation adapters:

1. Wire cryptopanic through ProviderChain:
   - CRYPTOPANIC_API_KEY
   - Hot/rising/bullish/bearish filters
   - Priority: 1, Weight: 0.30

2. Wire newsapi through ProviderChain:
   - NEWSAPI_API_KEY (100/day free)
   - Mainstream outlets covering crypto (Bloomberg, Reuters, CNBC)
   - Priority: 2, Weight: 0.20

3. NEW: marketaux.adapter.ts
   - API: api.marketaux.com/v1/news (already in codebase)
   - MARKETAUX_API_KEY (100/day free)
   - Financial news with entity recognition
   - https://www.marketaux.com/register
   - Priority: 3, Weight: 0.15

4. NEW: cryptorank-news.adapter.ts
   - API: api.cryptorank.io/v1/news (already in codebase)
   - CRYPTORANK_API_KEY
   - Crypto-specific news with categories
   - Priority: 4, Weight: 0.15

5. NEW: reddit-crypto-news.adapter.ts
   - API: oauth.reddit.com/r/CryptoCurrency/hot
   - REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
   - Top community-sourced crypto discussion
   - Priority: 5, Weight: 0.10

6. NEW: youtube-crypto.adapter.ts
   - API: www.googleapis.com/youtube/v3/search?q=bitcoin+crypto&type=video
   - YOUTUBE_API_KEY (10K units/day free)
   - Trending crypto videos from major channels
   - https://console.developers.google.com/
   - Priority: 6, Weight: 0.10

Create newsChain (broadcast strategy — collect from all sources), register.
Update /api/news to optionally use ProviderChain for multi-source aggregation.
```

---

### Prompt 20 — Provider Registry + Health Dashboard

```
Create centralized initialization and admin dashboard for all providers.

Project: /workspaces/free-crypto-news

Requirements:
1. src/lib/providers/registry-init.ts:
   - Import ALL category chains (market-price, funding-rate, tvl, defi-yields,
     on-chain, social-metrics, gas-fees, mempool, whale-alerts, liquidations,
     stablecoin-flows, fear-greed, order-book, open-interest, ohlcv,
     dex-pairs, derivatives-aggregate, solana-ecosystem, nft-market,
     prediction-markets, governance, protocol-revenue, token-unlocks,
     rwa, l2-data, mev, bridges, btc-etf, mining, news-aggregate)
   - Only enable adapters whose API keys are configured
   - Log active providers on startup
   - Export initProviders()

2. GET /api/providers/health — health for all chains:
   { chains: { [category]: { status, providers: [{ name, state, successRate, avgLatency }] } } }

3. GET /api/providers/[category] — fetch through any chain

4. /admin/providers page:
   - All chains listed with status
   - Per-provider: circuit breaker (green/yellow/red), success rate, latency, last error
   - Manual trip/reset circuit breakers
   - Real-time via polling

5. Call initProviders() on app startup

6. Add provider health to /api/health response
```

---

## New Environment Variables

Add these to .env.example:

```bash
# === New Data Source API Keys ===
COINGLASS_API_KEY=                 # CoinGlass derivatives data (free at coinglass.com/pricing)
COINALYZE_API_KEY=                 # Coinalyze futures data
TOKEN_TERMINAL_API_KEY=            # Token Terminal protocol revenue
HELIUS_API_KEY=                    # Helius Solana RPC (free at dev.helius.xyz)
BIRDEYE_API_KEY=                   # Birdeye Solana analytics
SOLSCAN_API_KEY=                   # Solscan Pro API
TENSOR_API_KEY=                    # Tensor Solana NFT data
SIMPLEHASH_API_KEY=                # SimpleHash multi-chain NFT
ALCHEMY_API_KEY=                   # Alchemy multi-chain RPC
INFURA_API_KEY=                    # Infura Ethereum RPC
DUNE_API_KEY=                      # Dune Analytics SQL on-chain
FLIPSIDE_API_KEY=                  # Flipside SQL on-chain
ARTEMIS_API_KEY=                   # Artemis DeFi analytics
KALSHI_API_KEY=                    # Kalshi prediction markets
REDDIT_CLIENT_ID=                  # Reddit OAuth app
REDDIT_CLIENT_SECRET=              # Reddit OAuth secret
YOUTUBE_API_KEY=                   # YouTube Data API v3
MARKETAUX_API_KEY=                 # MarketAux financial news
CRYPTORANK_API_KEY=                # CryptoRank news + data
HASHRATE_INDEX_API_KEY=            # Hashrate Index mining data
DEFIPULSE_API_KEY=                 # DeFi Pulse TVL data
```

---

## Execution Order

| Phase | Prompts | New Adapters | Categories Completed |
|-------|---------|--------------|---------------------|
| 1 | 1 (Exchanges) | +5 new, 3 fixed | market-price (9 total) |
| 2 | 2 (Funding) + 3 (DeFi) | +6 new, 5 fixed | funding-rate, tvl, defi-yields |
| 3 | 4 (On-Chain) + 5 (Social) | +9 | on-chain, social-metrics |
| 4 | 6 (Gas/Mempool) + 7 (Whales/Liq) | +9 | gas-fees, mempool, whale-alerts, liquidations |
| 5 | 8 (Stables/FNG) + 9 (Trading) | +16 | stablecoin-flows, fear-greed, order-book, open-interest, ohlcv |
| 6 | 10 (DEX Pairs) | +4 | dex-pairs (NEW category) |
| 7 | 11 (Derivatives) + 12 (Solana) | +9 | derivatives-aggregate, solana-ecosystem (NEW) |
| 8 | 13 (NFT) + 14 (Predictions/Gov) | +9 | nft-market, prediction-markets, governance (NEW) |
| 9 | 15 (Revenue/Unlocks/RWA) + 16 (L2) | +9 | protocol-revenue, token-unlocks, rwa, l2-data (NEW) |
| 10 | 17 (MEV/Bridges) + 18 (ETF/Mining) | +11 | mev, bridges, btc-etf, mining (NEW) |
| 11 | 19 (News) + 20 (Registry) | +6 | news-aggregate (NEW) + full dashboard |

**Total: ~93 provider adapters across 25+ DataCategories.**

## What This Gets Us vs Competition

| Feature | CoinGecko | DeFiLlama | Us (After) |
|---------|-----------|-----------|------------|
| Market prices | ✅ | ❌ | ✅ 9 exchanges + consensus |
| DeFi TVL | ❌ | ✅ | ✅ 3 sources |
| DeFi yields | ❌ | ✅ | ✅ 3 sources |
| DEX pair data | ❌ | ✅ | ✅ DEXScreener + GeckoTerminal + Birdeye + Jupiter |
| Derivatives aggregate | ❌ | ❌ | ✅ CoinGlass + Coinalyze |
| On-chain metrics | ❌ | ❌ | ✅ Glassnode + CryptoQuant + Santiment + Dune |
| Social metrics | ❌ | ❌ | ✅ LunarCrush + Santiment + Reddit |
| News aggregation | ❌ | ❌ | ✅ 40+ RSS + CryptoPanic + NewsAPI + YouTube |
| AI narratives | ❌ | ❌ | ✅ Hourly AI market briefs |
| Crypto Pulse index | ❌ | ❌ | ✅ Proprietary composite |
| Prediction markets | ❌ | ❌ | ✅ Polymarket + Kalshi |
| NFT multi-chain | ✅ partial | ❌ | ✅ OpenSea + Reservoir + SimpleHash + Magic Eden |
| BTC ETF flows | ❌ | ❌ | ✅ Multiple sources |
| Token unlocks | ❌ | ✅ partial | ✅ Dedicated tracking |
| RWA tracking | ❌ | ✅ partial | ✅ Full RWA dashboard |
| L2 analytics | ❌ | ❌ | ✅ L2Beat + explorers |
| MEV tracking | ❌ | ❌ | ✅ Flashbots + EigenPhi |
| Governance | ❌ | ❌ | ✅ Tally + Snapshot |
| Free API | ❌ ($130/mo Pro) | ✅ | ✅ Free + paid tiers |
| Real-time WS | ❌ | ❌ | ✅ Multi-channel |
| MCP server | ❌ | ❌ | ✅ Claude/ChatGPT ready |
| Circuit breakers | N/A | N/A | ✅ Automatic failover |
| Consensus fusion | N/A | N/A | ✅ Multi-source verification |
