# Prompt 14: Stablecoin Flow Adapters

## Context

The codebase has basic stablecoin data via DefiLlama:

**Existing route:**
- `/api/defi/stablecoins` → `https://stablecoins.llama.fi` — basic stablecoin market data (name, symbol, pegType, circulating, price)

**No dedicated stablecoin flow tracking** — this is critical data that institutions use:
- Stablecoin mint/burn = capital inflows/outflows to crypto
- Exchange stablecoin deposits predict buying pressure
- Chain-level stablecoin distribution shows where activity is moving
- De-peg events are systemic risk signals

**Provider framework category:**
- `stablecoin-flows` — currently no adapters

## Task

### 1. Create Stablecoin Flow Types

```typescript
export interface StablecoinFlowData {
  stablecoins: StablecoinProfile[];
  totalMarketCap: number;
  totalMarketCapChange24h: number;
  netMintBurn24h: number;           // positive = minting (inflow)
  exchangeInflow24h: number;        // stablecoins moving to exchanges
  exchangeOutflow24h: number;       // stablecoins leaving exchanges
  chainDistribution: Record<string, number>;  // chain → USDT+USDC on that chain
  timestamp: string;
}

export interface StablecoinProfile {
  name: string;                     // USDT, USDC, DAI, etc.
  symbol: string;
  pegType: string;                  // 'fiat-backed' | 'crypto-backed' | 'algorithmic'
  currentPrice: number;             // should be ~1.00
  pegDeviation: number;             // deviation from $1 in basis points
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  chains: Record<string, number>;   // chain → supply on that chain
  mintBurn24h: number;              // net change in supply
  exchangeBalance: number;          // total on exchanges
  dominance: number;                // % of total stablecoin market
  timestamp: string;
}
```

### 2. Create Stablecoin Flow Adapters

Create `src/lib/providers/adapters/stablecoin-flows/`:

#### `src/lib/providers/adapters/stablecoin-flows/defillama.ts` (Primary)

```typescript
// DefiLlama — comprehensive stablecoin data, free, no key
// https://stablecoins.llama.fi/stablecoins?includePrices=true
// https://stablecoins.llama.fi/stablecoinchains — per-chain breakdown
// https://stablecoins.llama.fi/stablecoin/{id} — detailed per-stablecoin

export const defillamaStablecoinProvider: DataProvider<StablecoinFlowData> = {
  name: 'defillama-stablecoins',
  category: 'stablecoin-flows',
  priority: 1,
  weight: 0.4,
  baseUrl: 'https://stablecoins.llama.fi',

  async fetch(params: FetchParams): Promise<ProviderResult<StablecoinFlowData>> {
    const [stablecoinsRes, chainsRes] = await Promise.all([
      fetch(`${this.baseUrl}/stablecoins?includePrices=true`),
      fetch(`${this.baseUrl}/stablecoinchains`),
    ]);

    const stablecoinsData = await stablecoinsRes.json();
    const chainsData = await chainsRes.json();

    const stablecoins: StablecoinProfile[] = (stablecoinsData.peggedAssets || [])
      .slice(0, params.limit || 20)
      .map((s: any) => {
        const currentMcap = Object.values(s.chainCirculating || {})
          .reduce((sum: number, c: any) => sum + (c?.current?.peggedUSD || 0), 0);
        const price = s.price || 1;

        return {
          name: s.name,
          symbol: s.symbol,
          pegType: s.pegType || 'unknown',
          currentPrice: price,
          pegDeviation: Math.round(Math.abs(1 - price) * 10000), // basis points
          marketCap: currentMcap,
          marketCapChange24h: 0,
          volume24h: 0,
          chains: Object.fromEntries(
            Object.entries(s.chainCirculating || {}).map(([chain, data]: [string, any]) => [
              chain,
              data?.current?.peggedUSD || 0,
            ])
          ),
          mintBurn24h: 0, // compute from historical
          exchangeBalance: 0,
          dominance: 0,
          timestamp: new Date().toISOString(),
        };
      });

    const totalMarketCap = stablecoins.reduce((sum, s) => sum + s.marketCap, 0);
    stablecoins.forEach(s => {
      s.dominance = totalMarketCap > 0 ? (s.marketCap / totalMarketCap) * 100 : 0;
    });

    const chainDistribution: Record<string, number> = {};
    for (const chain of chainsData || []) {
      chainDistribution[chain.name] = chain.totalCirculatingUSD?.peggedUSD || 0;
    }

    return {
      data: {
        stablecoins,
        totalMarketCap,
        totalMarketCapChange24h: 0,
        netMintBurn24h: 0,
        exchangeInflow24h: 0,
        exchangeOutflow24h: 0,
        chainDistribution,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },

  healthCheck: async () => {
    const res = await fetch('https://stablecoins.llama.fi/stablecoins');
    return res.ok;
  },
};
```

#### `src/lib/providers/adapters/stablecoin-flows/glassnode.ts` (Exchange Flows)

```typescript
// Glassnode — stablecoin exchange flow data
// https://api.glassnode.com/v1/metrics/distribution/exchange_net_position_change
// Requires GLASSNODE_API_KEY (already used in on-chain routes)
// Unique value: exchange inflow/outflow for USDT/USDC

export const glassnodeStablecoinProvider: DataProvider<StablecoinFlowData> = {
  name: 'glassnode-stablecoins',
  category: 'stablecoin-flows',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://api.glassnode.com/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<StablecoinFlowData>> {
    const key = process.env.GLASSNODE_API_KEY;
    if (!key) throw new Error('GLASSNODE_API_KEY required');

    // Track exchange net position for major stablecoins
    const [usdtFlow, usdcFlow] = await Promise.all([
      fetch(`${this.baseUrl}/metrics/distribution/exchange_net_position_change?a=USDT&api_key=${key}&i=24h`).then(r => r.json()),
      fetch(`${this.baseUrl}/metrics/distribution/exchange_net_position_change?a=USDC&api_key=${key}&i=24h`).then(r => r.json()),
    ]);

    const usdtNetFlow = usdtFlow?.at(-1)?.v || 0;
    const usdcNetFlow = usdcFlow?.at(-1)?.v || 0;

    return {
      data: {
        stablecoins: [],
        totalMarketCap: 0,
        totalMarketCapChange24h: 0,
        netMintBurn24h: 0,
        exchangeInflow24h: Math.max(0, usdtNetFlow) + Math.max(0, usdcNetFlow),
        exchangeOutflow24h: Math.abs(Math.min(0, usdtNetFlow)) + Math.abs(Math.min(0, usdcNetFlow)),
        chainDistribution: {},
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/stablecoin-flows/artemis.ts` (Cross-chain)

```typescript
// Artemis — cross-chain analytics with stablecoin focus
// https://api.artemisanalytics.com/stablecoins
// Requires ARTEMIS_API_KEY (apply at artemis.xyz for access)
// Best for: cross-chain stablecoin transfer volumes, bridge flows

export const artemisStablecoinProvider: DataProvider<StablecoinFlowData> = {
  name: 'artemis-stablecoins',
  category: 'stablecoin-flows',
  priority: 3,
  weight: 0.15,
  baseUrl: 'https://api.artemisanalytics.com',
};
```

#### `src/lib/providers/adapters/stablecoin-flows/dune.ts` (Custom Queries)

```typescript
// Dune Analytics — SQL-powered on-chain analytics
// https://api.dune.com/api/v1/query/{query_id}/results
// Requires DUNE_API_KEY (free tier: 2500 credits/month)
// Pre-build Dune queries for:
// - USDT/USDC mint events
// - Exchange deposit addresses
// - Bridge transfer volumes
// - Whale stablecoin movements

export const duneStablecoinProvider: DataProvider<StablecoinFlowData> = {
  name: 'dune-stablecoins',
  category: 'stablecoin-flows',
  priority: 4,
  weight: 0.15,
  baseUrl: 'https://api.dune.com/api/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<StablecoinFlowData>> {
    const key = process.env.DUNE_API_KEY;
    if (!key) throw new Error('DUNE_API_KEY required');

    // Pre-built Dune query IDs (create these on dune.com):
    const QUERIES = {
      stablecoinSupply: '3456789',    // total supply by stablecoin
      mintBurn: '3456790',            // 24h mint/burn events
      exchangeFlows: '3456791',       // exchange deposit/withdrawal
    };

    const response = await fetch(
      `${this.baseUrl}/query/${QUERIES.stablecoinSupply}/results`,
      { headers: { 'X-Dune-API-Key': key } }
    );
    const data = await response.json();

    // Process Dune query results into StablecoinFlowData
    return {
      data: {
        stablecoins: [],
        totalMarketCap: 0,
        totalMarketCapChange24h: 0,
        netMintBurn24h: 0,
        exchangeInflow24h: 0,
        exchangeOutflow24h: 0,
        chainDistribution: {},
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 3. De-Peg Alert System

Create a real-time stablecoin de-peg monitoring system:

```typescript
// src/lib/stablecoin/depeg-monitor.ts

export interface DePegAlert {
  stablecoin: string;
  currentPrice: number;
  deviationBps: number;    // basis points from $1
  severity: 'watch' | 'warning' | 'critical';
  direction: 'above' | 'below';
  timestamp: string;
}

const THRESHOLDS = {
  watch: 30,       // 0.30% deviation
  warning: 100,    // 1.00% deviation
  critical: 500,   // 5.00% deviation
};

export function checkDePeg(stablecoins: StablecoinProfile[]): DePegAlert[] {
  return stablecoins
    .filter(s => s.pegDeviation > THRESHOLDS.watch)
    .map(s => ({
      stablecoin: s.symbol,
      currentPrice: s.currentPrice,
      deviationBps: s.pegDeviation,
      severity: s.pegDeviation >= THRESHOLDS.critical ? 'critical'
        : s.pegDeviation >= THRESHOLDS.warning ? 'warning'
        : 'watch',
      direction: s.currentPrice > 1 ? 'above' : 'below',
      timestamp: s.timestamp,
    }))
    .sort((a, b) => b.deviationBps - a.deviationBps);
}
```

### 4. New API Routes

```
/api/stablecoins                 → stablecoin market overview
/api/stablecoins/flows           → mint/burn + exchange flows
/api/stablecoins/chains          → per-chain stablecoin distribution
/api/stablecoins/depeg           → de-peg monitoring & alerts
/api/stablecoins/[symbol]        → detailed per-stablecoin data
/api/stablecoins/dominance       → USDT vs USDC vs DAI market share
```

### 5. Register Provider Chain

```typescript
// src/lib/providers/chains/stablecoins.ts

export const stablecoinFlowsChain = createProviderChain('stablecoin-flows', {
  providers: [
    defillamaStablecoinProvider,
    glassnodeStablecoinProvider,
    artemisStablecoinProvider,
    duneStablecoinProvider,
  ],
  strategy: 'broadcast',         // aggregate all sources
  ttl: 300_000,                 // 5min cache
});
```

### 6. WebSocket Integration

Add stablecoin events to the WebSocket server:

```typescript
// In ws-server.js, add new subscription channel:
// Channel: 'stablecoins'
// Events:
//   - stablecoin:depeg — de-peg alert
//   - stablecoin:mint — large mint event ($10M+)
//   - stablecoin:burn — large burn event ($10M+)
//   - stablecoin:flow — large exchange inflow/outflow ($50M+)
```

### Environment Variables

```bash
# Existing
GLASSNODE_API_KEY=              # Exchange flow data (already used in on-chain routes)

# New — sign up for these
ARTEMIS_API_KEY=                # Cross-chain analytics (apply at artemis.xyz)
DUNE_API_KEY=                   # SQL analytics (free: 2500 credits/month at dune.com)
```

## Success Criteria

- [ ] 4 stablecoin-flows adapters (DefiLlama, Glassnode, Artemis, Dune)
- [ ] Provider chain with `broadcast` strategy
- [ ] De-peg monitoring with 3-tier alert severity
- [ ] 6 new `/api/stablecoins/*` routes
- [ ] Per-chain stablecoin distribution (ETH, Tron, Solana, Arbitrum, etc.)
- [ ] Exchange inflow/outflow tracking for USDT, USDC
- [ ] Mint/burn event tracking with WebSocket alerts
- [ ] Stablecoin dominance chart data (USDT vs USDC vs DAI over time)
- [ ] Unit tests for all adapters
- [ ] Existing `/api/defi/stablecoins` route migrated to use new chain
