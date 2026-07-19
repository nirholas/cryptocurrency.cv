# Data-provider resilience: done + follow-ups

The keyless CoinGecko tier (`api.coingecko.com`) is heavily rate-limited in
production. Any surface that depends solely on CoinGecko with no fallback
returns 5xx (or renders blank) whenever CoinGecko throttles. The data layer
already has fallback chains (CoinPaprika, CoinCap, Binance, DefiLlama); the fix
in each case is to route the surface through the resilient lib function instead
of a raw CoinGecko `fetch`.

## The single highest-impact lever

Set `COINGECKO_API_KEY` (free demo key at coingecko.com/en/api) on the Cloud Run
service. It is already wired (`x-cg-demo-api-key` header across the codebase) and
raises the rate-limit ceiling that forces all the fallbacks below. Everything
here is defense-in-depth on top of that key.

## Fixed (2026-07-19)

- `getGlobalDeFiData()` (src/lib/market-data.ts) — added a DefiLlama fallback
  (real TVL, DEX volume, top chain). Fixes `/api/market/defi` (was 500) and
  `/api/market/global-defi` (was 503).
- `/api/global` — now uses `getGlobalMarketData()` (CoinPaprika fallback) and
  degrades to a 200 empty payload. This powers the header MarketWidget on every
  page.
- `/bitcoin`, `/ethereum`, `/solana` landing pages — now use `getCoinDetails()`
  (CoinPaprika -> CoinCap fallback) so the price panel survives a throttle.
- `/api/market/dominance` — degrades to 200 empty instead of 503.
- `/api/v1/coin/[coinId]` — falls back to `getCoinDetails()` on non-404 upstream
  failure instead of 502.
- Fixed wrong CoinGecko header `x-cg-demo-key` -> `x-cg-demo-api-key` in the
  OHLCV adapter.

## Follow-ups (lower traffic; auth-gated or chart surfaces)

Each is the same pattern: swap the raw CoinGecko fetch for the existing
fallback-backed lib function, or degrade a 5xx to a 200 empty.

- `/api/charts` (route.ts) — `market_chart` and `ohlc` fetch CoinGecko directly
  (502/500 on failure). Route through `getHistoricalPrices()` /
  `getOHLC()` which already invoke `getHistoricalPricesFallback` (CoinCap) and
  `getOHLCBinanceFallback` (Binance klines).
- `/api/v1/trending` — raw `/search/trending` -> 502. Use `getTrending()`
  (has `getTrendingFallback`, CoinCap top-10). Map `TrendingCoin[]` to the
  route's output shape.
- `/api/v1/market-data` — CoinGecko `/global` + `/search/trending`, 502 on
  either. Use `getGlobalMarketData()` + `getTrending()`, and don't fail the
  whole route when only one upstream is down.
- `/api/compare` — raw `/coins/markets` -> 500. Use `fetchCoinGecko()` (gets the
  CoinCap `/coins/markets` fallback for free) or degrade to partial results.
- `/api/exchange-rates` — raw `/exchange_rates`, propagates 429/5xx. No clean
  keyless equivalent for BTC-denominated rates; at minimum serve a stale/empty
  200 so the currency selector degrades instead of erroring.

## Verified already-safe (no change needed)

`/api/market/{heatmap,gainers,losers,movers,derivatives,coins,categories,exchanges,search,tickers,history,ohlc}`,
`/api/fear-greed`, `/api/gas`, `/api/prices`, `/api/trending`, `/api/stats`,
`/api/defi/{summary,dex-volumes}` — all already degrade to empty arrays/objects
via lib-level fallbacks.
