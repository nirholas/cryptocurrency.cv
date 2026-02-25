# Prompt 01: Migrate Direct API Calls to Provider Framework

## Context

The codebase has a production-grade provider framework (`src/lib/providers/`) with circuit breakers, data fusion, anomaly detection, health monitoring, and 4 resolution strategies (fallback/race/consensus/broadcast). **But only `market-price` uses it.** The other ~350 API routes call external APIs directly with `fetch()`, bypassing all protections.

This is the single highest-leverage change for scaling to 1M+ users — every upstream failure currently cascades directly to users.

## Current State

```
src/lib/providers/
├── types.ts              # 15 DataCategory types defined
├── provider-chain.ts     # Orchestrator (fallback/race/consensus/broadcast)
├── circuit-breaker.ts    # Per-provider circuit breaker
├── anomaly-detector.ts   # Z-score, spike, stale detection
├── data-fusion.ts        # Weighted consensus engine
├── health-monitor.ts     # Latency + success rate tracking
├── registry.ts           # Category → chain routing
├── index.ts              # Barrel exports
└── adapters/
    └── market-price/     # ← ONLY implemented category
        ├── coingecko.adapter.ts
        ├── binance.adapter.ts
        ├── coincap.adapter.ts
        └── index.ts
```

## Task

Migrate the **most critical direct API calls** to use the provider framework. Focus on the routes that get the most traffic and that have multiple possible upstream sources.

### Phase 1: Create Adapter Scaffolding

For each new category, create `src/lib/providers/adapters/{category}/` with:

1. **At least 2 adapters per category** (for fallback/consensus)
2. An `index.ts` that exports pre-built chains
3. Tests in `src/lib/providers/__tests__/`

### Phase 2: Categories to Migrate (priority order)

#### 1. `fear-greed` — Fear & Greed Index
- **Current:** `/api/sentiment/fear-greed/route.ts` calls Alternative.me directly
- **Adapters to create:**
  - `alternative-me.adapter.ts` — `https://api.alternative.me/fng/?limit=30` (no key)
  - `coingecko.adapter.ts` — CoinGecko includes fear/greed in market data (no key)
- **Strategy:** `fallback` (Alternative.me primary, CoinGecko backup)
- **Cache TTL:** 300s (updates every 24h anyway)

#### 2. `tvl` — Total Value Locked
- **Current:** `/api/defi/tvl/route.ts` calls DefiLlama directly
- **Adapters to create:**
  - `defillama.adapter.ts` — `https://api.llama.fi/v2/protocols` (no key)
  - `defi-pulse.adapter.ts` — DeFi Pulse API as backup
- **Strategy:** `fallback`
- **Cache TTL:** 300s

#### 3. `funding-rate` — Perpetual Funding Rates
- **Current:** `/api/funding-rates/route.ts` calls Bybit/OKX directly
- **Adapters to create:**
  - `bybit.adapter.ts` — `https://api.bybit.com/v5/market/tickers` (no key)
  - `okx.adapter.ts` — `https://www.okx.com/api/v5/public/funding-rate` (no key)
  - `binance.adapter.ts` — `https://fapi.binance.com/fapi/v1/premiumIndex` (no key)
- **Strategy:** `consensus` (3 sources, weighted median)
- **Cache TTL:** 60s

#### 4. `gas-fees` — Network Gas Prices
- **Current:** Various direct calls to Etherscan, Mempool.space
- **Adapters to create:**
  - `etherscan.adapter.ts` — `https://api.etherscan.io/api?module=gastracker` (key recommended)
  - `mempool.adapter.ts` — `https://mempool.space/api/v1/fees/recommended` (no key)
  - `blocknative.adapter.ts` — `https://api.blocknative.com/gasprices/blockprices` (key required)
- **Strategy:** `consensus` for ETH, `fallback` for BTC
- **Cache TTL:** 15s (gas changes fast)

### Phase 3: Wire Into Routes

For each migrated category, update the API route to use the registry:

```typescript
// Before (direct fetch, no protection)
const res = await fetch('https://api.alternative.me/fng/');
const data = await res.json();

// After (full protection stack)
import { registry } from '@/lib/providers';

const result = await registry.fetch('fear-greed', { limit: 30 });
// Automatic: circuit breaker, caching, fallback, health monitoring
```

### Phase 4: Register Chains at Startup

Create `src/lib/providers/bootstrap.ts`:

```typescript
import { registry } from './registry';
import { marketPriceChain } from './adapters/market-price';
import { fearGreedChain } from './adapters/fear-greed';
import { tvlChain } from './adapters/tvl';
import { fundingRateChain } from './adapters/funding-rate';
import { gasFeesChain } from './adapters/gas-fees';

export function bootstrapProviders(): void {
  registry.register('market-price', marketPriceChain);
  registry.register('fear-greed', fearGreedChain);
  registry.register('tvl', tvlChain);
  registry.register('funding-rate', fundingRateChain);
  registry.register('gas-fees', gasFeesChain);
}
```

Call `bootstrapProviders()` from the app's initialization (e.g., `instrumentation.ts` or a middleware-level init check).

## Adapter Template

Every adapter must implement `DataProvider<T>`:

```typescript
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

export interface FearGreedData {
  value: number;        // 0-100
  classification: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: number;
}

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

export const alternativeMeAdapter: DataProvider<FearGreedData> = {
  name: 'alternative-me',
  description: 'Alternative.me Fear & Greed Index',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['fear-greed'],

  async fetch(params: FetchParams): Promise<FearGreedData> {
    const limit = params.limit ?? 1;
    const res = await fetch(`https://api.alternative.me/fng/?limit=${limit}`);
    if (!res.ok) throw new Error(`Alternative.me error: ${res.status}`);
    const json = await res.json();
    return normalize(json);
  },

  async healthCheck(): Promise<boolean> {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    return res.ok;
  },

  validate(data: FearGreedData): boolean {
    return data.value >= 0 && data.value <= 100;
  },
};
```

## Testing

For each adapter, write tests in `src/lib/providers/__tests__/{category}.test.ts`:

```typescript
describe('FearGreedChain', () => {
  it('falls back when primary fails', async () => { ... });
  it('serves cached data on total failure', async () => { ... });
  it('validates response shape', async () => { ... });
  it('circuit breaker opens after repeated failures', async () => { ... });
});
```

## Success Criteria

- [ ] At least 4 new DataCategory adapters created (fear-greed, tvl, funding-rate, gas-fees)
- [ ] Each category has 2+ adapters for redundancy
- [ ] API routes updated to use `registry.fetch()` instead of direct `fetch()`
- [ ] `bootstrapProviders()` registers all chains at startup
- [ ] Circuit breakers prevent cascading failures
- [ ] Health endpoint (`/api/health`) reports all chain statuses
- [ ] All new code has tests
- [ ] TypeScript compiles with zero errors
