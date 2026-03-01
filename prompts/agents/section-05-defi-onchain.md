# Section 5: DeFi & On-Chain APIs (Agents 21–25)

> These agents build DeFi protocol data, on-chain analytics, derivatives, NFT, and blockchain-specific API endpoints.

---

## Agent 21 — DeFi Protocol & TVL API

**Goal:** Build comprehensive DeFi data endpoints covering TVL, yields, DEX volumes, and protocol metrics — competing with DeFiLlama.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/defi/
  protocols/route.ts                    (GET /defi/protocols — all DeFi protocols)
  protocols/[protocolId]/route.ts       (GET /defi/protocols/:id — protocol detail)
  tvl/route.ts                          (GET /defi/tvl — total DeFi TVL)
  tvl/chains/route.ts                   (GET /defi/tvl/chains — TVL by chain)
  tvl/history/route.ts                  (GET /defi/tvl/history — historical TVL)
  yields/route.ts                       (GET /defi/yields — yield farming pools)
  yields/[poolId]/route.ts              (GET /defi/yields/:poolId — pool detail)
  dex/
    volumes/route.ts                    (GET /defi/dex/volumes — DEX volumes)
    pairs/route.ts                      (GET /defi/dex/pairs — DEX trading pairs)
  lending/
    rates/route.ts                      (GET /defi/lending/rates — lending/borrow rates)
    protocols/route.ts                  (GET /defi/lending/protocols)
  bridges/
    route.ts                            (GET /defi/bridges — cross-chain bridges)
    [bridgeId]/route.ts                 (GET /defi/bridges/:id)
    volumes/route.ts                    (GET /defi/bridges/volumes)
src/lib/services/
  defi.ts
```

**API Specifications:**

1. **GET /api/v1/defi/protocols**
```
Query: chain, category (dex/lending/bridge/yield/derivatives/insurance/staking),
  order (tvl_desc/fees_desc/volume_desc), per_page, page, min_tvl
Response: [{ id, name, slug, logo, url, description, category, chains[],
  tvl, tvl_change_1d, tvl_change_7d, tvl_change_30d,
  fees_24h, fees_7d, fees_30d, revenue_24h, revenue_7d,
  mcap, mcap_tvl_ratio, governance_token, 
  audits: [{ auditor, date, url }], created_at }]
Cache: 5 minutes
```

2. **GET /api/v1/defi/protocols/:protocolId**
```
Response: { ...above, chain_tvls: { ethereum: 5e9, arbitrum: 2e9, ... },
  tvl_history: [{ date, tvl }], // last 30 days
  token_info: { symbol, price, market_cap, fdv },
  governance: { proposals_count, voters_count, treasury_value },
  similar_protocols: [top 5 by category],
  risk_score: { overall: 7.5, audit: 9, age: 8, tvl_stability: 6 } }
```

3. **GET /api/v1/defi/tvl**
```
Response: { total_tvl: 180000000000, chains: [{ name, tvl, dominance_pct, change_24h }],
  categories: [{ name, tvl, protocol_count }], updated_at }
```

4. **GET /api/v1/defi/yields**
```
Query: chain, protocol, stablecoin_only (bool), min_tvl, min_apy, max_apy,
  order (apy_desc/tvl_desc), per_page, page, audited_only (bool)
Response: [{ pool_id, chain, protocol, symbol, tvl, apy, apy_base, apy_reward,
  il_risk (none/low/medium/high), stablecoin (bool), reward_tokens[],
  audited (bool), pool_meta: { url, description }, 
  apy_history_7d: [{ date, apy }] }]
```

5. **GET /api/v1/defi/dex/volumes**
```
Query: chain, protocol, days (1/7/30)
Response: { total_volume_24h, chains: [{ chain, volume_24h, change_pct }],
  protocols: [{ name, volume_24h, trades_24h, unique_users_24h, change_pct }] }
```

6. **GET /api/v1/defi/lending/rates**
```
Query: chain, protocol, asset
Response: [{ protocol, chain, asset, supply_apy, borrow_apy, 
  utilization_rate, total_supplied, total_borrowed, 
  collateral_factor, liquidation_threshold }]
```

7. **GET /api/v1/defi/bridges**
```
Response: [{ id, name, chains[], volume_24h, volume_7d, 
  tvl, unique_users_24h, fees_24h, avg_transfer_time_seconds }]
```

**Data Sources:**
- DeFiLlama API for TVL, yields, volumes, fees (primary — open source data)
- Direct protocol subgraph queries for DEX data (Uniswap, SushiSwap, etc.)
- On-chain contract reads for lending rates (Aave, Compound)
- Bridge APIs for cross-chain data

**Instructions:**
- DeFiLlama-compatible response format where possible
- Add risk scoring based on: audit status, protocol age, TVL stability, team doxxed
- Support filtering by multiple chains simultaneously
- Include impermanent loss estimates for yield farming pools
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add DeFi protocol, TVL, yields, and DEX volume endpoints`

---

## Agent 22 — On-Chain Analytics API

**Goal:** Build on-chain analytics endpoints for whale tracking, address labeling, and blockchain metrics.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/onchain/
  whale-alerts/route.ts                 (GET /onchain/whale-alerts — large transactions)
  address/
    [address]/route.ts                  (GET /onchain/address/:address — address info)
    [address]/txns/route.ts             (GET /onchain/address/:address/txns)
    [address]/tokens/route.ts           (GET /onchain/address/:address/tokens)
  chain-metrics/
    route.ts                            (GET /onchain/chain-metrics — all chains)
    [chain]/route.ts                    (GET /onchain/chain-metrics/:chain)
  gas/
    route.ts                            (GET /onchain/gas — current gas prices)
    history/route.ts                    (GET /onchain/gas/history)
  holders/
    [coinId]/route.ts                   (GET /onchain/holders/:coinId)
  rich-list/
    [coinId]/route.ts                   (GET /onchain/rich-list/:coinId)
  token-flows/
    route.ts                            (GET /onchain/token-flows — exchange flows)
src/lib/services/
  onchain.ts
```

**API Specifications:**

1. **GET /api/v1/onchain/whale-alerts**
```
Query: min_value (default 1000000), chain, type (transfer/exchange_deposit/exchange_withdrawal/
  unknown), from (timestamp), to, per_page, page
Response: [{ id, chain, tx_hash, block_number, timestamp, 
  from: { address, label, category }, to: { address, label, category },
  token: { symbol, name, contract_address },
  amount, usd_value, tx_type, tx_fee_usd }]
Cache: 30 seconds
```

2. **GET /api/v1/onchain/address/:address**
```
Query: chain (default: auto-detect)
Response: { address, chain, label, category, entity_name,
  balance: { native: { amount, usd_value }, tokens: [...] },
  first_seen, last_active, tx_count, is_contract (bool),
  tags: ["whale", "exchange", "defi-user", ...] }
```

3. **GET /api/v1/onchain/chain-metrics/:chain**
```
Query: days (1/7/30/90)
Response: { chain, current: { active_addresses, daily_transactions, avg_fee_usd,
  total_fees_usd, tps, block_time_seconds, unique_senders, unique_receivers,
  new_addresses, contract_deployments },
  history: [{ date, active_addresses, transactions, fees, tps }] }
Chains: ethereum, bitcoin, solana, polygon, arbitrum, optimism, avalanche, bsc, base, sui, aptos
```

4. **GET /api/v1/onchain/gas**
```
Response: { ethereum: { fast: 25, standard: 18, slow: 12, base_fee: 15, 
  suggested_priority: { fast: 3, standard: 1.5, slow: 0.5 },
  estimated_cost: { transfer: "0.45", token_transfer: "1.20", swap: "3.50" } },
  polygon: { ... }, arbitrum: { ... }, base: { ... } }
Cache: 15 seconds
```

5. **GET /api/v1/onchain/holders/:coinId**
```
Response: { coin_id, holder_count, top_holders: [{ address, label, balance, 
  percentage, change_24h }], concentration: { top_10_pct, top_50_pct, 
  top_100_pct, gini_coefficient }, history: [{ date, holder_count }] }
```

6. **GET /api/v1/onchain/token-flows**
```
Query: coin_id, exchange_id, days (1/7/30)
Response: { coin_id, flows: [{ exchange, inflow_24h, outflow_24h, net_flow_24h,
  inflow_7d, outflow_7d, net_flow_7d }],
  aggregate: { total_inflow_24h, total_outflow_24h, net_flow_24h,
  interpretation: "Strong net outflow suggests accumulation" } }
```

**Data Sources:**
- Etherscan/Polygonscan/etc APIs for chain-specific data
- whale-alert.io for large transaction monitoring
- Direct RPC calls for gas prices
- Blockchain explorers for address information

**Instructions:**
- Support ENS resolution for Ethereum addresses (`.eth` names)
- Auto-detect chain from address format (0x = EVM, bc1 = Bitcoin, etc.)
- Address labels should be sourced from known entity databases
- Free tier: whale alerts + gas. Pro: all on-chain features.
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add on-chain analytics, whale alerts, and gas endpoints`

---

## Agent 23 — Derivatives & Futures API

**Goal:** Build derivatives market data endpoints for futures, options, funding rates, liquidations, and open interest.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/derivatives/
  route.ts                              (GET /derivatives — overview)
  exchanges/route.ts                    (GET /derivatives/exchanges)
  exchanges/[exchangeId]/route.ts       (GET /derivatives/exchanges/:id)
  futures/
    route.ts                            (GET /derivatives/futures — all futures)
    [symbol]/route.ts                   (GET /derivatives/futures/:symbol)
  funding-rates/
    route.ts                            (GET /derivatives/funding-rates)
    history/route.ts                    (GET /derivatives/funding-rates/history)
  liquidations/
    route.ts                            (GET /derivatives/liquidations — live)
    history/route.ts                    (GET /derivatives/liquidations/history)
  open-interest/
    route.ts                            (GET /derivatives/open-interest)
    history/route.ts                    (GET /derivatives/open-interest/history)
  long-short-ratio/route.ts            (GET /derivatives/long-short-ratio)
  options/
    route.ts                            (GET /derivatives/options)
src/lib/services/
  derivatives.ts
```

**API Specifications:**

1. **GET /api/v1/derivatives**
```
Response: { total_open_interest: 85000000000, total_volume_24h: 120000000000,
  btc_dominance_oi: 42.5, eth_dominance_oi: 22.3,
  long_short_ratio: 1.15, total_liquidations_24h: 350000000,
  funding_rate_avg: 0.01, market_sentiment: "bullish", updated_at }
Cache: 60 seconds
```

2. **GET /api/v1/derivatives/funding-rates**
```
Query: symbols (comma-sep), exchange
Response: [{ symbol: "BTCUSDT", exchange: "binance", 
  current_rate: 0.01, predicted_rate: 0.008,
  next_funding_time, interval_hours: 8,
  annualized_rate: 10.95, open_interest,
  mark_price, index_price }]
Cache: 60 seconds
```

3. **GET /api/v1/derivatives/liquidations**
```
Query: symbol, exchange, side (long/short), min_value, from, to, per_page
Response: [{ exchange, symbol, side, quantity, price, usd_value,
  timestamp, order_type }]
Cache: 10 seconds (near real-time)
```

4. **GET /api/v1/derivatives/open-interest**
```
Query: symbol, exchange, interval (5m/1h/4h/1d)
Response: [{ symbol, exchange, open_interest, open_interest_usd,
  change_1h, change_24h, volume_24h }]
```

5. **GET /api/v1/derivatives/long-short-ratio**
```
Query: symbol, exchange, period (5m/15m/30m/1h/4h/1d)
Response: [{ symbol, exchange, timestamp, long_ratio, short_ratio,
  long_short_ratio, long_account, short_account }]
```

6. **GET /api/v1/derivatives/options**
```
Query: symbol, exchange
Response: [{ symbol, exchange, type (call/put), strike_price, expiry,
  mark_price, implied_volatility, open_interest, volume_24h,
  delta, gamma, theta, vega }]
```

**Data Sources:**
- Binance Futures API (funding, OI, liquidations, long/short ratio)
- Bybit derivatives API
- OKX derivatives API
- Deribit for options data
- Hyperliquid for DeFi perps

**Instructions:**
- Liquidation data should also push to WebSocket channel `derivatives:liquidations`
- Calculate aggregate metrics across all exchanges
- Include predicted funding rate
- Historical data: funding rates back 1 year, liquidations back 90 days
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add derivatives, futures, funding rates, and liquidations endpoints`

---

## Agent 24 — NFT & Gaming API

**Goal:** Build NFT collection data, floor prices, sales, and GameFi token endpoints.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/nft/
  collections/route.ts                  (GET /nft/collections — top collections)
  collections/[collectionId]/route.ts   (GET /nft/collections/:id)
  collections/[collectionId]/
    floor-price/route.ts                (GET — floor price history)
    sales/route.ts                      (GET — recent sales)
    holders/route.ts                    (GET — holder distribution)
  trending/route.ts                     (GET /nft/trending)
  market-overview/route.ts              (GET /nft/market-overview)
  chains/[chain]/route.ts               (GET /nft/chains/:chain)
src/app/api/v1/gaming/
  tokens/route.ts                       (GET /gaming/tokens)
  protocols/route.ts                    (GET /gaming/protocols)
  protocols/[protocolId]/route.ts       (GET /gaming/protocols/:id)
src/lib/services/
  nft.ts
  gaming.ts
```

**API Specifications:**

1. **GET /api/v1/nft/collections**
```
Query: chain, order (volume_desc/floor_desc/market_cap_desc), 
  time_range (24h/7d/30d), per_page, page
Response: [{ id, name, slug, image, chain, contract_address,
  floor_price, floor_price_usd, market_cap, volume_24h,
  volume_change_24h, sales_24h, owners, supply, 
  listed_count, listed_ratio, avg_price_24h }]
```

2. **GET /api/v1/nft/collections/:collectionId**
```
Response: { ...above, description, website, twitter, discord,
  floor_price_history: [{ timestamp, price }], // 30 days
  volume_history: [{ timestamp, volume }],
  rarity_distribution: { count, percentiles },
  top_sales: [{ token_id, price, from, to, timestamp }] }
```

3. **GET /api/v1/nft/market-overview**
```
Response: { total_market_cap, total_volume_24h, total_sales_24h,
  unique_buyers_24h, unique_sellers_24h, top_chains: [...],
  volume_change_24h, market_sentiment }
```

4. **GET /api/v1/gaming/tokens**
```
Query: chain, protocol, order, per_page, page
Response: [{ id, name, symbol, price, market_cap, volume_24h,
  game: { name, genre, chain, players_24h, dau_change },
  change_24h, change_7d }]
```

**Data Sources:**
- OpenSea API for NFT collection data
- Reservoir Protocol for aggregated NFT data
- DappRadar for gaming/DApp data
- CoinGecko NFT endpoints as fallback

**Instructions:**
- Support NFTs on: Ethereum, Solana, Polygon, Arbitrum, Base, BNB Chain
- Floor price in both native token and USD
- Limited to top 1000 collections by volume
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add NFT collection, floor price, and gaming token endpoints`

---

## Agent 25 — Blockchain-Specific APIs (Solana, Aptos, Sui, Bitcoin)

**Goal:** Build chain-specific endpoints for L1 blockchains with unique data not covered by EVM-generic endpoints.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/bitcoin/
  stats/route.ts                    (GET — network stats)
  hashrate/route.ts                 (GET — hashrate & mining)
  halving/route.ts                  (GET — halving countdown)
  lightning/route.ts                (GET — Lightning Network stats)
  supply/route.ts                   (GET — supply breakdown)
src/app/api/v1/solana/
  stats/route.ts                    (GET — network stats)
  validators/route.ts               (GET — validator list)
  tokens/route.ts                   (GET — SPL token list)
  nft/route.ts                      (GET — Solana NFT collections)
  defi/route.ts                     (GET — Solana DeFi overview)
src/app/api/v1/sui/
  stats/route.ts                    (GET — Sui network stats)
  tokens/route.ts                   (GET — Sui token list)
  defi/route.ts                     (GET — Sui DeFi)
src/app/api/v1/aptos/
  stats/route.ts                    (GET — Aptos network stats)
  tokens/route.ts                   (GET — Aptos tokens)
  defi/route.ts                     (GET — Aptos DeFi)
src/lib/services/
  bitcoin.ts
  solana.ts
  sui.ts
  aptos.ts
```

**Key Requirements:**

1. **Bitcoin:**
   - Hashrate, difficulty, block height, mempool size, avg fee, unconfirmed txs
   - Halving countdown (block-based, not time-based guess)
   - Lightning Network: capacity, channels, nodes
   - Supply: circulating, mined, lost estimate, held by entities
   - Mining pool distribution

2. **Solana:**
   - TPS (actual, max theoretical), active validators, stake distribution
   - Top SPL tokens by market cap
   - Solana DeFi TVL breakdown (Raydium, Jupiter, Marinade, etc.)
   - Validator performance (uptime, commission, stake)

3. **Sui / Aptos:**
   - Network stats: TPS, validators, total stake
   - Top tokens and DeFi protocols on each chain
   - Ecosystem growth metrics

**Data Sources:**
- Bitcoin: blockchain.info, mempool.space, Clark Moody APIs
- Solana: Solana RPC, Helius API, Jupiter aggregator
- Sui: Sui RPC, SuiScan
- Aptos: Aptos RPC, AptosScan

**Instructions:**
- Each chain-specific API should feel native (use chain terminology: validators not miners for PoS, etc.)
- free-crypto-news already has `/api/bitcoin/`, `/api/solana/`, `/api/sui/`, `/api/aptos/` routes — this agent builds the NEW v1 versions for Crypto Vision
- Include chain comparison endpoint at `/api/v1/chains/compare`
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add Bitcoin, Solana, Sui, and Aptos chain-specific endpoints`
