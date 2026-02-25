# Prompt 08: DeFi Data Adapters

## Context

The codebase has DeFi routes that call DefiLlama directly:

**Existing routes:**
- `/api/defi/yields` → `https://yields.llama.fi/pools`
- `/api/defi/bridges` → `https://api.llama.fi` (bridges endpoints)
- `/api/defi/stablecoins` → `https://stablecoins.llama.fi` (stablecoin data)
- `/api/defi/dex-volumes` → `https://api.llama.fi` (DEX volume data)
- `/api/defi/summary` → `https://api.llama.fi` (global DeFi summary)
- `/api/defi/protocol-health` → composite DefiLlama TVL + internal audit DB

**DefiLlama URLs** (from `src/lib/apis/defillama.ts`):
- `https://api.llama.fi` — protocols, TVL, volumes
- `https://coins.llama.fi` — coin prices
- `https://yields.llama.fi` — yield pools
- `https://stablecoins.llama.fi` — stablecoin data

**All DefiLlama endpoints are free, no API key required.**

**Provider framework categories:**
- `tvl` — currently no adapters
- `defi-yields` — currently no adapters

## Task

### 1. Create TVL Adapters

Create adapters for `DataCategory = 'tvl'` in `src/lib/providers/adapters/tvl/`:

#### `src/lib/providers/adapters/tvl/defillama.ts` (Primary)

```typescript
import { DataProvider, ProviderResult, FetchParams } from '../../types';

export interface TVLData {
  protocol: string;
  chain: string;
  tvlUsd: number;
  change24h: number;
  change7d: number;
  category: string;
  chains: string[];
  timestamp: string;
}

export interface GlobalTVL {
  totalTvl: number;
  change24h: number;
  protocols: TVLData[];
  byChain: Record<string, number>;
}

export const defillamaTvlProvider: DataProvider<GlobalTVL> = {
  name: 'defillama-tvl',
  category: 'tvl',
  priority: 1,
  weight: 0.6,
  baseUrl: 'https://api.llama.fi',

  async fetch(params: FetchParams): Promise<ProviderResult<GlobalTVL>> {
    const [protocolsRes, chainsRes] = await Promise.all([
      fetch(`${this.baseUrl}/protocols`),
      fetch(`${this.baseUrl}/v2/chains`),
    ]);

    const protocols = await protocolsRes.json();
    const chains = await chainsRes.json();

    const topProtocols: TVLData[] = protocols
      .filter((p: any) => p.tvl > 0)
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, params.limit || 100)
      .map((p: any) => ({
        protocol: p.name,
        chain: p.chain || 'Multi-chain',
        tvlUsd: p.tvl,
        change24h: p.change_1d || 0,
        change7d: p.change_7d || 0,
        category: p.category || 'Unknown',
        chains: p.chains || [],
        timestamp: new Date().toISOString(),
      }));

    const byChain: Record<string, number> = {};
    for (const c of chains) {
      byChain[c.name] = c.tvl;
    }

    const totalTvl = chains.reduce((sum: number, c: any) => sum + (c.tvl || 0), 0);

    return {
      data: {
        totalTvl,
        change24h: 0, // compute from historical
        protocols: topProtocols,
        byChain,
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },

  healthCheck: async () => {
    const res = await fetch('https://api.llama.fi/protocols');
    return res.ok;
  },
};
```

#### `src/lib/providers/adapters/tvl/defi-pulse.ts` (Secondary/Fallback)

```typescript
// DeFi Pulse — https://defipulse.com/api
// Requires DEFIPULSE_API_KEY (free tier available)
// Endpoint: https://data-api.defipulse.com/api/v1/defipulse/api/GetProjects?api-key=KEY
// Covers ~100 protocols, good as cross-reference

export const defiPulseTvlProvider: DataProvider<GlobalTVL> = {
  name: 'defipulse-tvl',
  category: 'tvl',
  priority: 2,
  weight: 0.2,
  baseUrl: 'https://data-api.defipulse.com/api/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<GlobalTVL>> {
    const key = process.env.DEFIPULSE_API_KEY;
    if (!key) throw new Error('DEFIPULSE_API_KEY required');

    const response = await fetch(
      `${this.baseUrl}/defipulse/api/GetProjects?api-key=${key}`
    );
    const projects = await response.json();

    const protocols = projects.map((p: any) => ({
      protocol: p.name,
      chain: 'Ethereum', // DeFi Pulse is Ethereum-focused
      tvlUsd: parseFloat(p.value?.tvl?.USD || '0'),
      change24h: 0,
      change7d: 0,
      category: p.category || 'Unknown',
      chains: ['Ethereum'],
      timestamp: new Date().toISOString(),
    }));

    const totalTvl = protocols.reduce((sum: number, p: any) => sum + p.tvlUsd, 0);

    return {
      data: { totalTvl, change24h: 0, protocols, byChain: { Ethereum: totalTvl } },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/tvl/l2beat.ts` (Layer 2 Specialist)

```typescript
// L2Beat — Layer 2 TVL specialist
// Public API, no key needed
// Base URL: https://l2beat.com/api
// Great for L2-specific TVL data that DefiLlama may miss

export const l2beatTvlProvider: DataProvider<GlobalTVL> = {
  name: 'l2beat-tvl',
  category: 'tvl',
  priority: 3,
  weight: 0.2,
  baseUrl: 'https://l2beat.com/api',

  async fetch(params: FetchParams): Promise<ProviderResult<GlobalTVL>> {
    const response = await fetch(`${this.baseUrl}/tvl`);
    const data = await response.json();

    // L2Beat returns per-project TVL breakdown
    const protocols = Object.entries(data.projects || {}).map(([name, proj]: [string, any]) => ({
      protocol: name,
      chain: name,
      tvlUsd: proj.charts?.tvl?.at(-1)?.[1] || 0,
      change24h: 0,
      change7d: 0,
      category: 'Layer 2',
      chains: [name],
      timestamp: new Date().toISOString(),
    }));

    return {
      data: {
        totalTvl: protocols.reduce((sum, p) => sum + p.tvlUsd, 0),
        change24h: 0,
        protocols,
        byChain: Object.fromEntries(protocols.map(p => [p.protocol, p.tvlUsd])),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 2. Create DeFi Yields Adapters

Create adapters for `DataCategory = 'defi-yields'` in `src/lib/providers/adapters/defi-yields/`:

#### `src/lib/providers/adapters/defi-yields/defillama.ts`

```typescript
export interface YieldPoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  stablecoin: boolean;
  ilRisk: string;       // impermanent loss risk
  exposure: string;     // 'single' | 'multi'
}

export const defillamaYieldsProvider: DataProvider<YieldPoolData[]> = {
  name: 'defillama-yields',
  category: 'defi-yields',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://yields.llama.fi',

  async fetch(params: FetchParams): Promise<ProviderResult<YieldPoolData[]>> {
    const response = await fetch(`${this.baseUrl}/pools`);
    const data = await response.json();

    let pools = data.data || [];

    // Filter by chain if specified
    if (params.chain) {
      pools = pools.filter((p: any) =>
        p.chain?.toLowerCase() === params.chain!.toLowerCase()
      );
    }

    // Filter by minimum TVL (default $100K)
    const minTvl = params.minTvl || 100_000;
    pools = pools.filter((p: any) => p.tvlUsd >= minTvl);

    // Sort by APY descending
    pools.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));

    const yields: YieldPoolData[] = pools.slice(0, params.limit || 100).map((p: any) => ({
      pool: p.pool,
      chain: p.chain,
      project: p.project,
      symbol: p.symbol,
      tvlUsd: p.tvlUsd,
      apy: p.apy,
      apyBase: p.apyBase || 0,
      apyReward: p.apyReward || 0,
      stablecoin: p.stablecoin || false,
      ilRisk: p.ilRisk || 'unknown',
      exposure: p.exposure || 'unknown',
    }));

    return { data: yields, provider: this.name, timestamp: Date.now(), cached: false };
  },
};
```

#### `src/lib/providers/adapters/defi-yields/apy-vision.ts`

```typescript
// APY.vision — DeFi yield tracking specialist
// Requires APY_VISION_API_KEY (free tier: 100 req/day)
// Base URL: https://api.apy.vision/api/v1
// Great for LP position tracking and IL calculations

export const apyVisionYieldsProvider: DataProvider<YieldPoolData[]> = {
  name: 'apyvision-yields',
  category: 'defi-yields',
  priority: 2,
  weight: 0.25,
  baseUrl: 'https://api.apy.vision/api/v1',
  // Implementation similar to DefiLlama but with IL-specific data
};
```

### 3. New Sources to Add

#### Protocol-Specific Adapters for Deep Data

##### Aave/Compound Lending Rates (`src/lib/providers/adapters/defi-yields/aave.ts`)

```typescript
// Already have /api/onchain/aave/markets via The Graph
// Migrate to adapter pattern for circuit breaker protection
// Aave V3 subgraph: query { markets { inputToken, totalValueLockedUSD, rates { rate, side } } }
// Requires THEGRAPH_API_KEY

export const aaveLendingProvider: DataProvider<YieldPoolData[]> = {
  name: 'aave-lending',
  category: 'defi-yields',
  priority: 2,
  weight: 0.25,
  // Wraps existing The Graph query from src/lib/apis/thegraph.ts
};
```

##### Lido Staking APR (`src/lib/providers/adapters/defi-yields/lido.ts`)

```typescript
// Lido staking API — no key needed
// https://stake.lido.fi/api/sma-steth-apr — 7-day SMA of stETH APR
// https://eth-api.lido.fi/v1/protocol/steth/apr/sma — also available

export const lidoStakingProvider: DataProvider<YieldPoolData[]> = {
  name: 'lido-staking',
  category: 'defi-yields',
  priority: 3,
  weight: 0.15,
  baseUrl: 'https://eth-api.lido.fi/v1',
};
```

##### EigenLayer Restaking

```typescript
// EigenLayer restaking data
// https://app.eigenlayer.xyz/api/v1/tvl — TVL data
// https://app.eigenlayer.xyz/api/v1/avs — AVS list with rewards
// No API key needed (public)
```

### 4. Register Provider Chains

```typescript
// src/lib/providers/chains/defi.ts

export const tvlChain = createProviderChain('tvl', {
  providers: [defillamaTvlProvider, l2beatTvlProvider, defiPulseTvlProvider],
  strategy: 'consensus',    // cross-reference TVL numbers
  ttl: 300_000,            // 5min cache — TVL doesn't change fast
  retries: 2,
});

export const yieldsChain = createProviderChain('defi-yields', {
  providers: [defillamaYieldsProvider, aaveLendingProvider, lidoStakingProvider],
  strategy: 'broadcast',   // get yields from all sources
  ttl: 600_000,           // 10min cache
  retries: 2,
});
```

### 5. Migrate Existing Routes

Update `/api/defi/yields/route.ts`, `/api/defi/summary/route.ts`, etc. to use provider chains.

### Environment Variables

```bash
# Existing — no key needed for DefiLlama
THEGRAPH_API_KEY=           # Already used for Aave/Uniswap subgraphs

# New
DEFIPULSE_API_KEY=          # Free tier at defipulse.com (optional fallback)
APY_VISION_API_KEY=         # Free tier at apy.vision (optional, 100 req/day)
```

## Success Criteria

- [ ] 3 TVL adapters (DefiLlama primary, L2Beat L2-specialist, DeFi Pulse fallback)
- [ ] 3 DeFi yields adapters (DefiLlama, Aave lending, Lido staking)
- [ ] EigenLayer restaking data integrated
- [ ] Provider chains with `consensus` strategy for TVL cross-verification
- [ ] Existing `/api/defi/*` routes migrated to use chains
- [ ] DeFi protocol health route uses TVL chain data
- [ ] Unit tests for each adapter
- [ ] TVL data matches within 5% between sources (consensus validation)
