# Prompt 09: On-Chain Data Adapters

## Context

The codebase has on-chain routes calling multiple external APIs:

**Existing on-chain routes and their sources:**

| Route | Source | API Key |
|---|---|---|
| `/api/onchain/metrics` | Glassnode (`https://api.glassnode.com/v1`) | `GLASSNODE_API_KEY` (paid) |
| `/api/onchain/exchange-flows` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/whale-metrics` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/miner-metrics` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/lth-metrics` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/funding-metrics` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/health` | Glassnode | `GLASSNODE_API_KEY` |
| `/api/onchain/aave/markets` | The Graph (Aave V3) | `THEGRAPH_API_KEY` |
| `/api/onchain/uniswap/pools` | The Graph (Uniswap V3) | `THEGRAPH_API_KEY` |
| `/api/onchain/curve/pools` | The Graph (Curve) | `THEGRAPH_API_KEY` |
| `/api/onchain/cross-protocol` | The Graph (combined) | `THEGRAPH_API_KEY` |
| `/api/onchain/events` | AI + news (Groq) | `GROQ_API_KEY` |

**Glassnode API base:** `https://api.glassnode.com/v1` (in `src/lib/apis/glassnode.ts`)
**The Graph base:** `https://gateway.thegraph.com/api` (in `src/lib/apis/thegraph.ts`)

**Provider framework categories needing adapters:**
- `on-chain` — no adapters
- `mempool` — no adapters
- `gas-fees` — no adapters
- `whale-alerts` — no adapters

## Task

### 1. Create On-Chain Metric Adapters

Create `src/lib/providers/adapters/on-chain/`:

#### `src/lib/providers/adapters/on-chain/glassnode.ts` (Primary)

```typescript
export interface OnChainMetrics {
  asset: string;
  mvrv: number;
  mvrvZScore: number;
  sopr: number;
  nvt: number;
  activeAddresses: number;
  transactionCount: number;
  realizedPrice: number;
  supplyInProfit: number;
  timestamp: string;
}

export const glassnodeOnChainProvider: DataProvider<OnChainMetrics> = {
  name: 'glassnode-onchain',
  category: 'on-chain',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://api.glassnode.com/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<OnChainMetrics>> {
    const key = process.env.GLASSNODE_API_KEY;
    if (!key) throw new Error('GLASSNODE_API_KEY required');

    const asset = params.symbol?.toLowerCase() || 'btc';
    const headers = { 'X-Api-Key': key };

    // Parallel fetch key metrics
    const [mvrv, sopr, nvt, addresses] = await Promise.all([
      fetch(`${this.baseUrl}/metrics/market/mvrv?a=${asset}&api_key=${key}`).then(r => r.json()),
      fetch(`${this.baseUrl}/metrics/indicators/sopr?a=${asset}&api_key=${key}`).then(r => r.json()),
      fetch(`${this.baseUrl}/metrics/indicators/nvt?a=${asset}&api_key=${key}`).then(r => r.json()),
      fetch(`${this.baseUrl}/metrics/addresses/active_count?a=${asset}&api_key=${key}`).then(r => r.json()),
    ]);

    return {
      data: {
        asset,
        mvrv: mvrv[mvrv.length - 1]?.v || 0,
        mvrvZScore: 0, // compute from mvrv series
        sopr: sopr[sopr.length - 1]?.v || 0,
        nvt: nvt[nvt.length - 1]?.v || 0,
        activeAddresses: addresses[addresses.length - 1]?.v || 0,
        transactionCount: 0,
        realizedPrice: 0,
        supplyInProfit: 0,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/on-chain/cryptoquant.ts` (Secondary)

```typescript
// CryptoQuant — on-chain analytics (Glassnode competitor)
// Base URL: https://api.cryptoquant.com/v1
// Requires CRYPTOQUANT_API_KEY (free tier: limited metrics)
// Metrics: exchange_flows, miners, network, market

export const cryptoquantOnChainProvider: DataProvider<OnChainMetrics> = {
  name: 'cryptoquant-onchain',
  category: 'on-chain',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://api.cryptoquant.com/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<OnChainMetrics>> {
    const key = process.env.CRYPTOQUANT_API_KEY;
    if (!key) throw new Error('CRYPTOQUANT_API_KEY required');

    const asset = params.symbol?.toLowerCase() || 'btc';

    // CryptoQuant endpoints:
    // GET /btc/network-data/active-addresses?window=day
    // GET /btc/market-data/mvrv?window=day
    // GET /btc/exchange-flows/netflow?window=hour

    const [mvrv, activeAddr] = await Promise.all([
      fetch(`${this.baseUrl}/${asset}/market-data/mvrv`, {
        headers: { Authorization: `Bearer ${key}` },
      }).then(r => r.json()),
      fetch(`${this.baseUrl}/${asset}/network-data/active-addresses`, {
        headers: { Authorization: `Bearer ${key}` },
      }).then(r => r.json()),
    ]);

    return {
      data: {
        asset,
        mvrv: mvrv.result?.data?.at(-1)?.value || 0,
        mvrvZScore: 0,
        sopr: 0,
        nvt: 0,
        activeAddresses: activeAddr.result?.data?.at(-1)?.value || 0,
        transactionCount: 0,
        realizedPrice: 0,
        supplyInProfit: 0,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/on-chain/blockchain-com.ts` (Free Fallback)

```typescript
// Blockchain.com — free, no API key
// Base URL: https://api.blockchain.info
// Limited to Bitcoin but fully free
// GET /charts/n-transactions?timespan=30days&format=json
// GET /charts/estimated-transaction-volume-usd?format=json
// GET /charts/hash-rate?format=json
// GET /charts/n-unique-addresses?format=json

export const blockchainComProvider: DataProvider<OnChainMetrics> = {
  name: 'blockchain-com',
  category: 'on-chain',
  priority: 3,
  weight: 0.2,
  baseUrl: 'https://api.blockchain.info',

  async fetch(params: FetchParams): Promise<ProviderResult<OnChainMetrics>> {
    // Only supports BTC
    if (params.symbol && params.symbol.toLowerCase() !== 'btc') {
      throw new Error('blockchain.com only supports BTC');
    }

    const [txCount, addresses, hashRate] = await Promise.all([
      fetch(`${this.baseUrl}/charts/n-transactions?timespan=1days&format=json`).then(r => r.json()),
      fetch(`${this.baseUrl}/charts/n-unique-addresses?timespan=1days&format=json`).then(r => r.json()),
      fetch(`${this.baseUrl}/charts/hash-rate?timespan=1days&format=json`).then(r => r.json()),
    ]);

    return {
      data: {
        asset: 'btc',
        mvrv: 0,
        mvrvZScore: 0,
        sopr: 0,
        nvt: 0,
        activeAddresses: addresses.values?.at(-1)?.y || 0,
        transactionCount: txCount.values?.at(-1)?.y || 0,
        realizedPrice: 0,
        supplyInProfit: 0,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 2. Create Gas Fee Adapters

Create `src/lib/providers/adapters/gas-fees/`:

#### `src/lib/providers/adapters/gas-fees/etherscan.ts`

```typescript
export interface GasFeeData {
  chain: string;
  baseFee: number;          // gwei
  priorityFee: number;      // gwei
  gasPrice: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  timestamp: string;
}

// Etherscan — https://api.etherscan.io/api?module=gastracker&action=gasoracle
// Requires ETHERSCAN_API_KEY (free tier: 5 req/s)
export const etherscanGasProvider: DataProvider<GasFeeData> = {
  name: 'etherscan-gas',
  category: 'gas-fees',
  priority: 1,
  weight: 0.4,
  baseUrl: 'https://api.etherscan.io/api',
};
```

#### `src/lib/providers/adapters/gas-fees/blocknative.ts`

```typescript
// Blocknative Gas Estimator — very accurate EIP-1559 predictions
// https://api.blocknative.com/gasprices/blockprices
// Requires BLOCKNATIVE_API_KEY (free tier: 1000 req/day)
export const blocknativeGasProvider: DataProvider<GasFeeData> = {
  name: 'blocknative-gas',
  category: 'gas-fees',
  priority: 2,
  weight: 0.4,
};
```

#### `src/lib/providers/adapters/gas-fees/owlracle.ts`

```typescript
// Owlracle — multi-chain gas tracker (ETH, BSC, Polygon, Avalanche, etc.)
// https://api.owlracle.info/v4/{chain}/gas
// Free tier: 300 req/month, no key needed for limited usage
export const owlracleGasProvider: DataProvider<GasFeeData> = {
  name: 'owlracle-gas',
  category: 'gas-fees',
  priority: 3,
  weight: 0.2,
};
```

### 3. Create Mempool Adapters

Create `src/lib/providers/adapters/mempool/`:

#### `src/lib/providers/adapters/mempool/mempool-space.ts`

```typescript
export interface MempoolData {
  chain: string;
  pendingTxCount: number;
  pendingSize: number;       // bytes
  feeHistogram: Array<{ fee: number; count: number }>;
  fastestFee: number;        // sat/vB
  halfHourFee: number;
  hourFee: number;
  minimumFee: number;
  timestamp: string;
}

// Mempool.space — Bitcoin mempool data, fully free, no key
// https://mempool.space/api/mempool
// https://mempool.space/api/v1/fees/recommended
export const mempoolSpaceProvider: DataProvider<MempoolData> = {
  name: 'mempool-space',
  category: 'mempool',
  priority: 1,
  weight: 0.6,
  baseUrl: 'https://mempool.space/api',

  async fetch(): Promise<ProviderResult<MempoolData>> {
    const [mempool, fees] = await Promise.all([
      fetch(`${this.baseUrl}/mempool`).then(r => r.json()),
      fetch(`${this.baseUrl}/v1/fees/recommended`).then(r => r.json()),
    ]);

    return {
      data: {
        chain: 'bitcoin',
        pendingTxCount: mempool.count,
        pendingSize: mempool.vsize,
        feeHistogram: mempool.fee_histogram || [],
        fastestFee: fees.fastestFee,
        halfHourFee: fees.halfHourFee,
        hourFee: fees.hourFee,
        minimumFee: fees.minimumFee,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 4. Create Whale Alert Adapters

Create `src/lib/providers/adapters/whale-alerts/`:

#### `src/lib/providers/adapters/whale-alerts/whale-alert.ts`

```typescript
export interface WhaleAlertData {
  transactions: Array<{
    blockchain: string;
    symbol: string;
    from: { owner: string; ownerType: string };
    to: { owner: string; ownerType: string };
    amount: number;
    amountUsd: number;
    hash: string;
    timestamp: string;
  }>;
  totalValueUsd: number;
  count: number;
}

// Whale Alert — https://api.whale-alert.io/v1/transactions
// Requires WHALE_ALERT_API_KEY (free tier: 10 req/min)
export const whaleAlertProvider: DataProvider<WhaleAlertData> = {
  name: 'whale-alert',
  category: 'whale-alerts',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://api.whale-alert.io/v1',
};
```

#### `src/lib/providers/adapters/whale-alerts/arkham.ts`

```typescript
// Arkham Intelligence — labeled entity tracking
// https://api.arkhamintelligence.com/intelligence/address/{address}
// Requires ARKHAM_API_KEY (apply for access)
// Great for: entity labeling, flow analysis, counterparty discovery
export const arkhamWhaleProvider: DataProvider<WhaleAlertData> = {
  name: 'arkham-whales',
  category: 'whale-alerts',
  priority: 2,
  weight: 0.3,
};
```

#### `src/lib/providers/adapters/whale-alerts/etherscan-whales.ts`

```typescript
// Etherscan whale tracking — use token transfer API
// https://api.etherscan.io/api?module=account&action=tokentx&sort=desc
// Filter for large transfers (> $1M)
// Requires ETHERSCAN_API_KEY (same key as gas)
export const etherscanWhaleProvider: DataProvider<WhaleAlertData> = {
  name: 'etherscan-whales',
  category: 'whale-alerts',
  priority: 3,
  weight: 0.2,
};
```

### 5. Register Provider Chains

```typescript
// src/lib/providers/chains/onchain.ts

export const onChainChain = createProviderChain('on-chain', {
  providers: [glassnodeOnChainProvider, cryptoquantOnChainProvider, blockchainComProvider],
  strategy: 'consensus',       // cross-reference metrics
  ttl: 300_000,               // 5min cache
});

export const gasFeesChain = createProviderChain('gas-fees', {
  providers: [etherscanGasProvider, blocknativeGasProvider, owlracleGasProvider],
  strategy: 'consensus',       // median gas price
  ttl: 15_000,                // 15s cache — gas changes fast
});

export const mempoolChain = createProviderChain('mempool', {
  providers: [mempoolSpaceProvider],
  strategy: 'fallback',
  ttl: 30_000,
});

export const whaleAlertsChain = createProviderChain('whale-alerts', {
  providers: [whaleAlertProvider, arkhamWhaleProvider, etherscanWhaleProvider],
  strategy: 'broadcast',       // get all whale data
  ttl: 60_000,
});
```

### Environment Variables

```bash
# Existing
GLASSNODE_API_KEY=            # On-chain metrics (paid, ~$29/mo for standard)
THEGRAPH_API_KEY=             # Subgraph queries (free tier available)
ETHERSCAN_API_KEY=            # Gas + whale tracking (free, 5 req/s)

# New — sign up for these
CRYPTOQUANT_API_KEY=          # On-chain analytics (free tier: limited metrics) — cryptoquant.com
BLOCKNATIVE_API_KEY=          # Gas estimation (free tier: 1000 req/day) — blocknative.com
WHALE_ALERT_API_KEY=          # Whale transactions (free tier: 10 req/min) — whale-alert.io
ARKHAM_API_KEY=               # Entity intelligence (apply at arkhamintelligence.com)
```

## Success Criteria

- [ ] 3 on-chain metric adapters (Glassnode, CryptoQuant, Blockchain.com)
- [ ] 3 gas fee adapters (Etherscan, Blocknative, Owlracle)
- [ ] 1 mempool adapter (Mempool.space) — BTC mempool data
- [ ] 3 whale alert adapters (Whale Alert, Arkham, Etherscan)
- [ ] All 4 provider chains registered and functioning
- [ ] Existing `/api/onchain/*` routes migrated to use chains
- [ ] Circuit breakers protect paid API calls (Glassnode, Whale Alert)
- [ ] Free fallbacks serve data when paid APIs are unavailable
- [ ] Gas fee consensus produces median price from 3 sources
- [ ] Unit tests for each adapter with mocked responses
