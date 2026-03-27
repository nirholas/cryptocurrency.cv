# API Inventory & Gap Analysis

> Complete inventory of all external API providers used by free-crypto-news, including endpoints we currently use, endpoints available but unused, and missing feature opportunities.

**Last updated:** 2026-03-27
**Total providers documented:** 47
**Total endpoints we use:** ~85
**Total endpoints available but unused:** ~600+

---

## Table of Contents

1. [Market Data Providers](#market-data-providers)
   - [CoinGecko](#coingecko)
   - [CoinMarketCap](#coinmarketcap)
   - [CoinPaprika](#coinpaprika)
   - [CoinLore](#coinlore)
   - [CoinCap](#coincap)
2. [DeFi & Protocol Data](#defi--protocol-data)
   - [DeFiLlama (TVL)](#defillama-tvl)
   - [DeFiLlama (Yields)](#defillama-yields)
   - [DeFiLlama (Coins/Prices)](#defillama-coinsprices)
   - [DeFiLlama (Stablecoins)](#defillama-stablecoins)
   - [DeFiLlama (Bridges)](#defillama-bridges)
   - [DeFiLlama (Volumes)](#defillama-volumes)
   - [DeFiLlama (Fees)](#defillama-fees)
3. [DEX & On-Chain Trading](#dex--on-chain-trading)
   - [GeckoTerminal](#geckoterminal)
   - [DexScreener](#dexscreener)
   - [Defined.fi](#definedfi)
4. [Centralized Exchange APIs](#centralized-exchange-apis)
   - [Binance (Spot)](#binance-spot)
   - [Binance (USDS-M Futures)](#binance-usds-m-futures)
   - [Bybit](#bybit)
   - [OKX](#okx)
   - [Kraken](#kraken)
   - [KuCoin](#kucoin)
   - [dYdX](#dydx)
   - [Hyperliquid](#hyperliquid)
   - [Deribit](#deribit)
5. [On-Chain & Blockchain Explorers](#on-chain--blockchain-explorers)
   - [Etherscan](#etherscan)
   - [Basescan](#basescan)
   - [Arbiscan](#arbiscan)
   - [Polygonscan](#polygonscan)
   - [Solscan](#solscan)
   - [Blockchair](#blockchair)
   - [Mempool.space](#mempoolspace)
   - [Blockchain.info](#blockchaininfo)
6. [On-Chain Analytics](#on-chain-analytics)
   - [Glassnode](#glassnode)
   - [Santiment](#santiment)
   - [Dune Analytics](#dune-analytics)
   - [Flipside Crypto](#flipside-crypto)
   - [CryptoQuant](#cryptoquant)
7. [Social & Sentiment](#social--sentiment)
   - [LunarCrush](#lunarcrush)
   - [CryptoCompare](#cryptocompare)
   - [Alternative.me](#alternativeme)
8. [NFT Markets](#nft-markets)
   - [OpenSea](#opensea)
   - [Reservoir](#reservoir)
   - [SimpleHash](#simplehash)
9. [Research & Intelligence](#research--intelligence)
   - [Messari](#messari)
   - [Token Terminal](#token-terminal)
   - [Coinglass](#coinglass)
10. [Layer 2 & Scaling](#layer-2--scaling)
    - [L2Beat](#l2beat)
11. [Governance](#governance)
    - [Snapshot](#snapshot)
    - [Tally](#tally)
12. [Whale Tracking](#whale-tracking)
    - [Arkham Intelligence](#arkham-intelligence)
    - [Nansen](#nansen)
13. [News & RSS Feeds](#news--rss-feeds)
14. [Gap Analysis Summary](#gap-analysis-summary)
15. [Top Priority Missing Endpoints](#top-priority-missing-endpoints)

---

## Market Data Providers

### CoinGecko

**Base URL:** `https://api.coingecko.com/api/v3`
**Auth:** Free tier (no key) / Demo key recommended for higher limits
**Rate Limits:** 5-15 calls/min (free), 30 calls/min (demo key)
**Codebase constant:** `COINGECKO_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/simple/price` | Real-time prices with 24h change for top 20 coins | `src/lib/data-pipeline.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/simple/token_price/{id}` | Token price by contract address | Medium |
| `/simple/supported_vs_currencies` | List of supported fiat currencies | Low |
| `/coins/list` | All supported coin IDs (15,000+) | Medium |
| `/coins/markets` | Coins with market data, pagination, sorting | **High** |
| `/coins/{id}` | Detailed coin data (description, links, market) | **High** |
| `/coins/{id}/tickers` | Exchange tickers for a coin | Medium |
| `/coins/{id}/history` | Historical snapshot on a specific date | Medium |
| `/coins/{id}/market_chart` | Historical price/mcap/volume chart | **High** |
| `/coins/{id}/market_chart/range` | Chart data within custom date range | Medium |
| `/coins/{id}/ohlc` | OHLC candlestick data | **High** |
| `/coins/{platform}/contract/{address}` | Coin info by contract address | Medium |
| `/coins/{platform}/contract/{address}/market_chart` | Chart by contract address | Medium |
| `/coins/categories/list` | All coin category IDs | Low |
| `/coins/categories` | Categories with market data | Medium |
| `/nfts/list` | List all supported NFTs | Medium |
| `/nfts/{id}` | NFT collection data | Medium |
| `/exchanges` | All exchanges with data | Medium |
| `/exchanges/list` | Exchange IDs | Low |
| `/exchanges/{id}` | Exchange detail (volume, trust) | Medium |
| `/exchanges/{id}/tickers` | Exchange trading pairs | Medium |
| `/exchanges/{id}/volume_chart` | Exchange volume chart | Low |
| `/derivatives` | Derivative tickers | Medium |
| `/derivatives/exchanges` | Derivative exchange list | Low |
| `/asset_platforms` | List all asset platforms | Low |
| `/exchange_rates` | BTC-to-currency exchange rates | Medium |
| `/search` | Search coins, exchanges, categories | **High** |
| `/search/trending` | Trending coins, NFTs, categories | **High** |
| `/global` | Global crypto market data | **High** |
| `/global/decentralized_finance_defi` | Global DeFi data | Medium |
| `/onchain/networks` | On-chain DEX supported networks | Medium |
| `/onchain/networks/{network}/trending_pools` | Trending DEX pools | Medium |
| `/onchain/networks/{network}/pools/{address}/ohlcv/{tf}` | Pool OHLCV data | Medium |

#### Missing Feature Opportunities:
- **Trending coins page** using `/search/trending`
- **Global market overview** using `/global` for total market cap, BTC dominance
- **Coin detail pages** using `/coins/{id}` for project descriptions, links, community data
- **Historical charts** using `/coins/{id}/market_chart` for interactive price charts
- **Category tracking** for sector performance analysis
- **Exchange ranking** with trust scores and volume

---

### CoinMarketCap

**Base URL:** `https://pro-api.coinmarketcap.com/v1`
**Auth:** API key required (free tier: 10K calls/month)
**Rate Limits:** 30 calls/min
**Codebase adapter:** `coinmarketcap` in `src/lib/data-sources/index.ts`
**Codebase file:** `src/lib/apis/coinmarketcap.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered but specific endpoints not yet implemented in dedicated client | General market data | `src/lib/apis/coinmarketcap.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/cryptocurrency/listings/latest` | Top cryptocurrencies by market cap | **High** |
| `/cryptocurrency/quotes/latest` | Latest quotes for specific coins | **High** |
| `/cryptocurrency/map` | CoinMarketCap ID map | Medium |
| `/cryptocurrency/info` | Metadata (logo, description, links) | Medium |
| `/cryptocurrency/trending/latest` | Trending cryptocurrencies | **High** |
| `/cryptocurrency/trending/most-visited` | Most visited coins | Medium |
| `/cryptocurrency/trending/gainers-losers` | Top gainers and losers | **High** |
| `/global-metrics/quotes/latest` | Global market stats | **High** |
| `/exchange/listings/latest` | Exchange rankings | Medium |
| `/fiat/map` | Fiat currency map | Low |

#### Missing Feature Opportunities:
- **Trending & gainers/losers pages** using trending and gainers/losers endpoints
- **Global stats widget** using global-metrics endpoint
- **Cross-validation** of prices against other sources for accuracy

---

### CoinPaprika

**Base URL:** `https://api.coinpaprika.com/v1`
**Auth:** No API key required (free tier)
**Rate Limits:** 10 calls/min (free)
**Codebase constant:** `COINPAPRIKA_BASE`
**Codebase adapter:** `coinpaprika` in `src/lib/data-sources/index.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated API client calls found | Fallback market data | `src/lib/data-sources/index.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/global` | Market overview (mcap, volume, BTC dominance) | **High** |
| `/coins` | List all coins | Medium |
| `/coins/{coin_id}` | Coin details with rich metadata | Medium |
| `/coins/{coin_id}/events` | Upcoming coin events | **High** |
| `/coins/{coin_id}/exchanges` | Exchanges listing a coin | Low |
| `/coins/{coin_id}/markets` | Markets for a coin | Medium |
| `/coins/{coin_id}/ohlcv/today` | Today's OHLCV | Medium |
| `/coins/{coin_id}/ohlcv/latest` | Latest OHLCV | Medium |
| `/tickers` | Tickers for all active coins | Medium |
| `/tickers/{coin_id}` | Ticker for specific coin | Medium |
| `/exchanges` | List all exchanges | Low |
| `/tags` | Coin tags/categories | Low |
| `/people/{person_id}` | Founder/team details | Low |
| `/contracts` | Contract address lookup | Medium |
| `/search` | Search coins, exchanges, people | Medium |
| `/price-converter` | Currency conversion | Low |

#### Missing Feature Opportunities:
- **Crypto events calendar** using `/coins/{id}/events`
- **Free global market data** without API key
- **Contract address resolution** for token lookup

---

### CoinLore

**Base URL:** `https://api.coinlore.net/api`
**Auth:** None required
**Rate Limits:** No imposed limits (1 req/sec recommended)
**Codebase constant:** `COINLORE_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| No direct API calls found in codebase | Registered as constant only | `src/lib/constants.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/global/` | Global crypto stats (total coins, mcap, volume) | Medium |
| `/tickers/` | All coins sorted by market cap (paginated) | Medium |
| `/ticker/?id={id}` | Specific coin by ID | Low |
| `/coin/markets/?id={id}` | Top 50 markets for a coin | Low |
| `/exchanges/` | List all exchanges | Low |
| `/exchange/?id={id}` | Exchange details with top pairs | Low |
| `/coin/social_stats/?id={id}` | Twitter & Reddit stats | Medium |

#### Missing Feature Opportunities:
- **Completely free fallback** for market data when other APIs rate-limit
- **Social stats** without requiring LunarCrush API key

---

### CoinCap

**Base URL:** `https://api.coincap.io/v2` (DEPRECATED - migrated to `https://rest.coincap.io` v3)
**Auth:** v3 requires Bearer token for most endpoints; free prepaid key available (50 credits)
**Rate Limits:** Per-credit billing on v3
**Codebase constant:** `COINCAP_BASE` (still points to dead v2 URL)

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| No active usage - v2 DNS no longer resolves | Registered as constant only | `src/lib/constants.ts` |

#### Endpoints We DON'T Use (Available on v3):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/ta/{slug}/sma` | Simple Moving Average (no auth) | Medium |
| `/ta/{slug}/ema` | Exponential Moving Average (no auth) | Medium |
| `/ta/{slug}/rsi` | RSI indicator (no auth) | **High** |
| `/ta/{slug}/macd` | MACD indicator (no auth) | **High** |
| `/ta/{slug}/vwap/latest` | VWAP (no auth) | Medium |
| `/ta/{slug}/candlesticks` | Candlestick data (no auth) | Medium |
| `/agentFriendly/news_top` | Top 10 crypto news (auth) | Medium |
| `/agentFriendly/history/{slug}` | AI-optimized price history (auth) | Medium |

#### Missing Feature Opportunities:
- **Technical indicators** (RSI, MACD, SMA, EMA) available without auth on v3
- **IMPORTANT:** Update `COINCAP_BASE` constant - v2 is dead
- **AI-friendly endpoints** designed for LLM consumption

---

## DeFi & Protocol Data

### DeFiLlama (TVL)

**Base URL:** `https://api.llama.fi`
**Auth:** Free, no key required
**Rate Limits:** ~300 req/min
**Codebase adapter:** `defillama` in `src/lib/data-sources/index.ts`
**Codebase file:** `src/lib/apis/defillama.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/protocols` | All protocols with TVL data | `src/lib/apis/defillama.ts` |
| `/v2/chains` | Chain TVL rankings | `src/lib/apis/defillama.ts` |
| `/protocol/{name}` | Protocol detail with TVL history | `src/lib/apis/defillama.ts` |
| `/charts` | Global TVL chart (historical) | `src/lib/apis/defillama.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/raises` | Fundraising/VC rounds | **High** |
| `/hacks` | DeFi hacks & exploits data | **High** |
| `/categories` | Protocol category taxonomy | Medium |
| `/treasuries` | Protocol treasury balances | Medium |
| `/treasury/{name}` | Specific protocol treasury | Medium |
| `/emissions` | Token emission schedules | **High** |
| `/emission/{name}` | Specific protocol emissions | **High** |
| `/entities` | On-chain entity data | Low |
| `/chainAssets` | Chain asset composition | Medium |
| `/chain-assets/flows/{period}` | Capital flow between chains | **High** |
| `/news/articles` | DeFi news aggregation | Medium |
| `/rwa/stats` | Real World Asset statistics | Medium |
| `/config` | Protocol configuration metadata | Low |
| `/langs` | Programming languages used | Low |
| `/cexs` | Centralized exchange on-chain data | Medium |
| `/outdated` | Outdated/stale protocol data | Low |
| `/twitter/overview` | Twitter metrics for protocols | Medium |

#### Missing Feature Opportunities:
- **Fundraising tracker** using `/raises` for VC deal flow
- **DeFi security dashboard** using `/hacks` for exploit history
- **Token unlock/emission tracker** using emissions endpoints
- **Capital flow visualization** using chain-assets/flows

---

### DeFiLlama (Yields)

**Base URL:** `https://yields.llama.fi`
**Auth:** Free, no key required
**Codebase adapter:** `defillamaYields`
**Codebase file:** `src/lib/apis/defillama.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/pools` | All yield pools with APY, TVL | `src/lib/apis/defillama.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/poolsEnriched` | Enhanced pool data with extra fields | Medium |
| `/poolsBorrow` | Borrow-side pool data | **High** |
| `/lendBorrow` | Combined lending/borrowing rates | **High** |
| `/chart/{pool}` | Yield history chart for a pool | **High** |
| `/chartHourly/{pool}` | Hourly yield history | Medium |
| `/chartLendBorrow/{pool}` | Lend/borrow yield history | Medium |
| `/volume/{pool}` | Volume history for a pool | Medium |
| `/median` | Median yield across DeFi | Medium |
| `/lsdRates` | Liquid staking derivative rates | **High** |
| `/perps` | Perpetual futures funding rates | **High** |
| `/allPools` | Complete pool listing | Low |

#### Missing Feature Opportunities:
- **Lending/borrowing rate comparison** using `/lendBorrow` and `/poolsBorrow`
- **LSD rate tracker** for liquid staking yields (Lido, Rocket Pool, etc.)
- **Yield history charts** for individual pool performance tracking
- **Perp funding rates** as additional data source

---

### DeFiLlama (Coins/Prices)

**Base URL:** `https://coins.llama.fi`
**Auth:** Free, no key required
**Codebase adapter:** `defillamaCoins`
**Codebase file:** `src/lib/apis/defillama.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/prices/current/{coins}` | Current token prices | `src/lib/apis/defillama.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/prices/historical/{timestamp}/{coins}` | Historical prices at timestamp | **High** |
| `/prices/first/{coins}` | First recorded price | Low |
| `/chart/{coins}` | Price chart data | **High** |
| `/percentage/{coins}` | Price change percentages | Medium |
| `/volume/{coins}` | Volume data | Medium |
| `/block/{chain}/{timestamp}` | Block number at timestamp | Low |
| `/batchHistorical` | Batch historical prices | Medium |

#### Missing Feature Opportunities:
- **Historical price lookups** for portfolio tracking
- **Price charts** powered by DeFiLlama as CoinGecko alternative

---

### DeFiLlama (Stablecoins)

**Base URL:** `https://stablecoins.llama.fi`
**Auth:** Free, no key required
**Codebase adapter:** `defillamaStablecoins`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/stablecoins` | All stablecoins with supply data | `src/lib/apis/defillama.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/stablecoin/{id}` | Detailed stablecoin data by ID | Medium |
| `/stablecoinchains` | Chains with stablecoin supply | Medium |
| `/stablecoincharts/{chain}` | Stablecoin supply chart per chain | **High** |
| `/stablecoindominance/{chain}` | Stablecoin dominance data | Medium |
| `/stablecoinprices` | Historical stablecoin prices | Medium |
| `/rates` | Interest rates data | Medium |

#### Missing Feature Opportunities:
- **Stablecoin supply tracking** per chain for capital flow analysis
- **Stablecoin dominance shifts** (USDT vs USDC vs DAI)

---

### DeFiLlama (Bridges)

**Base URL:** `https://bridges.llama.fi`
**Auth:** Previously free; now requires paid API plan
**Codebase adapter:** `defillamaBridges`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/bridges` | List all bridges with volume | `src/lib/apis/defillama.ts` (via `https://api.llama.fi/bridges`) |

#### Endpoints We DON'T Use (Available - may require paid plan):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/bridge/{id}` | Specific bridge details | Medium |
| `/bridgevolume/{chain}` | Bridge volume per chain | Medium |
| `/bridgedaystats/{timestamp}/{chain}` | Daily bridge stats | Low |
| `/transactions/{id}` | Bridge transactions | Low |
| `/largetransactions/{chain}` | Large bridge transfers | **High** |
| `/netflows/{period}` | Net capital flows | **High** |

#### Missing Feature Opportunities:
- **Bridge whale tracking** via large transactions endpoint
- **Capital flow analysis** using net flows

---

### DeFiLlama (Volumes)

**Base URL:** `https://api.llama.fi/overview/dexs`
**Auth:** Free, no key required
**Codebase adapter:** `defillamaVolumes`
**Codebase file:** `src/lib/apis/dexes.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/overview/dexs` | All DEX protocols with volume | `src/lib/apis/dexes.ts` |
| `/overview/dexs/{chain}` | DEX volume filtered by chain | `src/lib/apis/dexes.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/summary/dexs/{name}` | Specific DEX volume summary | Medium |
| `/overview/derivatives` | Derivatives volume overview | **High** |
| `/overview/options` | Options volume overview | Medium |
| `/overview/aggregators` | Aggregator volume | Medium |
| `/overview/incentives` | Protocol incentives | Medium |
| `/overview/open-interest` | Open interest overview | **High** |
| `/overview/nft-volume` | NFT volume by protocol | Medium |
| `/overview/active-users` | Active user counts | **High** |
| `/overview/new-users` | New user counts | Medium |

#### Missing Feature Opportunities:
- **Derivatives volume dashboard** for on-chain derivatives
- **Active/new user tracking** per protocol
- **Open interest analysis** across DeFi protocols

---

### DeFiLlama (Fees)

**Base URL:** `https://fees.llama.fi` (routed via `https://api.llama.fi`)
**Auth:** Free, no key required
**Codebase adapter:** `defillamaFees`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/overview/fees` | Protocol fees overview | `src/lib/apis/defillama.ts` |
| `/overview/fees?dataType=dailyRevenue` | Protocol revenue data | `src/lib/apis/defillama.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/summary/fees/{name}` | Fees for a specific protocol | Medium |
| `/overview/fees/{chain}` | Fees filtered by chain | Medium |

---

## DEX & On-Chain Trading

### GeckoTerminal

**Base URL:** `https://api.geckoterminal.com/api/v2`
**Auth:** Free, no key required
**Rate Limits:** ~30 req/min
**Codebase adapter:** `geckoterminal`
**Codebase file:** `src/lib/apis/geckoterminal.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/networks` | List supported networks | `src/lib/apis/geckoterminal.ts` |
| `/networks/trending_pools` | Trending pools globally | `src/lib/apis/geckoterminal.ts` |
| `/networks/{network}/trending_pools` | Trending pools per network | `src/lib/apis/geckoterminal.ts` |
| `/networks/{network}/tokens/{address}/pools` | Pools for a token | `src/lib/apis/geckoterminal.ts` |
| `/networks/{network}/tokens/{address}` | Token data by address | `src/lib/apis/geckoterminal.ts` |
| `/simple/networks/{network}/token_price/{addresses}` | Multi-token price lookup | `src/lib/apis/geckoterminal.ts` |
| `/networks/{network}/pools/{address}/ohlcv/{timeframe}` | Pool OHLCV candlesticks | `src/lib/apis/geckoterminal.ts` |
| `/networks/{network}/new_pools` | Newly created pools | `src/lib/apis/geckoterminal.ts` |
| `/search/pools` | Search pools by query | `src/lib/apis/geckoterminal.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/networks/{network}/dexes` | List DEXes on a network | Low |
| `/networks/{network}/pools/{address}` | Pool data by address | Medium |
| `/networks/{network}/pools/multi/{addresses}` | Multiple pools data | Medium |
| `/networks/{network}/pools/{address}/trades` | Pool trades (24h) | **High** |
| `/networks/{network}/pools/{address}/info` | Pool token info | Low |
| `/networks/{network}/tokens/multi/{addresses}` | Multiple tokens data | Medium |
| `/networks/{network}/tokens/{address}/info` | Token metadata | Low |
| `/tokens/info/recently_updated` | Recently updated tokens | Medium |

#### Missing Feature Opportunities:
- **Live trade feed** using pool trades endpoint
- **Multi-pool analytics** for portfolio tracking

---

### DexScreener

**Base URL:** `https://api.dexscreener.com`
**Auth:** Free, no key required
**Rate Limits:** 60 req/min
**Codebase adapter:** `dexscreener`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated API client | General DEX data | `src/lib/data-sources/index.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/token-profiles/latest/v1` | Latest token profiles | Medium |
| `/token-boosts/latest/v1` | Latest token boosts | Low |
| `/token-boosts/top/v1` | Top boosted tokens | Low |
| `/latest/dex/pairs/{chainId}/{pairId}` | Pair data by chain | **High** |
| `/latest/dex/search` | Search pairs | **High** |
| `/token-pairs/v1/{chainId}/{tokenAddress}` | Token pairs by address | **High** |
| `/tokens/v1/{chainId}/{tokenAddresses}` | Token data by address | **High** |
| `/orders/v1/{chainId}/{tokenAddress}` | Orders for a token | Medium |

#### Missing Feature Opportunities:
- **Token search** with real-time pair data
- **Cross-chain token tracking** by contract address
- **New token discovery** via token profiles

---

### Defined.fi

**Base URL:** `https://graph.defined.fi/graphql`
**Auth:** API key required
**Codebase adapter:** `defined`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated API client | GraphQL DEX data | `src/lib/data-sources/index.ts` |

#### Missing Feature Opportunities:
- **Advanced DEX analytics** via GraphQL queries
- **Token holder analysis** and wallet tracking

---

## Centralized Exchange APIs

### Binance (Spot)

**Base URL:** `https://api.binance.com/api/v3`
**Auth:** None for market data endpoints
**Rate Limits:** 1200 req/min (IP-based)
**Codebase constant:** `BINANCE_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/ticker/24hr` | 24h price/volume for top 20 coins (with symbols filter) | `src/lib/data-pipeline.ts` |
| `/ticker/bookTicker` | Best bid/ask for all symbols (arbitrage) | `src/lib/trading/arbitrage.ts` |
| `/ticker/24hr` | 24h volume data (arbitrage volume lookup) | `src/lib/trading/arbitrage.ts` |
| `/ticker/bookTicker?symbol={pair}` | Specific pair bid/ask (triangular arb) | `src/lib/trading/arbitrage.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/ping` | Connectivity test | Low |
| `/time` | Server time | Low |
| `/exchangeInfo` | Trading rules, all symbols, rate limits | Medium |
| `/depth` | Order book depth | **High** |
| `/trades` | Recent trades | Medium |
| `/historicalTrades` | Historical trades | Medium |
| `/aggTrades` | Aggregate trades | Medium |
| `/klines` | Candlestick/OHLCV data | **High** |
| `/uiKlines` | UI-optimized klines | Medium |
| `/avgPrice` | Current average price | Low |
| `/ticker/tradingDay` | Trading day stats | Low |
| `/ticker/price` | Latest price (lightweight) | Medium |
| `/ticker` | Rolling window stats (configurable) | Low |

#### Missing Feature Opportunities:
- **Order book depth visualization** using `/depth`
- **OHLCV charts** using `/klines` as alternative to CoinGecko
- **Real-time trade stream** for trade activity monitoring

---

### Binance (USDS-M Futures)

**Base URL:** `https://fapi.binance.com`
**Auth:** None for market data endpoints
**Rate Limits:** 2400 req/min
**Codebase constant:** `BINANCE_FUTURES_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/fapi/v1/premiumIndex` | Funding rates + mark/index price | `src/lib/data-pipeline.ts`, `src/lib/trading/funding-rates.ts` |
| `/fapi/v1/fundingRate` | Historical funding rate data | `src/lib/trading/funding-rates.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/fapi/v1/depth` | Futures order book | Medium |
| `/fapi/v1/klines` | Futures candlestick data | **High** |
| `/fapi/v1/continuousKlines` | Continuous contract klines | Medium |
| `/fapi/v1/fundingInfo` | Current funding info/schedule | Medium |
| `/fapi/v1/ticker/24hr` | 24h futures ticker stats | Medium |
| `/fapi/v1/openInterest` | Current open interest | **High** |
| `/fapi/v1/openInterestHist` | Historical open interest | **High** |
| `/fapi/v1/topLongShortPositionRatio` | Top trader position ratios | **High** |
| `/fapi/v1/topLongShortAccountRatio` | Top trader account ratios | **High** |
| `/fapi/v1/globalLongShortAccountRatio` | Global long/short ratio | **High** |
| `/fapi/v1/takerBuySellVol` | Taker buy/sell volume | **High** |
| `/fapi/v1/basis` | Futures/spot basis spread | **High** |
| `/fapi/v1/compositeIndex` | Composite index info | Low |
| `/fapi/v1/insuranceFund` | Insurance fund balance | Medium |
| `/fapi/v1/markPriceKlines` | Mark price klines | Medium |

#### Missing Feature Opportunities:
- **Open interest dashboard** with historical OI charts
- **Long/short ratio tracking** for market sentiment
- **Futures basis spread** for cash-and-carry arbitrage signals
- **Taker volume analysis** for directional flow detection

---

### Bybit

**Base URL:** `https://api.bybit.com/v5`
**Auth:** None for market data
**Rate Limits:** 120 req/min
**Codebase constant:** `BYBIT_BASE`
**Codebase adapter:** `bybit`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/market/tickers?category=linear` | Linear perp tickers (funding rates) | `src/lib/trading/funding-rates.ts` |
| `/market/tickers?category=spot` | Spot tickers (arbitrage) | `src/lib/trading/arbitrage.ts` |
| `/market/funding/history` | Historical funding rates | `src/lib/trading/funding-rates.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/market/kline` | Candlestick/Kline data | Medium |
| `/market/mark-kline` | Mark price kline | Low |
| `/market/index-kline` | Index price kline | Low |
| `/market/instrument` | Instrument/contract specifications | Medium |
| `/market/orderbook` | Order book depth | Medium |
| `/market/history-fund-rate` | Historical funding rates | Medium |
| `/market/recent-trade` | Recent public trades | Medium |
| `/market/open-interest` | Open interest | **High** |
| `/market/iv` | Historical volatility | Medium |
| `/market/insurance` | Insurance pool data | Low |
| `/market/long-short-ratio` | Long/short ratio | **High** |
| `/market/delivery-price` | Delivery/settlement price | Low |

#### Missing Feature Opportunities:
- **Cross-exchange open interest aggregation**
- **Long/short ratio comparison** across exchanges

---

### OKX

**Base URL:** `https://www.okx.com/api/v5`
**Auth:** None for market/public endpoints
**Rate Limits:** 60 req/2s
**Codebase constant:** `OKX_BASE`
**Codebase adapter:** `okx`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/public/funding-rate?instId={symbol}` | Current funding rate per instrument | `src/lib/trading/funding-rates.ts` |
| `/market/tickers?instType=SPOT` | Spot tickers (arbitrage) | `src/lib/trading/arbitrage.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/market/tickers?instType=SWAP` | Perpetual swap tickers | Medium |
| `/market/books` | Order book | Medium |
| `/market/candles` | Candlestick data | Medium |
| `/market/history-candles` | Historical candlesticks | Medium |
| `/market/trades` | Recent trades | Medium |
| `/market/volume-24h` | Platform 24h volume | Medium |
| `/public/instruments` | Instrument specifications | Medium |
| `/public/open-interest` | Open interest | **High** |
| `/public/open-interest-history` | Historical open interest | **High** |
| `/public/funding-rate-history` | Funding rate history | Medium |
| `/public/mark-price` | Mark prices | Low |
| `/public/estimated-price` | Estimated delivery price | Low |
| `/public/insurance-fund` | Insurance fund | Low |
| `/public/economic-calendar` | Economic calendar events | **High** |
| `/public/announcements` | Platform announcements | Medium |
| `/rubik/stat/contracts/long-short-account-ratio` | Long/short account ratio | **High** |
| `/rubik/stat/contracts/open-interest-volume` | OI + volume stats | **High** |
| `/rubik/stat/option/put-call-ratio` | Put/call ratio | Medium |
| `/rubik/stat/taker-volume` | Taker buy/sell volume | **High** |
| `/system/status` | System maintenance status | Low |

#### Missing Feature Opportunities:
- **Economic calendar** from OKX announcements
- **Options analytics** (put/call ratio)
- **Multi-exchange taker volume aggregation**

---

### Kraken

**Base URL:** `https://api.kraken.com/0/public`
**Auth:** None for public endpoints
**Rate Limits:** 1 req/sec (public)

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/Ticker?pair={pairs}` | Bid/ask/price for arbitrage scanning | `src/lib/trading/arbitrage.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/AssetPairs` | Trading pair info and specs | Low |
| `/Depth` | Order book depth | Medium |
| `/Trades` | Recent trades | Low |
| `/OHLC` | OHLC data | Medium |
| `/Spread` | Spread data | Low |
| `/SystemStatus` | System status | Low |

---

### KuCoin

**Base URL:** `https://api.kucoin.com/api/v1`
**Auth:** None for market data
**Rate Limits:** Per-IP limits

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/market/allTickers` | All tickers for arbitrage | `src/lib/trading/arbitrage.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/market/orderbook/level2_20` | Order book (top 20) | Medium |
| `/market/histories` | Trade history | Low |
| `/market/candles` | Kline data | Medium |
| `/market/stats` | 24hr stats | Low |

---

### dYdX

**Base URL:** `https://api.dydx.exchange/v3`
**Auth:** None for market data
**Codebase constant:** `DYDX_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Registered as exchange in funding rates config | Funding rate source | `src/lib/trading/funding-rates.ts` (config only) |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/markets` | All available markets | Medium |
| `/orderbook/{market}` | Order book | Medium |
| `/trades/{market}` | Recent trades | Low |
| `/candles/{market}` | Candlestick data | Medium |
| `/historicalFunding/{market}` | Historical funding rates | Medium |

---

### Hyperliquid

**Base URL:** `https://api.hyperliquid.xyz`
**Auth:** None for market data
**Codebase adapter:** `hyperliquid`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Registered in exchange config for funding rates | Funding rate source | `src/lib/trading/funding-rates.ts` (config only, no fetch impl) |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `POST /info` (action: meta) | Market metadata | Medium |
| `POST /info` (action: allMids) | All mid prices | Medium |
| `POST /info` (action: l2Book) | L2 order book | Medium |
| `POST /info` (action: recentTrades) | Recent trades | Medium |
| `POST /info` (action: fundingHistory) | Funding history | **High** |
| `POST /info` (action: openOrders) | Open interest | **High** |

#### Missing Feature Opportunities:
- **Implement actual Hyperliquid funding rate fetching** (currently config-only)
- **Hyperliquid is the largest on-chain perps DEX** - high priority to integrate

---

### Deribit

**Base URL:** `https://www.deribit.com/api/v2/public`
**Auth:** None for public endpoints
**Codebase adapter:** `deribit`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no direct calls found | Options/derivatives data | `src/lib/data-sources/index.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/get_index_price` | Index price | Medium |
| `/get_book_summary_by_currency` | Book summary (BTC/ETH) | **High** |
| `/get_funding_rate_history` | Historical funding rates | Medium |
| `/get_funding_rate_value` | Current funding rate | Medium |
| `/get_historical_volatility` | Historical volatility | **High** |
| `/get_instruments` | Available instruments | Medium |
| `/get_order_book` | Order book | Medium |
| `/get_trade_volumes` | Trade volumes | Medium |
| `/ticker` | Ticker data | Medium |

#### Missing Feature Opportunities:
- **Options market data** (Deribit is the dominant crypto options exchange)
- **Implied volatility tracking** for market risk assessment
- **Options open interest** for institutional positioning signals

---

## On-Chain & Blockchain Explorers

### Etherscan

**Base URL:** `https://api.etherscan.io/api`
**Auth:** API key required (free tier: 5 calls/sec)
**Codebase adapter:** `etherscan`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `?module=gastracker&action=gasoracle` | Ethereum gas price oracle | `src/lib/data-pipeline.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `?module=account&action=balance` | ETH balance for address | Medium |
| `?module=account&action=txlist` | Transaction list for address | Medium |
| `?module=account&action=tokentx` | ERC-20 token transfers | Medium |
| `?module=account&action=tokennfttx` | ERC-721 (NFT) transfers | Medium |
| `?module=stats&action=ethsupply` | Total ETH supply | Medium |
| `?module=stats&action=ethprice` | ETH price (from Etherscan) | Low |
| `?module=stats&action=chainsize` | Chain size | Low |
| `?module=stats&action=nodecount` | Node count | Medium |
| `?module=contract&action=getabi` | Contract ABI | Low |
| `?module=contract&action=getsourcecode` | Verified source code | Low |
| `?module=logs&action=getLogs` | Event logs | Medium |
| `?module=token&action=tokeninfo` | Token information | Medium |
| `?module=gastracker&action=gasestimate` | Gas estimation | Low |

#### Missing Feature Opportunities:
- **Whale transaction monitoring** using token transfer endpoints
- **Contract interaction tracking** for DeFi protocol analysis

---

### Basescan

**Base URL:** `https://api.basescan.org/api`
**Auth:** API key required
**Codebase adapter:** `basescan`

Same endpoint structure as Etherscan. No direct calls found - adapter registered only.

---

### Arbiscan

**Base URL:** `https://api.arbiscan.io/api`
**Auth:** API key required
**Codebase adapter:** `arbiscan`

Same endpoint structure as Etherscan. No direct calls found - adapter registered only.

---

### Polygonscan

**Base URL:** `https://api.polygonscan.com/api`
**Auth:** API key required
**Codebase adapter:** `polygonscan`

Same endpoint structure as Etherscan. No direct calls found - adapter registered only.

---

### Solscan

**Base URL:** `https://pro-api.solscan.io/v2.0`
**Auth:** API key required
**Codebase adapter:** `solscan`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no direct calls found | Solana explorer data | `src/lib/data-sources/index.ts` |

---

### Blockchair

**Base URL:** `https://api.blockchair.com`
**Auth:** Free tier available (no key), key for higher limits
**Codebase adapter:** `blockchairBtc`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no direct calls found | Bitcoin blockchain data | `src/lib/data-sources/index.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/stats` | Aggregated stats for all chains | Medium |
| `/{chain}/stats` | Per-chain statistics | Medium |
| `/{chain}/dashboards/transaction/{hash}` | Transaction details | Medium |
| `/{chain}/dashboards/address/{address}` | Address details | Medium |
| `/bitcoin/halving` | Bitcoin halving countdown | **High** |
| `/news` | Crypto news aggregator | Medium |
| `/bitcoin/transaction/score/{hash}` | Transaction privacy score | Low |
| `/{chain}/erc-20/stats` | ERC-20 token stats | Medium |

#### Missing Feature Opportunities:
- **Bitcoin halving countdown** widget
- **Multi-chain address lookups** (Blockchair supports 17+ chains)

---

### Mempool.space

**Base URL:** `https://mempool.space/api`
**Auth:** Free, no key required
**Rate Limits:** ~50 req/min
**Codebase constant:** `MEMPOOL_BASE`
**Codebase adapter:** `mempoolSpace`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no direct calls found | Bitcoin mempool data | `src/lib/data-sources/index.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/v1/fees/recommended` | Recommended Bitcoin fee rates | **High** |
| `/v1/difficulty-adjustment` | Difficulty adjustment progress | **High** |
| `/v1/mempool` | Mempool statistics | Medium |
| `/v1/blocks/tip/height` | Current block height | Medium |
| `/v1/mining/pools` | Mining pool distribution | **High** |
| `/v1/mining/hashrate/{interval}` | Network hashrate history | **High** |
| `/v1/mining/difficulty-adjustments` | Difficulty history | Medium |
| `/v1/mining/blocks/fees/{interval}` | Block fee trends | Medium |
| `/v1/address/{address}` | Address details | Medium |
| `/v1/address/{address}/txs` | Address transactions | Medium |
| `/v1/tx/{txId}` | Transaction details | Medium |
| `/v1/historical-price` | Historical BTC price | Medium |

#### Missing Feature Opportunities:
- **Bitcoin fee estimator** using recommended fees
- **Bitcoin mining dashboard** with hashrate, pools, difficulty
- **Bitcoin network health** monitoring

---

### Blockchain.info

**Base URL:** `https://blockchain.info`
**Auth:** Free, no key required
**Rate Limits:** 1 req/10 sec
**Codebase constant:** `BLOCKCHAIN_INFO_BASE`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| No direct calls found | Registered as constant only | `src/lib/constants.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/ticker` | BTC exchange rates in 20+ currencies | Medium |
| `/q/getdifficulty` | Current mining difficulty | Medium |
| `/q/getblockcount` | Current block height | Low |
| `/q/totalbc` | Total BTC in circulation | Medium |
| `/q/hashrate` | Network hashrate | Medium |
| `/q/24hrtransactioncount` | 24h transaction count | Medium |
| `/q/unconfirmedcount` | Unconfirmed tx count | Medium |
| `/q/marketcap` | USD market cap | Low |
| `https://api.blockchain.info/stats` | Comprehensive blockchain stats | **High** |
| `https://api.blockchain.info/charts/{name}` | Historical chart data | Medium |
| `https://api.blockchain.info/pools` | Mining pool distribution | Medium |

#### Missing Feature Opportunities:
- **Real-time blockchain stats** dashboard
- **Bitcoin network metrics** (mempool, hashrate, difficulty)

---

## On-Chain Analytics

### Glassnode

**Base URL:** `https://api.glassnode.com/v1`
**Auth:** API key required
**Codebase adapter:** `glassnode`
**Codebase file:** `src/lib/apis/glassnode.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, dedicated file exists | On-chain metrics | `src/lib/apis/glassnode.ts` |

#### Key Available Endpoints (freemium tier):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/metrics/market/price_usd_close` | Close price | Low |
| `/metrics/addresses/active_count` | Active addresses | **High** |
| `/metrics/addresses/new_non_zero_count` | New addresses | **High** |
| `/metrics/supply/current` | Current supply | Medium |
| `/metrics/transactions/count` | Transaction count | Medium |
| `/metrics/indicators/sopr` | Spent Output Profit Ratio | **High** |
| `/metrics/indicators/nupl` | Net Unrealized Profit/Loss | **High** |
| `/metrics/mining/hash_rate_mean` | Mining hashrate | Medium |

---

### Santiment

**Base URL:** `https://api.santiment.net/graphql`
**Auth:** API key required
**Codebase adapter:** `santiment`, `santimentSocial`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated client | On-chain & social data | `src/lib/data-sources/index.ts` |

#### Key Available GraphQL Queries:

| Query | What It Provides | Priority |
|-------|-----------------|----------|
| `getMetric(metric: "dev_activity")` | Developer activity | **High** |
| `getMetric(metric: "social_volume_total")` | Social volume | **High** |
| `getMetric(metric: "sentiment_balance_total")` | Sentiment balance | **High** |
| `getMetric(metric: "whale_transaction_count_100k_usd_to_inf")` | Whale transactions | **High** |
| `getMetric(metric: "exchange_inflow")` | Exchange inflow | **High** |
| `getMetric(metric: "exchange_outflow")` | Exchange outflow | **High** |

---

### Dune Analytics

**Base URL:** `https://api.dune.com/api/v1`
**Auth:** API key required
**Codebase adapter:** `dune`
**Codebase file:** `src/lib/apis/dune.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, dedicated file exists | Custom SQL queries | `src/lib/apis/dune.ts` |

#### Key Available Endpoints:

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/query/{id}/execute` | Execute a saved query | **High** |
| `/query/{id}/results` | Get query results | **High** |
| `/execution/{id}/status` | Query execution status | Medium |
| `/execution/{id}/results` | Execution results | Medium |

---

### Flipside Crypto

**Base URL:** `https://api-v2.flipsidecrypto.xyz`
**Auth:** API key required
**Codebase adapter:** `flipside`

No dedicated client implementation. Adapter registered only.

---

### CryptoQuant

**Codebase file:** `src/lib/apis/cryptoquant.ts`

#### Endpoints available (API key required):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| Exchange flows | BTC/ETH exchange inflow/outflow | **High** |
| Miner flows | Mining pool outflows | Medium |
| Network data | On-chain metrics | Medium |
| Market data | Derivatives metrics | Medium |

---

## Social & Sentiment

### LunarCrush

**Base URL:** `https://lunarcrush.com/api4/public`
**Auth:** API key required (Bearer token)
**Rate Limits:** ~10 req/min
**Codebase adapter:** `lunarcrush`
**Codebase file:** `src/lib/apis/lunarcrush.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/coins/{symbol}/meta` | Social metrics for a coin | `src/lib/apis/lunarcrush.ts` |
| `/coins/list` | Top coins by social volume | `src/lib/apis/lunarcrush.ts` |
| `/influencers` | Top crypto influencers | `src/lib/apis/lunarcrush.ts` |
| `/topics/trending` | Trending topics in crypto | `src/lib/apis/lunarcrush.ts` |
| `/coins/{symbol}/feeds` | Social feed for a coin | `src/lib/apis/lunarcrush.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/coins/{symbol}/time-series` | Historical social metrics | **High** |
| `/coins/{symbol}/influencers` | Influencers for specific coin | Medium |
| `/nft/list` | NFT social data | Medium |
| `/categories` | Category performance | Medium |

#### Missing Feature Opportunities:
- **Social metric time series** for trend analysis
- **Influencer-coin correlation** tracking

---

### CryptoCompare

**Base URL:** `https://min-api.cryptocompare.com/data`
**Auth:** API key (free tier: 100K calls/month)
**Codebase constant:** `CRYPTOCOMPARE_BASE`
**Codebase file:** `src/lib/apis/cryptocompare.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/pricemulti` | Real-time multi-coin prices | `src/lib/apis/cryptocompare.ts` |
| `/pricemultifull` | Full price data (24h change, volume, mcap) | `src/lib/apis/cryptocompare.ts` |
| `/v2/histominute` | Minute OHLCV data | `src/lib/apis/cryptocompare.ts` |
| `/v2/histohour` | Hourly OHLCV data | `src/lib/apis/cryptocompare.ts` |
| `/v2/histoday` | Daily OHLCV data | `src/lib/apis/cryptocompare.ts` |
| `/v2/news/` | Latest crypto news | `src/lib/apis/cryptocompare.ts` |
| `/news/categories` | News categories | `src/lib/apis/cryptocompare.ts` |
| `/news/feeds` | News feeds | `src/lib/apis/cryptocompare.ts` |
| `/social/coin/latest` | Social stats (Twitter, Reddit, GitHub) | `src/lib/apis/cryptocompare.ts` |
| `/tradingsignals/intotheblock/latest` | On-chain trading signals | `src/lib/apis/cryptocompare.ts` |
| `/top/exchanges/full` | Top exchanges by volume | `src/lib/apis/cryptocompare.ts` |
| `/top/mktcapfull` | Top coins by market cap | `src/lib/apis/cryptocompare.ts` |
| `/top/totalvolfull` | Top coins by volume | `src/lib/apis/cryptocompare.ts` |
| `/blockchain/histo/day` | Blockchain daily metrics | `src/lib/apis/cryptocompare.ts` |
| `/ob/l2/snapshot` | L2 order book snapshot | `src/lib/apis/cryptocompare.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/price` | Single price lookup | Low |
| `/generateAvg` | Generate average price | Low |
| `/top/pairs` | Top trading pairs for a coin | Medium |
| `/top/volumes` | Top volumes by pair | Medium |
| `/all/exchanges` | All exchanges data | Medium |
| `/exchange/histoday` | Exchange historical data | Medium |
| `/social/coin/histo/day` | Historical social stats | **High** |
| `/blockchain/latest` | Latest blockchain data | Medium |
| `/walletbalances` | Wallet balance tracking | Medium |

#### Missing Feature Opportunities:
- **Historical social stats** for sentiment trend analysis
- **Exchange-level historical data** for volume analysis

---

### Alternative.me

**Base URL:** `https://api.alternative.me`
**Auth:** Free, no key required
**Codebase constant:** `ALTERNATIVE_ME_BASE`
**Codebase adapter:** `alternative`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/fng/` | Current Fear & Greed Index | `src/lib/data-pipeline.ts` |
| `/fng/?limit=30` | 30-day historical Fear & Greed | `src/lib/data-pipeline.ts` |

This is a single-endpoint API. We use it fully.

---

## NFT Markets

### OpenSea

**Base URL:** `https://api.opensea.io/api/v2`
**Auth:** API key required
**Codebase file:** `src/lib/apis/nft-markets.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/collections/{slug}` | Collection details (name, image, links) | `src/lib/apis/nft-markets.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/collections` | List/search collections | Medium |
| `/collections/{slug}/stats` | Collection floor, volume stats | **High** |
| `/collections/{slug}/nfts` | NFTs in a collection | Medium |
| `/events/collection/{slug}` | Sales, transfers, listings | **High** |
| `/orders/listings` | Active listings | Medium |
| `/orders/offers` | Active offers | Medium |
| `/nft/{chain}/{address}/{identifier}` | Individual NFT data | Medium |

#### Missing Feature Opportunities:
- **Collection stats** directly from OpenSea
- **NFT event feed** for sales, listings tracking

---

### Reservoir

**Base URL:** `https://api.reservoir.tools`
**Auth:** API key (optional, higher limits with key)
**Codebase adapter:** `reservoir`
**Codebase file:** `src/lib/apis/nft-markets.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/collections/v6` | Collection stats (floor, volume, owners) | `src/lib/apis/nft-markets.ts` |
| `/collections/trending/v1` | Trending NFT collections | `src/lib/apis/nft-markets.ts` |
| `/sales/v4` | Recent NFT sales | `src/lib/apis/nft-markets.ts` |
| `/collections/activity/v6` | Collection activity feed | `src/lib/apis/nft-markets.ts` |
| `/orders/asks/v5` | Active listings | `src/lib/apis/nft-markets.ts` |
| `/search/collections/v2` | Search collections | `src/lib/apis/nft-markets.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/tokens/v7` | Token-level data | Medium |
| `/tokens/floor/v1` | Floor price per attribute | Medium |
| `/orders/bids/v6` | Active bids/offers | Medium |
| `/transfers/v3` | NFT transfers | Medium |
| `/owners/v2` | Top owners | Medium |
| `/collections/daily-volumes/v1` | Daily volume history | **High** |
| `/oracle/collections/floor-ask/v6` | Floor price oracle | Medium |

---

### SimpleHash

**Base URL:** `https://api.simplehash.com/api/v0`
**Auth:** API key required
**Codebase adapter:** `simplehash`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated client | Multi-chain NFT data | `src/lib/data-sources/index.ts` |

---

## Research & Intelligence

### Messari

**Base URL:** `https://data.messari.io/api/v1`
**Auth:** API key (free tier available)
**Codebase adapter:** `messari`
**Codebase file:** `src/lib/apis/messari.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/assets` | List all assets (paginated) | `src/lib/apis/messari.ts` |
| `/assets/{symbol}` | Detailed asset data | `src/lib/apis/messari.ts` |
| `/assets/{symbol}/profile` | Asset profile (description, team) | `src/lib/apis/messari.ts` |
| `/assets/{symbol}/metrics` | Asset metrics (mcap, supply, on-chain) | `src/lib/apis/messari.ts` |
| `/assets/{symbol}/metrics/market-data` | Market data subset | `src/lib/apis/messari.ts` |
| `/assets/{symbol}/metrics/roi-data` | ROI performance data | `src/lib/apis/messari.ts` |
| `/news` | General news/research feed | `src/lib/apis/messari.ts` |
| `/assets/{symbol}/news` | News for specific asset | `src/lib/apis/messari.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/v2/assets` | V2 asset data (enhanced) | Medium |
| `/assets/{symbol}/metrics/all-time-high` | ATH data | Medium |
| `/assets/{symbol}/timeseries/{metric}` | Historical metrics timeseries | **High** |
| `/v2/assets/{symbol}/profile` | Enhanced profile data | Medium |

#### Missing Feature Opportunities:
- **Historical metrics timeseries** for on-chain trend analysis
- **Asset comparison dashboards** with rich profile data

---

### Token Terminal

**Base URL:** `https://api.tokenterminal.com/v2`
**Auth:** API key required (paid)
**Codebase adapter:** `tokenTerminal`
**Codebase file:** `src/lib/apis/tokenterminal.ts`

Paid API - adapter registered but likely not actively used without subscription.

---

### Coinglass

**Base URL:** `https://open-api.coinglass.com/public/v2`
**Auth:** API key required (free tier)
**Codebase adapter:** `coinglass`
**Codebase file:** `src/lib/apis/coinglass.ts`

#### Key Available Endpoints:

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/funding` | Aggregated funding rates | **High** |
| `/open_interest` | Aggregated open interest | **High** |
| `/liquidation` | Liquidation data | **High** |
| `/long_short` | Long/short ratios | **High** |
| `/option` | Options data | Medium |

#### Missing Feature Opportunities:
- **Aggregated derivatives dashboard** combining data from all exchanges
- **Liquidation tracking** for market impact analysis

---

## Layer 2 & Scaling

### L2Beat

**Base URL:** `https://l2beat.com/api`
**Auth:** Free, no key required (no official public API)
**Rate Limits:** Aggressive rate limiting
**Codebase adapter:** `l2beat`
**Codebase file:** `src/lib/apis/l2beat.ts`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| `/scaling/summary` | All L2 projects with TVL, stages, risks | `src/lib/apis/l2beat.ts` |
| `/scaling/activity` | L2 transaction activity (fallback) | `src/lib/apis/l2beat.ts` |

#### Endpoints We DON'T Use (Available):

| Endpoint | What It Provides | Priority |
|----------|-----------------|----------|
| `/scaling/tvs` | Total value secured time-series | **High** |
| `/scaling/liveness` | Liveness data (sequencer uptime) | Medium |
| `/scaling/finality` | Finality times per L2 | **High** |
| `/scaling/costs` | L2 transaction costs | **High** |
| `/scaling/da` | Data availability info | Medium |
| `/scaling/risk` | Risk assessments | Medium |

#### Missing Feature Opportunities:
- **L2 cost comparison** using costs endpoint
- **Finality tracking** for bridge/withdrawal time estimates
- **TVS historical charts** for L2 ecosystem growth

---

## Governance

### Snapshot

**Base URL:** `https://hub.snapshot.org/graphql`
**Auth:** Free, no key required
**Rate Limits:** 60 req/min
**Codebase adapter:** `snapshot`

#### Endpoints We USE:

| Endpoint | Purpose | File |
|----------|---------|------|
| Adapter registered, no dedicated client | DAO governance data | `src/lib/data-sources/index.ts` |

#### Key Available GraphQL Queries:

| Query | What It Provides | Priority |
|-------|-----------------|----------|
| `spaces` | List/filter DAO spaces | **High** |
| `proposals` | Governance proposals | **High** |
| `votes` | Vote records | Medium |
| `vp` | Voting power lookup | Medium |

#### Missing Feature Opportunities:
- **DAO governance feed** showing active proposals
- **Voting analytics** for protocol governance tracking

---

### Tally

**Base URL:** `https://api.tally.xyz/query`
**Auth:** API key required
**Codebase adapter:** `tally`

On-chain governance data for Ethereum-based DAOs. Adapter registered only.

---

## Whale Tracking

### Arkham Intelligence

**Base URL:** `https://api.arkhamintelligence.com`
**Auth:** API key required (paid)
**Codebase adapter:** `arkhamIntel`
**Codebase file:** `src/lib/apis/arkham.ts`

Paid API - adapter registered for whale tracking and entity labeling.

---

### Nansen

**Base URL:** `https://api.nansen.ai/v1`
**Auth:** API key required (paid)
**Codebase adapter:** `nansen`
**Codebase file:** `src/lib/apis/nansen.ts`

Paid API - adapter registered for smart money tracking and wallet labeling.

---

## News & RSS Feeds

**Codebase file:** `src/lib/data-pipeline.ts`, `src/lib/apis/news-feeds.ts`

#### RSS Feeds We USE:

| Feed URL | Source | Category |
|----------|--------|----------|
| `coindesk.com/arc/outboundfeeds/rss/` | CoinDesk | Major outlet |
| `theblock.co/rss.xml` | The Block | Major outlet |
| `cointelegraph.com/rss` | CoinTelegraph | Major outlet |
| `bitcoinmagazine.com/.rss/full/` | Bitcoin Magazine | Bitcoin-focused |
| `decrypt.co/feed` | Decrypt | General crypto |
| `dlnews.com/arc/outboundfeeds/rss/` | DL News | DeFi/web3 |
| `blockworks.co/feed` | Blockworks | Institutional |
| `thedefiant.io/feed` | The Defiant | DeFi |
| `rekt.news/rss.xml` | Rekt News | DeFi security |
| `messari.io/rss` | Messari | Research |
| `u.today/rss` | U.Today | General crypto |
| `coinbase.com/blog/rss.xml` | Coinbase Blog | Exchange |
| `solana.com/news/rss.xml` | Solana News | Solana ecosystem |
| `insights.glassnode.com/rss/` | Glassnode Insights | On-chain analysis |
| `alchemy.com/blog/rss` | Alchemy Blog | Developer/web3 |
| `stacker.news/rss` | Stacker News | Bitcoin/Lightning |
| `reuters.com/technology/cryptocurrency/rss` | Reuters Crypto | Mainstream |
| `cnbc.com/.../rss.html` | CNBC Crypto | Mainstream |
| `finance.yahoo.com/rss/cryptocurrency` | Yahoo Finance | Mainstream |
| `l2beat.com/blog/rss.xml` | L2Beat Blog | Layer 2 |
| `watcher.guru/news/feed` | Watcher.Guru | Breaking news |
| `cryptopolitan.com/feed/` | Cryptopolitan | General crypto |
| `techcrunch.com/.../feed/` | TechCrunch Crypto | Tech/VC |
| `coincenter.org/feed/` | Coin Center | Policy/regulation |
| `dydx.exchange/blog/feed` | dYdX Blog | DeFi/derivatives |
| `helius.dev/blog/feed` | Helius Blog | Solana infra |
| `blog.coinmarketcap.com/feed/` | CoinMarketCap Blog | Market data |
| `blog.coingecko.com/feed/` | CoinGecko Blog | Market data |
| `cryptoslate.com/feed/` | CryptoSlate | General crypto |
| `theguardian.com/technology/rss` | The Guardian Tech | Mainstream |
| `fortune.com/section/crypto/feed/` | Fortune Crypto | Mainstream |
| `axios.com/pro/crypto-deals/feed` | Axios Crypto | Deals/VC |
| `santiment.net/blog/feed/` | Santiment Blog | On-chain |
| `fidelitydigitalassets.com/blog/rss.xml` | Fidelity Digital Assets | Institutional |

**Total: 34 RSS feeds**

---

## Gap Analysis Summary

### Market Data Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No CoinGecko `/coins/markets` integration | Missing sortable market overview | CoinGecko (free) | **High** |
| No CoinGecko `/global` data | Missing total market cap, BTC dominance | CoinGecko (free) | **High** |
| No trending coins endpoint | Missing trending/viral detection | CoinGecko `/search/trending` | **High** |
| CoinCap v2 base URL is dead | Broken data source reference | Update to v3 or remove | **High** |
| No OHLCV from CoinGecko | Missing chart data from primary source | CoinGecko `/coins/{id}/ohlc` | **High** |
| No gainers/losers tracking | Missing market movers page | CoinMarketCap (freemium) | **High** |

### On-Chain Data Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No open interest tracking | Missing derivatives positioning data | Binance Futures, Bybit, OKX | **High** |
| No long/short ratio data | Missing market sentiment signal | Binance `/globalLongShortAccountRatio` | **High** |
| No taker buy/sell volume | Missing directional flow data | Binance `/takerBuySellVol` | **High** |
| No Bitcoin mining stats | Missing hashrate, difficulty, pools | Mempool.space, Blockchain.info | **High** |
| No Bitcoin fee estimation | Missing tx cost data | Mempool.space `/fees/recommended` | **High** |
| No whale transaction monitoring | Missing large transfer alerts | Etherscan token tx, Santiment | Medium |
| Etherscan only used for gas | Multi-module potential untapped | Etherscan (many modules free) | Medium |
| No Solana on-chain data | Solscan adapter not implemented | Solscan (freemium) | Medium |

### DeFi Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No lending/borrowing rates | Missing yield comparison data | DeFiLlama `/poolsBorrow`, `/lendBorrow` | **High** |
| No LSD rates tracking | Missing liquid staking yields | DeFiLlama `/lsdRates` | **High** |
| No fundraising/VC data | Missing deal flow intelligence | DeFiLlama `/raises` | **High** |
| No DeFi hack tracker | Missing security intelligence | DeFiLlama `/hacks` | **High** |
| No token emissions data | Missing unlock/vesting schedules | DeFiLlama `/emissions` | **High** |
| No capital flow tracking | Missing chain flow analysis | DeFiLlama chain-assets/flows | **High** |
| No DexScreener integration | Free DEX data source unused | DexScreener (free) | Medium |
| No Hyperliquid implementation | Largest on-chain perps DEX | Hyperliquid API (free) | Medium |

### Trading/Derivatives Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No futures basis spread | Missing cash-carry arb signals | Binance `/basis` | **High** |
| No aggregated liquidation data | Missing liquidation cascade tracking | Coinglass (freemium) | **High** |
| No options data (IV, put/call) | Missing options market intelligence | Deribit (free), OKX Rubik | **High** |
| No Hyperliquid funding rates | Missing #1 on-chain perps data | Hyperliquid (free) | Medium |
| Binance COIN-M futures unused | Missing coin-margined derivatives | Binance dapi (free) | Low |

### Social/Sentiment Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No historical social metrics | Missing sentiment trend analysis | LunarCrush time-series, CC social/histo | **High** |
| No developer activity tracking | Missing dev ecosystem health | Santiment, Messari, CryptoCompare | Medium |
| CoinLore social stats unused | Free social data available | CoinLore `/coin/social_stats` | Low |

### NFT Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No NFT volume history | Missing NFT market trend data | Reservoir `/collections/daily-volumes` | Medium |
| SimpleHash not implemented | Multi-chain NFT data unused | SimpleHash (freemium) | Medium |
| No OpenSea collection stats | Relying only on Reservoir | OpenSea `/collections/{slug}/stats` | Medium |

### News Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| CryptoCompare news underused | Only fetched via API, not in pipeline | Already integrated | Low |
| No Blockchair news integration | Additional news source available | Blockchair `/news` | Low |

### Governance Gaps

| Gap | Impact | Source Available | Priority |
|-----|--------|-----------------|----------|
| No Snapshot queries implemented | Missing DAO governance feed | Snapshot GraphQL (free) | **High** |
| No Tally integration | Missing on-chain governance | Tally (freemium) | Medium |

---

## Top Priority Missing Endpoints

The 20 most impactful endpoints we should integrate next, ranked by value-to-effort ratio:

| # | Provider | Endpoint | What It Enables | Auth |
|---|----------|----------|-----------------|------|
| 1 | **CoinGecko** | `/coins/markets` | Sortable market overview with pagination | Free |
| 2 | **CoinGecko** | `/global` | Total market cap, BTC dominance, global stats | Free |
| 3 | **CoinGecko** | `/search/trending` | Trending coins, NFTs, categories | Free |
| 4 | **Binance Futures** | `/fapi/v1/openInterest` | Real-time open interest for all perps | Free |
| 5 | **Binance Futures** | `/fapi/v1/globalLongShortAccountRatio` | Market-wide long/short positioning | Free |
| 6 | **Binance Futures** | `/fapi/v1/takerBuySellVol` | Directional volume flow analysis | Free |
| 7 | **DeFiLlama** | `/raises` | VC fundraising rounds tracker | Free |
| 8 | **DeFiLlama** | `/hacks` | DeFi exploit/hack database | Free |
| 9 | **DeFiLlama (Yields)** | `/lendBorrow` | Lending/borrowing rate comparison | Free |
| 10 | **DeFiLlama (Yields)** | `/lsdRates` | Liquid staking derivative yields | Free |
| 11 | **Mempool.space** | `/v1/fees/recommended` | Bitcoin fee estimation | Free |
| 12 | **Mempool.space** | `/v1/mining/pools` | Bitcoin mining pool distribution | Free |
| 13 | **DeFiLlama** | `/emissions` + `/emission/{name}` | Token emission/unlock schedules | Free |
| 14 | **Binance Futures** | `/fapi/v1/basis` | Futures/spot basis spread | Free |
| 15 | **Snapshot** | `proposals` + `spaces` (GraphQL) | DAO governance proposal feed | Free |
| 16 | **DeFiLlama** | `/overview/active-users` | Protocol active user tracking | Free |
| 17 | **CoinGecko** | `/coins/{id}/market_chart` | Historical price/volume charts | Free |
| 18 | **Binance Futures** | `/fapi/v1/openInterestHist` | Historical open interest trends | Free |
| 19 | **DeFiLlama** | `/chain-assets/flows/{period}` | Cross-chain capital flows | Free |
| 20 | **Blockchair** | `/bitcoin/halving` | Bitcoin halving countdown | Free |

### Implementation Notes

- **Items 1-3** (CoinGecko) are highest ROI: completely free, no auth, and fill the biggest gaps in market data.
- **Items 4-6** (Binance Futures) provide institutional-grade derivatives analytics from endpoints we already partially use.
- **Items 7-8, 13** (DeFiLlama) leverage an API we heavily use already with zero additional auth overhead.
- **Items 9-10** (DeFiLlama Yields) extend our existing yields integration with critical DeFi metrics.
- **Items 11-12** (Mempool.space) are completely free Bitcoin network metrics with no rate limit concerns.
- **Item 15** (Snapshot) is a free GraphQL API that enables an entire governance tracking feature.
- **Item 20** (Blockchair) provides a simple, high-engagement Bitcoin halving widget.

### Critical Fix Required

- **CoinCap base URL** (`COINCAP_BASE` in `src/lib/constants.ts`) points to `https://api.coincap.io/v2` which no longer resolves. Must be updated to `https://rest.coincap.io` (v3) or removed.
