# Prompt 07: Derivatives Data Adapters

## Context

The codebase already has direct API routes for derivatives data:

**Existing routes (bypassing provider framework):**
- `/api/derivatives/bybit/tickers` → `https://api.bybit.com/v5/market/tickers?category=linear|inverse`
- `/api/derivatives/bybit/funding/` → `https://api.bybit.com/v5/market/funding/history`
- `/api/derivatives/bybit/open-interest/` → `https://api.bybit.com/v5/market/open-interest`
- `/api/derivatives/okx/tickers` → `https://www.okx.com/api/v5/market/tickers?instType=SWAP|FUTURES`
- `/api/derivatives/okx/funding` → `https://www.okx.com/api/v5/public/funding-rate`
- `/api/derivatives/okx/open-interest` → `https://www.okx.com/api/v5/public/open-interest?instType=SWAP|FUTURES`
- `/api/derivatives/dydx/markets` → `https://api.dydx.exchange/v3/markets`
- `/api/derivatives/aggregated/funding` → aggregates all three
- `/api/derivatives/aggregated/open-interest` → aggregates all three
- `/api/derivatives/opportunities` → funding rate arbitrage finder

**None of these require API keys** — all use public endpoints.

**Provider framework categories that should cover this data:**
- `funding-rate` — currently no adapters
- `open-interest` — currently no adapters
- `liquidations` — currently no adapters

**External API base URLs** (defined in `src/lib/external-apis.ts`):
- Bybit: `https://api.bybit.com/v5`
- OKX: `https://www.okx.com/api/v5`
- dYdX: `https://api.dydx.exchange/v3`

## Task

### 1. Create Funding Rate Adapters

Create adapters for `DataCategory = 'funding-rate'` in `src/lib/providers/adapters/funding-rate/`:

#### `src/lib/providers/adapters/funding-rate/bybit.ts`

```typescript
import { DataProvider, ProviderResult, FetchParams } from '../../types';

export interface FundingRateData {
  symbol: string;
  exchange: string;
  fundingRate: number;        // current rate as decimal
  annualizedRate: number;     // fundingRate * 3 * 365 * 100
  nextFundingTime: string;    // ISO timestamp
  markPrice: number;
  indexPrice: number;
  timestamp: string;
}

export const bybitFundingRateProvider: DataProvider<FundingRateData[]> = {
  name: 'bybit-funding-rate',
  category: 'funding-rate',
  priority: 1,
  weight: 0.35,
  baseUrl: 'https://api.bybit.com/v5',

  async fetch(params: FetchParams): Promise<ProviderResult<FundingRateData[]>> {
    const symbol = params.symbol?.toUpperCase() || 'BTCUSDT';
    const url = `${this.baseUrl}/market/tickers?category=linear&symbol=${symbol}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
    const data = await response.json();

    const tickers = data.result?.list || [];
    const rates: FundingRateData[] = tickers.map((t: any) => ({
      symbol: t.symbol,
      exchange: 'bybit',
      fundingRate: parseFloat(t.fundingRate),
      annualizedRate: parseFloat(t.fundingRate) * 3 * 365 * 100,
      nextFundingTime: new Date(parseInt(t.nextFundingTime)).toISOString(),
      markPrice: parseFloat(t.markPrice),
      indexPrice: parseFloat(t.indexPrice),
      timestamp: new Date().toISOString(),
    }));

    return {
      data: rates,
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },

  healthCheck: async () => {
    const res = await fetch('https://api.bybit.com/v5/market/time');
    return res.ok;
  },
};
```

#### `src/lib/providers/adapters/funding-rate/okx.ts`

```typescript
export const okxFundingRateProvider: DataProvider<FundingRateData[]> = {
  name: 'okx-funding-rate',
  category: 'funding-rate',
  priority: 2,
  weight: 0.35,
  baseUrl: 'https://www.okx.com/api/v5',

  async fetch(params: FetchParams): Promise<ProviderResult<FundingRateData[]>> {
    const instId = params.symbol ? `${params.symbol.toUpperCase()}-USDT-SWAP` : 'BTC-USDT-SWAP';
    const url = `${this.baseUrl}/public/funding-rate?instId=${instId}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      data: data.data.map((item: any) => ({
        symbol: item.instId,
        exchange: 'okx',
        fundingRate: parseFloat(item.fundingRate),
        annualizedRate: parseFloat(item.fundingRate) * 3 * 365 * 100,
        nextFundingTime: new Date(parseInt(item.nextFundingTime)).toISOString(),
        markPrice: parseFloat(item.markPrice || '0'),
        indexPrice: parseFloat(item.indexPrice || '0'),
        timestamp: new Date().toISOString(),
      })),
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/funding-rate/dydx.ts`

```typescript
export const dydxFundingRateProvider: DataProvider<FundingRateData[]> = {
  name: 'dydx-funding-rate',
  category: 'funding-rate',
  priority: 3,
  weight: 0.15,
  baseUrl: 'https://api.dydx.exchange/v3',

  async fetch(params: FetchParams): Promise<ProviderResult<FundingRateData[]>> {
    const url = `${this.baseUrl}/markets`;
    const response = await fetch(url);
    const data = await response.json();

    const markets = Object.values(data.markets) as any[];
    const rates: FundingRateData[] = markets
      .filter((m) => !params.symbol || m.market.includes(params.symbol.toUpperCase()))
      .map((m) => ({
        symbol: m.market,
        exchange: 'dydx',
        fundingRate: parseFloat(m.nextFundingRate),
        annualizedRate: parseFloat(m.nextFundingRate) * 24 * 365 * 100, // dYdX is hourly
        nextFundingTime: m.nextFundingAt,
        markPrice: parseFloat(m.oraclePrice),
        indexPrice: parseFloat(m.indexPrice),
        timestamp: new Date().toISOString(),
      }));

    return { data: rates, provider: this.name, timestamp: Date.now(), cached: false };
  },
};
```

#### New adapters to add:

##### `src/lib/providers/adapters/funding-rate/hyperliquid.ts`

```typescript
// Hyperliquid — decentralized perps L1
// Public API, no key needed
// Base URL: https://api.hyperliquid.xyz/info
// Endpoint: POST with body {"type": "metaAndAssetCtxs"}
// Returns: [meta, assetCtxs[]] where assetCtxs contains funding, openInterest, markPx

export const hyperliquidFundingRateProvider: DataProvider<FundingRateData[]> = {
  name: 'hyperliquid-funding-rate',
  category: 'funding-rate',
  priority: 4,
  weight: 0.15,
  baseUrl: 'https://api.hyperliquid.xyz',

  async fetch(params: FetchParams): Promise<ProviderResult<FundingRateData[]>> {
    const response = await fetch(`${this.baseUrl}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });
    const [meta, assetCtxs] = await response.json();

    const rates = meta.universe.map((asset: any, i: number) => ({
      symbol: asset.name,
      exchange: 'hyperliquid',
      fundingRate: parseFloat(assetCtxs[i].funding),
      annualizedRate: parseFloat(assetCtxs[i].funding) * 24 * 365 * 100,
      nextFundingTime: '', // Hyperliquid uses hourly, next not exposed
      markPrice: parseFloat(assetCtxs[i].markPx),
      indexPrice: parseFloat(assetCtxs[i].oraclePx || assetCtxs[i].markPx),
      timestamp: new Date().toISOString(),
    }));

    return { data: rates, provider: this.name, timestamp: Date.now(), cached: false };
  },
};
```

### 2. Create Open Interest Adapters

Create adapters for `DataCategory = 'open-interest'` in `src/lib/providers/adapters/open-interest/`:

Follow the same pattern — create `bybit.ts`, `okx.ts`, `dydx.ts`, `hyperliquid.ts`.

**Bybit endpoint:** `GET /v5/market/open-interest?category=linear&symbol={symbol}&intervalTime=5min`  
**OKX endpoint:** `GET /api/v5/public/open-interest?instType=SWAP`  
**dYdX:** already in markets response (`openInterest` field)  
**Hyperliquid:** already in `assetCtxs[i].openInterest`

```typescript
export interface OpenInterestData {
  symbol: string;
  exchange: string;
  openInterest: number;         // in contracts
  openInterestValue: number;    // in USD
  change24h: number;            // percentage
  timestamp: string;
}
```

### 3. Create Liquidation Adapters

Create adapters for `DataCategory = 'liquidations'` in `src/lib/providers/adapters/liquidations/`:

#### Sources:

1. **Bybit** — `GET /v5/market/recent-trade?category=linear&symbol={symbol}` (filter `side` for liquidations)
2. **CoinGlass** (new source) — `https://open-api.coinglass.com/public/v2/liquidation` — **Requires `COINGLASS_API_KEY`**
3. **Hyperliquid** — POST to `/info` with `{"type": "userFills", ...}` for liquidation events

```typescript
export interface LiquidationData {
  symbol: string;
  exchange: string;
  side: 'long' | 'short';
  quantity: number;
  price: number;
  valueUsd: number;
  timestamp: string;
}
```

### 4. Register Provider Chains

In `src/lib/providers/registry.ts` (or create `src/lib/providers/chains/derivatives.ts`):

```typescript
import { createProviderChain } from '../provider-chain';
import { bybitFundingRateProvider } from '../adapters/funding-rate/bybit';
import { okxFundingRateProvider } from '../adapters/funding-rate/okx';
import { dydxFundingRateProvider } from '../adapters/funding-rate/dydx';
import { hyperliquidFundingRateProvider } from '../adapters/funding-rate/hyperliquid';

export const fundingRateChain = createProviderChain('funding-rate', {
  providers: [
    bybitFundingRateProvider,
    okxFundingRateProvider,
    dydxFundingRateProvider,
    hyperliquidFundingRateProvider,
  ],
  strategy: 'broadcast',  // get data from ALL exchanges
  ttl: 30_000,           // 30s cache
  retries: 2,
});

export const openInterestChain = createProviderChain('open-interest', {
  providers: [/* ... */],
  strategy: 'broadcast',
  ttl: 60_000,           // 1min cache
});

export const liquidationsChain = createProviderChain('liquidations', {
  providers: [/* ... */],
  strategy: 'broadcast',
  ttl: 15_000,           // 15s cache — liquidations are time-sensitive
});
```

### 5. Migrate Existing Routes

Update `/api/derivatives/aggregated/funding/route.ts` to use the new provider chain instead of direct fetch:

```typescript
import { fundingRateChain } from '@/lib/providers/chains/derivatives';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || undefined;

  const result = await fundingRateChain.execute({ symbol });

  return NextResponse.json({
    data: result.data,
    providers: result.providers,    // which exchanges responded
    timestamp: result.timestamp,
    cached: result.cached,
  });
}
```

### 6. New API Key Needed

```bash
# CoinGlass — for comprehensive liquidation data
# Sign up at https://www.coinglass.com/
COINGLASS_API_KEY=your_key_here
```

### Environment Variables

```bash
# Existing — no keys needed for Bybit, OKX, dYdX
# New
COINGLASS_API_KEY=           # For liquidation data (sign up at coinglass.com)
```

## Success Criteria

- [ ] 4 funding-rate adapters created (Bybit, OKX, dYdX, Hyperliquid)
- [ ] 4 open-interest adapters created (same exchanges)
- [ ] 3 liquidation adapters created (Bybit, CoinGlass, Hyperliquid)
- [ ] Provider chains registered with `broadcast` strategy
- [ ] Existing `/api/derivatives/aggregated/*` routes migrated to use chains
- [ ] `/api/derivatives/opportunities` uses chain data for arbitrage detection
- [ ] Unit tests for each adapter with mocked API responses
- [ ] Integration test confirming circuit breaker activates when exchange is down
- [ ] All existing derivative route tests still pass
