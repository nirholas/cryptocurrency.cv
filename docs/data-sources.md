# Free & Keyless Crypto Data Sources

cryptocurrency.cv aggregates ~150 provider adapters under
[`src/lib/providers/adapters/`](../src/lib/providers/adapters/). Each category is
a **fallback chain**: the first healthy provider wins, and the chain degrades
through the rest so a single throttled/dead source never takes a feature down.

This document catalogs the free crypto APIs the platform can pull from.

**Legend:** 🔓 keyless (no signup) · 🔑 free tier (free key) · ✅ integrated · ➕ available, not yet wired

## Aggregators — prices, market cap, coin metadata

| API | Access | Notes | Status |
|-----|--------|-------|--------|
| CoinGecko | 🔓 / 🔑 demo | Keyless ~10-30 req/min; a free demo key raises it. Deepest coin metadata (dev/community/tickers/sentiment). `COINGECKO_API_KEY` optional but recommended | ✅ |
| CoinPaprika | 🔓 | ~25k calls/mo, no key. Independent aggregation, great CoinGecko fallback | ✅ |
| CoinLore | 🔓 | 10,000+ coins, fully keyless, `nameid` maps to CoinGecko slugs. Wired into the market chain **and** the coin-detail fallback | ✅ |
| CoinCap | 🔑 | v2 was keyless; v3 now needs a free key | ✅ |
| Messari | 🔓 / 🔑 | Some keyless endpoints; free key for more | ✅ |
| CoinStats OpenAPI | 🔓 / 🔑 | Mostly keyless | ✅ |
| CoinMarketCap | 🔑 | Free tier, key required | ✅ |
| CryptoCompare | 🔑 | Generous free tier | ✅ |
| DIA Data (`api.diadata.org`) | 🔓 | Keyless oracle price feeds (price-only) | ➕ |

## Exchange public APIs (CEX) — 🔓 keyless for market data

Binance / Binance Futures ✅ · Coinbase Exchange ✅ · Kraken ✅ · KuCoin ✅ ·
Gate.io ✅ · Gemini ✅ · MEXC ✅ · OKX v5 ✅ · Bybit ✅

Additional keyless exchanges available to add for wider price consensus:
Bitfinex, Bitstamp, HTX, Poloniex, Crypto.com ➕

## DEX / on-chain DeFi — 🔓 keyless

| API | Notes | Status |
|-----|-------|--------|
| DefiLlama (`api.llama.fi` + `yields.` `stablecoins.` `bridges.`) | TVL, yields, DEX volumes, stablecoins, bridges, unlocks, fees | ✅ |
| GeckoTerminal | DEX pools/pairs on 100+ networks | ✅ |
| DexScreener | DEX pairs, token profiles | ✅ |
| Jupiter (`price.jup.ag`, `token.jup.ag`) | Solana prices + token list | ✅ |

## Derivatives / perps — 🔓 keyless

Binance / Bybit / OKX / dYdX / Hyperliquid — funding rates, open interest,
liquidations ✅ · CoinGlass 🔑 (aggregated) ✅

## Blockchain / on-chain

| API | Access | Notes | Status |
|-----|--------|-------|--------|
| mempool.space | 🔓 | BTC mempool, fees, blocks, addresses | ✅ |
| blockchain.info | 🔓 | BTC stats, addresses, txs | ✅ |
| Blockstream Esplora (`blockstream.info/api`) | 🔓 | Second keyless BTC source | ➕ |
| Etherscan V2 (+ 50 chains, one key) | 🔑 | Free key | ✅ |
| Public EVM RPC — Ankr, PublicNode, Cloudflare, 1RPC, LlamaNodes | 🔓 | Keyless JSON-RPC | ➕ |
| Solana RPC (`api.mainnet-beta.solana.com`) | 🔓 | Keyless (rate-limited) | ➕ |
| Helius / Birdeye | 🔑 | Solana enriched data | ✅ |

## Indices / sentiment / social

Alternative.me Fear & Greed 🔓 ✅ · CryptoPanic 🔑 ✅ · NewsData.io 🔑 ✅ ·
Reddit OAuth 🔑 ✅ · LunarCrush / Santiment 🔑 ✅ · Snapshot 🔓 ✅ ·
Polymarket / Metaculus 🔓 ✅

## NFT / staking / macro

OpenSea / Reservoir / SimpleHash 🔑 ✅ · Lido / StakingRewards / EigenLayer /
L2Beat ✅ · Yahoo Finance 🔓 ✅ · FRED / Alpha Vantage / Twelve Data 🔑 ✅ ·
Frankfurter / exchangerate.host 🔓 (fiat FX) ➕

## Adding a keyless source

1. Create `src/lib/providers/adapters/<category>/<name>.adapter.ts` implementing
   `DataProvider<T>` (see [`coinlore.adapter.ts`](../src/lib/providers/adapters/market-price/coinlore.adapter.ts)
   for a keyless template — `fetch`, `healthCheck`, `validate`).
2. Register it in that category's `index.ts` chain with a `priority` (lower =
   tried first) and `weight` (consensus trust).
3. Keyless sources get a lower priority than keyed ones only when the keyed
   source is more complete — otherwise put the free one first.

Prefer keyless sources: they need no secret, never expire, and keep the free
tier of the platform genuinely free.
