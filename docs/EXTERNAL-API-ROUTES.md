# External API Routes Inventory

> Complete catalog of every external API and data source consumed by free-crypto-news, including currently used endpoints, unused endpoints worth exploring, and RSS feed sources.

**Last updated:** 2026-03-01
**Total APIs:** 71+ services | **RSS Feeds:** 35 sources | **APIs requiring keys:** ~25

> **Individual API docs** are also available at [`docs/apis/`](apis/README.md) — one file per category for easier navigation.

---

## Table of Contents

- [1. Market Price Data](#1-market-price-data)
- [2. On-Chain / Blockchain Data](#2-on-chain--blockchain-data)
- [3. DeFi / TVL / Yields](#3-defi--tvl--yields)
- [4. DEX / Token Data](#4-dex--token-data)
- [5. Derivatives / Funding Rates / Liquidations](#5-derivatives--funding-rates--liquidations)
- [6. Sentiment / Social / Research](#6-sentiment--social--research)
- [7. Historical Price / OHLCV](#7-historical-price--ohlcv)
- [8. Gas Estimation](#8-gas-estimation)
- [9. Oracle / Real-time Prices](#9-oracle--real-time-prices)
- [10. Layer 2 / Scaling Data](#10-layer-2--scaling-data)
- [11. Solana-specific APIs](#11-solana-specific-apis)
- [12. Other L1 RPC Endpoints](#12-other-l1-rpc-endpoints)
- [13. Analytics / On-chain SQL](#13-analytics--on-chain-sql)
- [14. Intelligence / Wallet Tracking](#14-intelligence--wallet-tracking)
- [15. NFT Markets](#15-nft-markets)
- [16. Graph Protocol](#16-graph-protocol)
- [17. News Aggregation APIs](#17-news-aggregation-apis)
- [18. AI / LLM Providers](#18-ai--llm-providers)
- [19. IPFS / Decentralized Storage](#19-ipfs--decentralized-storage)
- [20. GitHub API](#20-github-api)
- [21. Newsletter / Email Services](#21-newsletter--email-services)
- [22. Caching / Infrastructure](#22-caching--infrastructure)
- [23. RSS Feed Sources](#23-rss-feed-sources)
- [Appendix A: Unused Endpoints Worth Exploring](#appendix-a-unused-endpoints-worth-exploring)
- [Appendix B: Feature Ideas by API](#appendix-b-feature-ideas-by-api)

---

## 1. Market Price Data

### CoinGecko

| | |
|---|---|
| **Base URL** | `https://api.coingecko.com/api/v3` |
| **Env Var** | `COINGECKO_API_KEY` (optional — raises rate limit) |
| **Docs** | https://docs.coingecko.com/reference/introduction |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /ping` | Health check | `src/lib/constants.ts` |
| `GET /simple/price` | Current price for coin(s) in given currencies | `src/lib/market-data.ts` |
| `GET /coins/markets` | Market data for top coins (price, volume, market cap) | `src/lib/market-data.ts` |
| `GET /coins/list` | Full list of all coins with ids, symbols, names | `src/lib/market-data.ts` |
| `GET /coins/{id}` | Full coin details (description, links, market data) | `src/lib/market-data.ts` |
| `GET /coins/{id}/market_chart` | Historical price, market cap, volume over time | `src/app/api/charts/route.ts` |
| `GET /coins/{id}/ohlc` | OHLC candlestick data | `src/app/api/charts/route.ts` |
| `GET /global` | Global crypto market stats | `src/lib/market-data.ts` |
| `GET /search/trending` | Top 7 trending coins by search volume | `src/lib/market-data.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /coins/{id}/tickers` | Exchange-level trading pairs, volume, spread — liquidity analysis |
| `GET /coins/{id}/history` | Snapshot of data at a specific date — historical article context |
| `GET /exchanges` | Exchange rankings, volume, trust score |
| `GET /exchanges/{id}/tickers` | All trading pairs on a specific exchange |
| `GET /global/decentralized_finance_defi` | DeFi-specific global stats (market cap, dominance, volume) |
| `GET /coins/categories` | Category-level aggregations (Layer 1, Layer 2, Meme, AI, etc.) |
| `GET /coins/categories/list` | List all categories |
| `GET /search` | Full-text search across coins, exchanges, categories |
| `GET /asset_platforms` | All supported chains/platforms |
| `GET /nfts/{id}` | NFT collection floor price, volume, market cap |
| `GET /nfts/list` | All NFT collections |
| `GET /derivatives` | Futures/perpetuals across exchanges |
| `GET /derivatives/exchanges` | Derivatives exchange rankings |
| `GET /exchange_rates` | BTC-denominated rates for all fiat |
| `GET /companies/public_treasury/{coin_id}` | Public companies holding BTC/ETH (MicroStrategy, Tesla…) |

---

### Binance Spot

| | |
|---|---|
| **Base URL** | `https://api.binance.com/api/v3` |
| **Key Required** | No |
| **Docs** | https://binance-docs.github.io/apidocs/spot/en/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /ping` | Health check | `src/lib/constants.ts` |
| `GET /ticker/24hr` | 24h price change stats for all symbols | `src/lib/data-pipeline.ts` |
| `GET /ticker/bookTicker` | Best bid/ask price and qty | `src/lib/data-pipeline.ts` |
| `GET /klines` | Candlestick/OHLCV data | `src/app/api/v1/ohlcv/route.ts` |
| `GET /depth` | Order book depth | `src/app/api/v1/orderbook/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /trades` | Recent trades — whale trade detection |
| `GET /aggTrades` | Compressed aggregate trades |
| `GET /avgPrice` | Current average price (lightweight) |
| `GET /ticker/price` | Latest price only (lower weight than 24hr) |
| `GET /exchangeInfo` | All trading rules, filters, symbol status |
| WebSocket Streams | Real-time streaming (`@trade`, `@kline`, `@depth`) |

---

### Binance Futures

| | |
|---|---|
| **Base URL** | `https://fapi.binance.com` |
| **Key Required** | No |
| **Docs** | https://binance-docs.github.io/apidocs/futures/en/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /fapi/v1/ping` | Health check | `src/lib/constants.ts` |
| `GET /fapi/v1/premiumIndex` | Mark price and funding rate | `src/app/api/v1/derivatives/route.ts` |
| `GET /fapi/v1/openInterest` | Open interest for a symbol | `src/app/api/v1/derivatives/route.ts` |
| `GET /fapi/v1/ticker/price` | Latest futures price | `src/lib/trading/arbitrage.ts` |
| `GET /fapi/v1/allForceOrders` | Liquidation orders | `src/app/api/liquidations/route.ts` |
| `GET /fapi/v1/fundingRate` | Funding rate history | `src/lib/trading/funding-rates.ts` |
| `GET /futures/data/openInterestHist` | Historical open interest | `src/app/api/v1/derivatives/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /fapi/v1/longShortAccountRatio` | Long/short ratio — strong sentiment signal |
| `GET /fapi/v1/topLongShortPositionRatio` | Top trader positioning |
| `GET /fapi/v1/globalLongShortAccountRatio` | Global long/short ratio |
| `GET /fapi/v1/takerlongshortRatio` | Taker buy/sell volume ratio |
| `GET /fapi/v1/indexPriceKlines` | Index price candles |
| `GET /fapi/v1/markPriceKlines` | Mark price candles |
| `GET /fapi/v1/lvtKlines` | Leveraged token candles |

---

### CoinCap

| | |
|---|---|
| **Base URL** | `https://api.coincap.io/v2` |
| **Key Required** | No |
| **Docs** | https://docs.coincap.io/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /assets` | Top assets by market cap | `src/lib/market-data.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /assets/{id}` | Single asset details |
| `GET /assets/{id}/history` | Historical price data |
| `GET /assets/{id}/markets` | Markets (exchanges) for an asset |
| `GET /rates` | Fiat & crypto exchange rates |
| `GET /exchanges` | Exchange data |
| `GET /markets` | Market data across exchanges |
| `GET /candles` | OHLCV candles |
| WebSocket | Real-time price stream |

---

### CoinPaprika

| | |
|---|---|
| **Base URL** | `https://api.coinpaprika.com/v1` |
| **Key Required** | No |
| **Docs** | https://api.coinpaprika.com/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /tickers` | Market data for all coins | `src/lib/market-data.ts` |
| `GET /coins/{id}` | Coin details | `src/lib/market-data.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /tickers/{id}/historical` | Historical tickers |
| `GET /coins/{id}/ohlcv/latest` | OHLCV data |
| `GET /coins/{id}/ohlcv/historical` | Historical OHLCV |
| `GET /coins/{id}/exchanges` | Exchanges listing the coin |
| `GET /coins/{id}/markets` | All markets for a coin |
| `GET /coins/{id}/events` | Upcoming events |
| `GET /global` | Global market stats |
| `GET /exchanges` | Exchange listings |
| `GET /tags` | Coin categories/tags |
| `GET /search` | Search coins, exchanges, people |

---

### CoinLore

| | |
|---|---|
| **Base URL** | `https://api.coinlore.net/api` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /tickers/` | Top 100 coins by market cap |

**Unused:**

| Endpoint | Potential Use |
|---|---|
| `GET /ticker/?id={id}` | Specific coin data |
| `GET /global/` | Global market stats |
| `GET /exchanges/` | Exchange data |
| `GET /coin/markets/?id={id}` | Markets for a coin |

---

### CoinMarketCap

| | |
|---|---|
| **Base URL** | `https://pro-api.coinmarketcap.com/v1` |
| **Env Vars** | `CMC_API_KEY` / `COINMARKETCAP_API_KEY` |
| **Docs** | https://coinmarketcap.com/api/documentation/v1/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /cryptocurrency/listings/latest` | Top coins with market data | `src/lib/apis/coinmarketcap.ts` |
| `GET /global-metrics/quotes/latest` | Global market metrics | `src/lib/new-integrations.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /cryptocurrency/quotes/latest` | Quotes for specific coins |
| `GET /cryptocurrency/quotes/historical` | Historical quotes |
| `GET /cryptocurrency/ohlcv/latest` | Latest OHLCV |
| `GET /cryptocurrency/ohlcv/historical` | Historical OHLCV |
| `GET /cryptocurrency/trending/latest` | Trending coins |
| `GET /cryptocurrency/trending/gainers-losers` | Biggest movers |
| `GET /cryptocurrency/trending/most-visited` | Most visited |
| `GET /cryptocurrency/categories` | Market categories |
| `GET /cryptocurrency/category` | Specific category coins |
| `GET /cryptocurrency/airdrops` | Airdrop listings |
| `GET /exchange/listings/latest` | Exchange rankings |
| `GET /content/latest` | CMC news/content |
| `GET /fear-and-greed/latest` | CMC Fear & Greed Index |

---

## 2. On-Chain / Blockchain Data

### Etherscan

| | |
|---|---|
| **Base URL** | `https://api.etherscan.io/api` |
| **Env Var** | `ETHERSCAN_API_KEY` |
| **Docs** | https://docs.etherscan.io/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `?module=gastracker&action=gasoracle` | Current gas prices | `src/app/api/gas/route.ts` |
| `?module=stats&action=ethsupply` | Total ETH supply | `src/app/api/on-chain/route.ts` |
| `?module=stats&action=ethsupply2` | ETH2 supply breakdown | `src/app/api/v1/onchain/route.ts` |
| `?module=account&action=txlist` | Transaction list for address | `src/app/api/whale-alerts/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `?module=account&action=balance` | Single address ETH balance |
| `?module=account&action=balancemulti` | Multi-address balance lookup |
| `?module=account&action=tokentx` | ERC-20 transfers — whale tracking |
| `?module=account&action=tokennfttx` | ERC-721 (NFT) transfers |
| `?module=account&action=token1155tx` | ERC-1155 transfers |
| `?module=account&action=txlistinternal` | Internal transactions |
| `?module=contract&action=getabi` | Contract ABI lookup |
| `?module=contract&action=getsourcecode` | Verified contract source |
| `?module=block&action=getblockreward` | Block reward data |
| `?module=stats&action=ethprice` | Latest ETH price |
| `?module=stats&action=nodecount` | Ethereum node count |
| `?module=stats&action=dailytxnfee` | Daily total gas fees |
| `?module=stats&action=dailyavggasprice` | Daily average gas price |
| `?module=stats&action=dailynetutilization` | Network utilization % |
| `?module=logs&action=getLogs` | Event log queries |
| `?module=token&action=tokeninfo` | Token metadata (name, supply, holders) |
| `?module=gastracker&action=gasestimate` | Gas estimate for confirmation time |

---

### Blockchain.info

| | |
|---|---|
| **Base URL** | `https://blockchain.info` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /stats` | Bitcoin network stats | `src/app/api/on-chain/route.ts` |
| `GET /q/getblockcount` | Current block height | `src/app/api/on-chain/route.ts` |
| `GET /unconfirmed-transactions?format=json` | Mempool transactions | `src/app/api/whale-alerts/route.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /rawblock/{hash}` | Full block data with all transactions |
| `GET /rawtx/{txid}` | Transaction details |
| `GET /rawaddr/{address}` | Address balance & transactions |
| `GET /multiaddr?active={addrs}` | Multi-address lookup |
| `GET /balance?active={addrs}` | Multi-address balance |
| `GET /latestblock` | Latest block hash + height + time |
| `GET /ticker` | BTC price in multiple fiat currencies |
| `GET /charts/{chart-type}` | Chart data (market-price, hash-rate, tx-rate, mempool-size) |
| `GET /q/hashrate` | Current network hashrate |
| `GET /q/24hrbtcsent` | Total BTC sent in 24h |
| `GET /q/marketcap` | BTC market cap |
| `GET /q/totalbc` | Total BTC mined |

---

### Mempool.space

| | |
|---|---|
| **Base URL** | `https://mempool.space/api` |
| **Key Required** | No |
| **Docs** | https://mempool.space/docs/api/rest |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /v1/fees/recommended` | Recommended fee rates (fast/medium/slow) | `src/app/api/on-chain/route.ts` |
| `GET /blocks/tip/height` | Latest block height | `src/app/api/on-chain/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /mempool` | Mempool stats (count, vsize, total fee) |
| `GET /mempool/txids` | All mempool transaction IDs |
| `GET /mempool/recent` | Recent mempool entries |
| `GET /v1/fees/mempool-blocks` | Projected next blocks with fee ranges |
| `GET /block/{hash}` | Full block details |
| `GET /block/{hash}/txs` | Transactions in a block |
| `GET /blocks/{startHeight}` | Block list from height |
| `GET /v1/mining/pools/{timePeriod}` | Mining pool rankings & hashrate share |
| `GET /v1/mining/pool/{slug}/hashrate` | Individual pool hashrate over time |
| `GET /v1/mining/hashrate/pools/{timePeriod}` | Hashrate distribution |
| `GET /v1/mining/difficulty-adjustments` | Difficulty adjustment history |
| `GET /tx/{txid}` | Transaction details |
| `GET /address/{address}` | Address info |
| `GET /v1/lightning/statistics` | Lightning Network stats (capacity, channels, nodes) |
| `GET /v1/lightning/nodes/rankings` | Top Lightning nodes |
| `GET /v1/lightning/nodes/{pubkey}` | Individual Lightning node |
| `GET /v1/prices` | Historical BTC price |

---

### Glassnode

| | |
|---|---|
| **Base URL** | `https://api.glassnode.com/v1` |
| **Env Var** | `GLASSNODE_API_KEY` |
| **Docs** | https://docs.glassnode.com/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /metrics/{metric}` | Various on-chain metrics | `src/lib/apis/glassnode.ts` |
| `GET /metrics/distribution/balance_1pct_holders` | Top holder concentration | `src/lib/new-integrations.ts` |

---

### CryptoQuant

| | |
|---|---|
| **Base URL** | `https://api.cryptoquant.com/v1` |
| **Env Var** | `CRYPTOQUANT_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /btc/exchange-flows/netflow` | BTC exchange net inflow/outflow | `src/lib/apis/cryptoquant.ts`, `src/app/api/flows/route.ts` |

---

### IntoTheBlock

| | |
|---|---|
| **Base URL** | `https://api.intotheblock.com/v1` |
| **Env Var** | `INTOTHEBLOCK_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /ownership/{coin}` | Ownership concentration | `src/app/api/premium/alerts/whales/route.ts` |

---

### Blockchair

| | |
|---|---|
| **Base URL** | `https://api.blockchair.com` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /{chain}/transactions` | Recent transactions for chain | `src/app/api/whale-alerts/route.ts` |
| `GET /ethereum/transactions` | Ethereum transactions | `src/app/api/v1/whale-alerts/route.ts` |
| `GET /bitcoin/transactions` | Bitcoin transactions | `src/app/api/whale-alerts/route.ts` |

---

### Whale Alert

| | |
|---|---|
| **Base URL** | `https://api.whale-alert.io/v1` |
| **Env Var** | `WHALE_ALERT_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /transactions` | Large crypto transactions | `src/app/api/premium/alerts/whales/route.ts` |

---

## 3. DeFi / TVL / Yields

### DefiLlama (Main)

| | |
|---|---|
| **Base URL** | `https://api.llama.fi` |
| **Key Required** | No |
| **Docs** | https://defillama.com/docs/api |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /protocols` | All protocols with TVL | `src/lib/apis/defillama.ts` |
| `GET /v2/chains` | Chain TVL data | `src/app/api/v1/defi/route.ts` |
| `GET /protocol/{name}` | Single protocol TVL history | `src/lib/apis/defillama.ts` |
| `GET /charts` | Historical total TVL | `src/app/api/v1/fundamentals/route.ts` |
| `GET /overview/dexs` | DEX volume overview | `src/app/api/flows/route.ts` |
| `GET /overview/fees` | Protocol fee revenue | `src/lib/apis/defillama.ts` |
| `GET /bridges` | Cross-chain bridge data | `src/app/api/flows/route.ts` |
| `GET /unlocks` | Token unlock schedules | `src/app/api/unlocks/route.ts` |
| `GET /v2/historicalChainTvl` | Historical TVL | `src/app/api/ai/oracle/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /v2/historicalChainTvl/{chain}` | Per-chain TVL history |
| `GET /overview/options` | Options DEX volume |
| `GET /overview/dexs/{chain}` | DEX volume by chain |
| `GET /overview/fees/{chain}` | Fee revenue by chain |
| `GET /bridges/{id}` | Individual bridge stats |
| `GET /bridgevolume/{chain}` | Bridge in/out flow per chain — capital flow tracking |
| `GET /raises` | **VC fundraising rounds** (deal size, investors, stage) |
| `GET /hacks` | **Exploit/hack history** (amounts, protocols affected) |
| `GET /liquidations` | Lending liquidation data |
| `GET /emissions` | Token emission schedules |
| `GET /treasuries` | Protocol treasury holdings |

---

### DefiLlama Yields

| | |
|---|---|
| **Base URL** | `https://yields.llama.fi` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /pools` | All yield pools with APY data |

**Unused:**

| Endpoint | Potential Use |
|---|---|
| `GET /chart/{pool}` | Historical yield for a specific pool |

---

### DefiLlama Stablecoins

| | |
|---|---|
| **Base URL** | `https://stablecoins.llama.fi` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /stablecoinchains` | Stablecoin distribution by chain |
| `GET /stablecoins?includePrices=true` | All stablecoins with market data |

**Unused:**

| Endpoint | Potential Use |
|---|---|
| `GET /stablecoincharts/{chain}` | Stablecoin TVL over time per chain |
| `GET /stablecoinprices` | Current stablecoin prices |

---

### DefiLlama Fees

| | |
|---|---|
| **Base URL** | `https://fees.llama.fi` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /overview/fees` | Fee revenue across protocols |

---

### DefiLlama Coins

| | |
|---|---|
| **Base URL** | `https://coins.llama.fi` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /prices/current/{coins}` | Current prices via DefiLlama |

**Unused:**

| Endpoint | Potential Use |
|---|---|
| `GET /prices/historical/{timestamp}/{coins}` | Historical prices at timestamp |
| `GET /percentage/{coins}` | Price percentage changes |
| `GET /chart/{coins}` | Price chart data |
| `GET /block/{chain}/{timestamp}` | Block at timestamp |

---

### DefiLlama Bridges

| | |
|---|---|
| **Base URL** | `https://bridges.llama.fi` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /bridges` | All bridge data |
| `GET /bridge/{id}` | Single bridge details |

---

## 4. DEX / Token Data

### GeckoTerminal

| | |
|---|---|
| **Base URL** | `https://api.geckoterminal.com/api/v2` |
| **Key Required** | No |
| **Docs** | https://www.geckoterminal.com/dex-api |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /networks` | Supported networks | `src/lib/apis/geckoterminal.ts` |
| `GET /networks/{network}/trending_pools` | Trending pools by network | `src/app/api/geckoterminal/route.ts` |
| `GET /networks/{network}/new_pools` | Newly created pools | `src/app/api/v1/dex/route.ts` |
| `GET /networks/{network}/dexes/{dex}/pools` | Pools on a specific DEX | `src/app/api/v1/dex/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /networks/{network}/tokens/{address}` | Token info by contract |
| `GET /networks/{network}/tokens/{address}/pools` | All pools for a token |
| `GET /networks/{network}/pools/{address}` | Specific pool details (price, volume, liquidity) |
| `GET /networks/{network}/pools/{address}/trades` | Recent trades — whale watching |
| `GET /networks/{network}/pools/{address}/ohlcv/{timeframe}` | Pool-level OHLCV candles |
| `GET /networks/{network}/tokens/multi/{addresses}` | Multi-token batch lookup |
| `GET /networks/{network}/pools/multi/{addresses}` | Multi-pool batch lookup |
| `GET /networks/{network}/tokens/{address}/info` | Token trust score, social links |
| `GET /search/pools` | Search pools by query |

---

### DexScreener

| | |
|---|---|
| **Base URL** | `https://api.dexscreener.com` |
| **Key Required** | No |
| **Docs** | https://docs.dexscreener.com/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /latest/dex/search` | Search DEX pairs | `src/app/api/v1/dex/route.ts` |
| `GET /latest/dex/tokens/{chain}` | Token pairs by chain | `src/app/api/portfolio/route.ts` |
| `GET /token-boosts/latest/v1` | Boosted/promoted tokens | `src/app/api/v1/dex/route.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /latest/dex/pairs/{chainId}/{pairAddress}` | Specific pair details |
| `GET /latest/dex/tokens/{tokenAddresses}` | Multi-token batch lookup |
| `GET /token-profiles/latest/v1` | Token profile metadata (description, links, icon) |
| `GET /orders/v1/{chainId}/{pairAddress}` | Active paid orders |

---

### DEX Volume (DefiLlama)

| | |
|---|---|
| **Base URL** | `https://api.llama.fi/overview/dexs` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /overview/dexs` | All DEX volume data |
| `GET /overview/dexs/{chain}` | DEX volume by chain |

---

### 1inch

| | |
|---|---|
| **Base URL** | `https://api.1inch.dev` |
| **Key Required** | No |
| **Source** | `src/lib/apis/oneinch.ts` |

---

## 5. Derivatives / Funding Rates / Liquidations

### Bybit

| | |
|---|---|
| **Base URL** | `https://api.bybit.com/v5` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /market/tickers?category=spot` | Spot tickers | `src/lib/trading/arbitrage.ts` |
| `GET /market/tickers?category=linear` | Perpetual tickers | `src/app/api/v1/derivatives/route.ts` |
| `GET /market/funding/history` | Funding rate history | `src/lib/trading/funding-rates.ts` |

---

### OKX

| | |
|---|---|
| **Base URL** | `https://www.okx.com/api/v5` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /public/time` | Server time | `src/lib/constants.ts` |
| `GET /public/funding-rate` | Current funding rates | `src/lib/trading/funding-rates.ts` |
| `GET /market/tickers?instType=SPOT` | Spot tickers | `src/lib/trading/arbitrage.ts` |

---

### dYdX

| | |
|---|---|
| **Base URL** | `https://api.dydx.exchange/v3` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| Funding rates | Historical funding rates |

---

### Hyperliquid

| | |
|---|---|
| **Base URL** | `https://api.hyperliquid.xyz` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `POST /info` (type: "meta") | Market metadata | `src/app/api/hyperliquid/route.ts` |
| `POST /info` (type: "clearinghouseState") | Account state | `src/lib/new-integrations.ts` |
| `POST /info` (type: "funding") | Funding rate data | `src/lib/trading/funding-rates.ts` |

---

### CoinGlass

| | |
|---|---|
| **Base URL** | `https://open-api-v3.coinglass.com/api` |
| **Env Var** | `COINGLASS_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /futures/openInterest/chart` | OI chart data | `src/lib/apis/coinglass.ts` |
| `GET /futures/liquidation/chart` | Liquidation chart | `src/lib/apis/coinglass.ts` |
| `GET /futures/funding/info` | Funding rate info | `src/lib/new-integrations.ts` |
| `GET /public/v2/liquidation_history` | Historical liquidations | `src/app/api/liquidations/route.ts` |

---

### Kraken

| | |
|---|---|
| **Base URL** | `https://api.kraken.com/0` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /public/Ticker` | Asset pair ticker data |
| `GET /public/Depth` | Order book depth |

---

### KuCoin

| | |
|---|---|
| **Base URL** | `https://api.kucoin.com/api/v1` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /market/allTickers` | All market tickers |
| `GET /market/orderbook/level2_100` | Order book (100 levels) |

---

## 6. Sentiment / Social / Research

### Alternative.me (Fear & Greed Index)

| | |
|---|---|
| **Base URL** | `https://api.alternative.me` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /fng/` | Current Fear & Greed Index | `src/app/api/fear-greed/route.ts` |
| `GET /fng/?limit={days}` | Historical F&G data | `src/app/api/v1/fear-greed/route.ts` |

**Unused:**

| Endpoint | Potential Use |
|---|---|
| `GET /v2/ticker/` | Full crypto ticker data |
| `GET /v1/global/` | Global market stats |

---

### LunarCrush

| | |
|---|---|
| **Base URL** | `https://lunarcrush.com/api4/public` |
| **Env Var** | `LUNARCRUSH_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /coins/list/v2?sort=galaxy_score` | Coins ranked by social sentiment |

---

### Messari

| | |
|---|---|
| **Base URL** | `https://data.messari.io/api/v1` (also `/api/v2`) |
| **Env Var** | `MESSARI_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /assets/{slug}/profile` | Asset fundamental profile |
| `GET /assets?limit={n}` | Asset listings |

---

### Santiment

| | |
|---|---|
| **Base URL** | `https://api.santiment.net` |
| **Env Var** | `SANTIMENT_API_KEY` |

**Used:** GraphQL queries for on-chain/social analytics

---

## 7. Historical Price / OHLCV

### CryptoCompare

| | |
|---|---|
| **Base URL** | `https://min-api.cryptocompare.com/data` |
| **Env Var** | `CRYPTOCOMPARE_API_KEY` (optional) |
| **Docs** | https://min-api.cryptocompare.com/documentation |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /price` | Simple price lookup | `src/lib/apis/cryptocompare.ts` |
| `GET /v2/histominute` | Minute-level OHLCV | `src/app/api/v1/ohlcv/route.ts` |
| `GET /v2/histohour` | Hourly OHLCV | `src/app/api/v1/ohlcv/route.ts` |
| `GET /v2/histoday` | Daily OHLCV | `src/app/api/v1/ohlcv/route.ts` |
| `GET /news/latest` | Latest crypto news | `src/lib/apis/cryptocompare.ts` |
| `GET /news/feeds` | News feed sources | `src/lib/apis/cryptocompare.ts` |
| `GET /news/categories` | News categories | `src/lib/apis/cryptocompare.ts` |
| `GET /top/totalvolfull` | Top coins by volume | `src/lib/apis/cryptocompare.ts` |
| `GET /top/mktcapfull` | Top coins by market cap | `src/lib/apis/cryptocompare.ts` |
| `GET /social/coin/latest` | Social stats for a coin | `src/lib/apis/cryptocompare.ts` |
| `GET /trading/signals/intotheblock` | On-chain signals | `src/lib/apis/cryptocompare.ts` |
| `GET /pricemultifull` | Multi-pair full price data | `src/lib/apis/cryptocompare.ts` |
| `GET /exchange/top/volume` | Top exchanges by volume | `src/lib/apis/cryptocompare.ts` |
| `GET /v2/pair/mapping/exchange` | Trading pair mappings | `src/lib/apis/cryptocompare.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /blockchain/histo/day` | On-chain metrics over time (active addresses, tx count, hashrate) |
| `GET /blockchain/latest` | Latest on-chain snapshot |
| `GET /blockchain/mining/calculator` | Mining profitability |
| `GET /top/exchanges/full` | Top exchanges with full data |
| `GET /exchange/histoday` | Historical exchange volume |
| `GET /ob/l2/snapshot` | Level 2 order book snapshots |

---

## 8. Gas Estimation

### Blocknative

| | |
|---|---|
| **Base URL** | `https://api.blocknative.com` |
| **Env Var** | `NEXT_PUBLIC_BLOCKNATIVE_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /gasprices/blockprices` | Gas price predictions |

---

### Polygon Gas Station

| | |
|---|---|
| **Base URL** | `https://gasstation.polygon.technology/v2` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /v2` | Polygon gas estimates |

---

## 9. Oracle / Real-time Prices

### Pyth Network

| | |
|---|---|
| **Base URL** | `https://hermes.pyth.network` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /v2/updates/price/latest` | Latest oracle prices |

---

## 10. Layer 2 / Scaling Data

### L2BEAT

| | |
|---|---|
| **Base URL** | `https://l2beat.com/api` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /scaling/tvl` | L2 TVL data |
| `GET /scaling/activity` | L2 activity metrics |
| `GET /activity` | Transaction activity |

---

## 11. Solana-specific APIs

### Birdeye

| | |
|---|---|
| **Base URL** | `https://public-api.birdeye.so` |
| **Env Var** | `BIRDEYE_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /defi/token_trending` | Trending Solana tokens |

---

### Helius

| | |
|---|---|
| **Base URL** | `https://api.helius.xyz/v0` + `https://mainnet.helius-rpc.com` |
| **Env Var** | `HELIUS_API_KEY` |

**Used:** Solana RPC + enriched transaction data

---

### Shyft

| | |
|---|---|
| **Base URL** | `https://api.shyft.to/sol/v1` |
| **Env Var** | `SHYFT_API_KEY` |

**Used:** Solana token/NFT data

---

## 12. Other L1 RPC Endpoints

### Sui RPC

| | |
|---|---|
| **Base URL** | `https://fullnode.mainnet.sui.io:443` |
| **Key Required** | No |

**Used:** JSON-RPC calls for Sui blockchain

---

### Aptos RPC

| | |
|---|---|
| **Base URL** | `https://fullnode.mainnet.aptoslabs.com/v1` |
| **Key Required** | No |

**Used:** REST endpoints, `/view` function calls

---

### Cloudflare Ethereum

| | |
|---|---|
| **Base URL** | `https://cloudflare-eth.com` |
| **Key Required** | No |

**Used:** Ethereum JSON-RPC (ENS resolution, IPFS)

---

## 13. Analytics / On-chain SQL

### Dune Analytics

| | |
|---|---|
| **Base URL** | `https://api.dune.com/api/v1` |
| **Env Var** | `DUNE_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /query/{queryId}/results` | Fetch query results |
| `POST /query/{queryId}/execute` | Execute a query |

---

### Token Terminal

| | |
|---|---|
| **Base URL** | `https://api.tokenterminal.com/v2` |
| **Env Var** | `TOKENTERMINAL_API_KEY` |

**Used:** Protocol revenue, earnings, P/E data

---

### Token Unlocks

| | |
|---|---|
| **Base URL** | `https://token.unlocks.app/api` |
| **Key Required** | No |

**Used:** Token vesting schedule data

---

## 14. Intelligence / Wallet Tracking

### Arkham Intelligence

| | |
|---|---|
| **Base URL** | `https://api.arkhamintel.com` |
| **Env Var** | `ARKHAM_API_KEY` |

**Used:** Wallet labels, entity tracking

---

### Nansen

| | |
|---|---|
| **Base URL** | `https://api.nansen.ai` |
| **Env Var** | `NANSEN_API_KEY` |

**Used:** On-chain wallet analytics

---

### Rated Network

| | |
|---|---|
| **Base URL** | `https://api.rated.network/v0` |
| **Key Required** | No |

**Used:** Validator/staking analytics

---

## 15. NFT Markets

### OpenSea

| | |
|---|---|
| **Base URL** | `https://api.opensea.io/api/v2` |
| **Env Var** | `OPENSEA_API_KEY` |

**Used:** NFT collection/floor price data

---

### Reservoir

| | |
|---|---|
| **Base URL** | `https://api.reservoir.tools` |
| **Env Var** | `RESERVOIR_API_KEY` |

**Used:** NFT aggregator data

---

## 16. Graph Protocol

### The Graph

| | |
|---|---|
| **Base URL** | `https://gateway.thegraph.com/api` + `https://api.thegraph.com/subgraphs/id/{id}` |
| **Env Var** | `THEGRAPH_API_KEY` |

**Used:** GraphQL subgraph queries (Uniswap, Aave, Compound, etc.)

---

## 17. News Aggregation APIs

### CryptoPanic

| | |
|---|---|
| **Base URL** | `https://cryptopanic.com/api/v1` |
| **Env Var** | `CRYPTOPANIC_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /posts/` | Aggregated crypto news with sentiment |

---

### NewsAPI.org

| | |
|---|---|
| **Base URL** | `https://newsapi.org/v2` |
| **Env Var** | `NEWSAPI_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /everything` | Search all articles |
| `GET /top-headlines` | Top headlines by category |

---

### CryptoCompare News

See [CryptoCompare](#cryptocompare) above — news endpoints `/news/latest`, `/news/feeds`, `/news/categories`.

---

## 18. AI / LLM Providers

| # | Service | Base URL | Endpoint | Env Var |
|---|---------|----------|----------|---------|
| 1 | **Groq** | `https://api.groq.com/openai/v1` | `POST /chat/completions` | `GROQ_API_KEY` |
| 2 | **OpenAI** | `https://api.openai.com/v1` | `POST /chat/completions` | `OPENAI_API_KEY` |
| 3 | **OpenRouter** | `https://openrouter.ai/api/v1` | `POST /chat/completions` | `OPENROUTER_API_KEY` |
| 4 | **Anthropic** | `https://api.anthropic.com/v1` | `POST /messages` | `ANTHROPIC_API_KEY` |
| 5 | **HuggingFace** | `https://api-inference.huggingface.co` | Inference API | `HUGGINGFACE_API_KEY` |
| 6 | **Google AI** | Google API | Gemini models | `GOOGLE_GENERATIVE_AI_API_KEY` |

---

## 19. IPFS / Decentralized Storage

### NFT.Storage

| | |
|---|---|
| **Base URL** | `https://api.nft.storage` |
| **Env Var** | `NFT_STORAGE_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `POST /upload` | Upload content to IPFS |

---

### Pinata

| | |
|---|---|
| **Base URL** | `https://api.pinata.cloud` |
| **Env Var** | `PINATA_JWT` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `POST /pinning/pinFileToIPFS` | Pin file to IPFS |
| `POST /pinning/pinByHash` | Pin by content hash |

---

## 20. GitHub API

| | |
|---|---|
| **Base URL** | `https://api.github.com` |
| **Env Var** | `GITHUB_TOKEN` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /repos/{owner}/{repo}/contents/{path}` | Read file from repo | `src/app/api/archive/webhook/route.ts` |
| `PUT /repos/{owner}/{repo}/contents/{path}` | Create/update file in repo | `src/app/api/ai/blog-generator/route.ts` |

---

## 21. Newsletter / Email Services

### Buttondown

| | |
|---|---|
| **Base URL** | `https://api.buttondown.email/v1` |
| **Env Var** | `BUTTONDOWN_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `POST /subscribers` | Subscribe email |

---

### ConvertKit

| | |
|---|---|
| **Base URL** | `https://api.convertkit.com/v3` |
| **Env Var** | `CONVERTKIT_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `POST /forms/{formId}/subscribe` | Subscribe to form |

---

## 22. Caching / Infrastructure

### Upstash Redis

| | |
|---|---|
| **Env Vars** | `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

**Used for:** Rate limiting, response caching, session storage

---

## 23. RSS Feed Sources

All consumed in `src/lib/data-pipeline.ts`:

| # | Source | RSS URL |
|---|--------|---------|
| 1 | CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss/` |
| 2 | The Block | `https://www.theblock.co/rss.xml` |
| 3 | CoinTelegraph | `https://cointelegraph.com/rss` |
| 4 | Bitcoin Magazine | `https://bitcoinmagazine.com/.rss/full/` |
| 5 | Decrypt | `https://decrypt.co/feed` |
| 6 | DL News | `https://www.dlnews.com/arc/outboundfeeds/rss/` |
| 7 | Blockworks | `https://blockworks.co/feed` |
| 8 | The Defiant | `https://thedefiant.io/feed` |
| 9 | Rekt News | `https://rekt.news/rss.xml` |
| 10 | Messari Blog | `https://messari.io/rss` |
| 11 | U.Today | `https://u.today/rss` |
| 12 | Coinbase Blog | `https://www.coinbase.com/blog/rss.xml` |
| 13 | Solana News | `https://solana.com/news/rss.xml` |
| 14 | Glassnode Insights | `https://insights.glassnode.com/rss/` |
| 15 | Alchemy Blog | `https://www.alchemy.com/blog/rss` |
| 16 | Stacker News | `https://stacker.news/rss` |
| 17 | Reuters Crypto | `https://www.reuters.com/technology/cryptocurrency/rss` |
| 18 | CNBC Crypto | `https://www.cnbc.com/id/100727362/device/rss/rss.html` |
| 19 | Yahoo Finance Crypto | `https://finance.yahoo.com/rss/cryptocurrency` |
| 20 | L2BEAT Blog | `https://l2beat.com/blog/rss.xml` |
| 21 | Watcher Guru | `https://watcher.guru/news/feed` |
| 22 | Cryptopolitan | `https://www.cryptopolitan.com/feed/` |
| 23 | TechCrunch Crypto | `https://techcrunch.com/category/cryptocurrency/feed/` |
| 24 | Coin Center | `https://www.coincenter.org/feed/` |
| 25 | dYdX Blog | `https://dydx.exchange/blog/feed` |
| 26 | Helius Blog | `https://www.helius.dev/blog/feed` |
| 27 | CoinMarketCap Blog | `https://blog.coinmarketcap.com/feed/` |
| 28 | CoinGecko Blog | `https://blog.coingecko.com/feed/` |
| 29 | CryptoSlate | `https://cryptoslate.com/feed/` |
| 30 | The Guardian Tech | `https://www.theguardian.com/technology/rss` |
| 31 | Fortune Crypto | `https://fortune.com/section/crypto/feed/` |
| 32 | Axios Crypto | `https://www.axios.com/pro/crypto-deals/feed` |
| 33 | Santiment Blog | `https://santiment.net/blog/feed/` |
| 34 | Fidelity Digital Assets | `https://www.fidelitydigitalassets.com/blog/rss.xml` |

---

## Appendix A: Unused Endpoints Worth Exploring

### Tier 1 — High Impact, Low Effort

These are free, keyless endpoints from APIs we already use:

| API | Endpoint | Feature Idea |
|-----|----------|-------------|
| **DefiLlama** | `GET /raises` | VC fundraising tracker — deal feed with investors, amounts, stages |
| **DefiLlama** | `GET /hacks` | Security incident tracker — exploit history with amounts |
| **DefiLlama** | `GET /treasuries` | Protocol treasury dashboard |
| **DefiLlama** | `GET /bridgevolume/{chain}` | Capital flow analysis per chain |
| **DefiLlama** | `GET /emissions` | Token emission/unlock calendar |
| **Binance Futures** | `GET /fapi/v1/longShortAccountRatio` | Long/short ratio heatmap — powerful sentiment signal |
| **Binance Futures** | `GET /fapi/v1/topLongShortPositionRatio` | Top trader positioning |
| **Binance Futures** | `GET /fapi/v1/takerlongshortRatio` | Taker buy/sell volume ratio |
| **Mempool.space** | `GET /v1/mining/pools/{period}` | Mining pool rankings & hashrate distribution |
| **Mempool.space** | `GET /v1/lightning/statistics` | Lightning Network stats dashboard |
| **Mempool.space** | `GET /v1/mining/difficulty-adjustments` | Difficulty adjustment tracker |
| **CoinGecko** | `GET /coins/categories` | Market categories view (Layer 1, Meme, AI, etc.) |
| **CoinGecko** | `GET /companies/public_treasury/{coin_id}` | Public companies BTC/ETH holdings tracker |
| **CoinGecko** | `GET /global/decentralized_finance_defi` | DeFi-specific global stats |
| **GeckoTerminal** | `GET /networks/{id}/pools/{addr}/trades` | Pool-level whale watching |
| **Blockchain.info** | `GET /charts/{chart-type}` | Hashrate, tx-rate, mempool-size charts |

### Tier 2 — High Impact, Requires API Key

| API | Endpoint | Feature Idea |
|-----|----------|-------------|
| **Etherscan** | `?module=account&action=tokentx` | ERC-20 whale transfer tracking |
| **Etherscan** | `?module=stats&action=nodecount` | Ethereum decentralization dashboard |
| **Etherscan** | `?module=token&action=tokeninfo` | Token metadata lookup |
| **CoinMarketCap** | `GET /cryptocurrency/trending/gainers-losers` | Biggest movers dashboard |
| **CoinMarketCap** | `GET /cryptocurrency/categories` | Category analytics |
| **CoinMarketCap** | `GET /content/latest` | CMC news content feed |

### Tier 3 — New Data Dimensions

| API | Endpoint | Feature Idea |
|-----|----------|-------------|
| **CryptoCompare** | `GET /blockchain/histo/day` | On-chain trend charts (active addresses, hashrate over time) |
| **DefiLlama Yields** | `GET /chart/{pool}` | Historical yield tracker per pool |
| **DefiLlama Coins** | `GET /prices/historical/{ts}/{coins}` | Point-in-time historical price |
| **Mempool.space** | `GET /v1/fees/mempool-blocks` | Next-block fee projections |
| **GeckoTerminal** | `GET /networks/{id}/pools/{addr}/ohlcv/{tf}` | DEX pool-level candle charts |

---

## Appendix B: Feature Ideas by API

Based on unused endpoints, here are concrete feature ideas grouped by theme:

### 📊 Market Intelligence
1. **Category Heatmap** — CoinGecko `/coins/categories` → visual heatmap of sector performance
2. **Biggest Movers** — CMC trending/gainers-losers → daily top movers widget
3. **Exchange Rankings** — CoinGecko `/exchanges` → trust-scored exchange comparison
4. **Corporate Holdings Tracker** — CoinGecko `/companies/public_treasury` → track MicroStrategy, Tesla, etc.

### 📈 Derivatives & Sentiment
5. **Long/Short Dashboard** — Binance `/longShortAccountRatio` + `/topLongShortPositionRatio` → sentiment gauge
6. **Taker Flow** — Binance `/takerlongshortRatio` → aggressive buyer vs seller flow
7. **Options Market Overview** — DefiLlama `/overview/options` → options DEX volume

### ⛏️ Mining & Network
8. **Mining Pool Rankings** — Mempool.space `/mining/pools` → hashrate distribution charts
9. **Difficulty Adjustment Countdown** — Mempool.space `/mining/difficulty-adjustments`
10. **Lightning Network Dashboard** — Mempool.space `/lightning/statistics` + `/nodes/rankings`
11. **Network Health** — Etherscan nodecount + daily utilization + CryptoCompare blockchain metrics

### 🏦 DeFi Analytics
12. **VC Deal Feed** — DefiLlama `/raises` → fundraising round tracker with investors
13. **Hack/Exploit Feed** — DefiLlama `/hacks` → security incident timeline
14. **Treasury Dashboard** — DefiLlama `/treasuries` → protocol treasury comparison
15. **Capital Flow Map** — DefiLlama `/bridgevolume/{chain}` → inter-chain capital movement
16. **Token Emission Calendar** — DefiLlama `/emissions` → upcoming unlock/emission events
17. **Yield History** — DefiLlama Yields `/chart/{pool}` → historical APY trends

### 🐋 Whale & On-Chain
18. **ERC-20 Whale Tracker** — Etherscan `tokentx` → large ERC-20 transfers
19. **DEX Pool Whale Watcher** — GeckoTerminal pool trades → large swap detection
20. **On-Chain Trend Charts** — CryptoCompare blockchain data → active addresses, hashrate over time

### 🔍 Discovery
21. **Token Search** — CoinGecko `/search` + DexScreener profiles → unified token discovery
22. **Pool Search** — GeckoTerminal `/search/pools` → find DEX pools by query
23. **DeFi Global Stats** — CoinGecko `/global/decentralized_finance_defi` → DeFi dominance widget

---

## Environment Variables Summary

All API keys used across the project:

| Env Var | Service | Required |
|---------|---------|----------|
| `COINGECKO_API_KEY` | CoinGecko | Optional |
| `CMC_API_KEY` / `COINMARKETCAP_API_KEY` | CoinMarketCap | Yes |
| `ETHERSCAN_API_KEY` | Etherscan | Yes |
| `GLASSNODE_API_KEY` | Glassnode | Yes |
| `CRYPTOQUANT_API_KEY` | CryptoQuant | Yes |
| `INTOTHEBLOCK_API_KEY` | IntoTheBlock | Yes |
| `WHALE_ALERT_API_KEY` | Whale Alert | Yes |
| `COINGLASS_API_KEY` | CoinGlass | Yes |
| `LUNARCRUSH_API_KEY` | LunarCrush | Yes |
| `MESSARI_API_KEY` | Messari | Yes |
| `SANTIMENT_API_KEY` | Santiment | Yes |
| `CRYPTOCOMPARE_API_KEY` | CryptoCompare | Optional |
| `NEXT_PUBLIC_BLOCKNATIVE_API_KEY` | Blocknative | Yes |
| `BIRDEYE_API_KEY` | Birdeye | Yes |
| `HELIUS_API_KEY` | Helius | Yes |
| `SHYFT_API_KEY` | Shyft | Yes |
| `DUNE_API_KEY` | Dune Analytics | Yes |
| `TOKENTERMINAL_API_KEY` | Token Terminal | Yes |
| `ARKHAM_API_KEY` | Arkham Intelligence | Yes |
| `NANSEN_API_KEY` | Nansen | Yes |
| `OPENSEA_API_KEY` | OpenSea | Yes |
| `RESERVOIR_API_KEY` | Reservoir | Yes |
| `THEGRAPH_API_KEY` | The Graph | Yes |
| `CRYPTOPANIC_API_KEY` | CryptoPanic | Yes |
| `NEWSAPI_API_KEY` | NewsAPI.org | Yes |
| `GROQ_API_KEY` | Groq | Yes |
| `OPENAI_API_KEY` | OpenAI | Yes |
| `OPENROUTER_API_KEY` | OpenRouter | Yes |
| `ANTHROPIC_API_KEY` | Anthropic | Yes |
| `HUGGINGFACE_API_KEY` | HuggingFace | Yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI | Yes |
| `NFT_STORAGE_API_KEY` | NFT.Storage | Yes |
| `PINATA_JWT` | Pinata | Yes |
| `GITHUB_TOKEN` | GitHub API | Yes |
| `BUTTONDOWN_API_KEY` | Buttondown | Yes |
| `CONVERTKIT_API_KEY` | ConvertKit | Yes |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis | Yes |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | Yes |
