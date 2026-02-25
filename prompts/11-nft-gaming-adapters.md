# Prompt 11: NFT & Gaming Data Adapters

## Context

The codebase already has NFT routes:

**Existing NFT routes:**
- `/api/nft` → OpenSea + Reservoir combined — market overview + trending
- `/api/nft/market` → `NFTMarketOverview` (totalVolume24h, sales, topCollections)
- `/api/nft/collections/trending` → trending collections with rank, volume, trend score
- `/api/nft/collections/search` → collection search
- `/api/nft/collections/[slug]` → single collection details
- `/api/nft/collections/[slug]/stats` → floor prices, volumes
- `/api/nft/collections/[slug]/activity` → sales, bids, listings
- `/api/nft/sales/recent` → recent high-value sales

**API sources** (from `src/lib/apis/nft-markets.ts`):
- OpenSea: `https://api.opensea.io/api/v2` — **`OPENSEA_API_KEY`**
- Reservoir: `https://api.reservoir.tools` — **`RESERVOIR_API_KEY`**

**No gaming-specific routes exist yet.**

There is no `DataCategory` for NFTs yet — may need to extend the union type or use a new adapter pattern.

## Task

### 1. Extend DataCategory (Optional)

If needed, add to `src/lib/providers/types.ts`:

```typescript
export type DataCategory =
  | 'market-price'
  // ... existing categories ...
  | 'nft-market'     // NEW: NFT collection floor prices, volumes
  | 'gaming-data';   // NEW: blockchain gaming metrics
```

### 2. Create NFT Market Adapters

Create `src/lib/providers/adapters/nft-market/`:

#### `src/lib/providers/adapters/nft-market/opensea.ts` (Primary)

```typescript
export interface NFTMarketData {
  totalVolume24h: number;          // ETH
  totalVolumeUsd24h: number;       // USD
  totalSales24h: number;
  uniqueBuyers24h: number;
  uniqueSellers24h: number;
  topCollections: NFTCollectionSummary[];
  timestamp: string;
}

export interface NFTCollectionSummary {
  slug: string;
  name: string;
  floorPrice: number;              // ETH
  floorPriceUsd: number;
  volume24h: number;
  volumeChange24h: number;         // percentage
  salesCount24h: number;
  numOwners: number;
  totalSupply: number;
  chain: string;
}

export const openseaNftProvider: DataProvider<NFTMarketData> = {
  name: 'opensea-nft',
  category: 'nft-market',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://api.opensea.io/api/v2',

  async fetch(params: FetchParams): Promise<ProviderResult<NFTMarketData>> {
    const key = process.env.OPENSEA_API_KEY;
    if (!key) throw new Error('OPENSEA_API_KEY required');

    const headers = { 'X-API-KEY': key };

    // Fetch trending collections
    const response = await fetch(
      `${this.baseUrl}/collections?order_by=seven_day_volume&limit=${params.limit || 25}`,
      { headers }
    );
    const data = await response.json();

    const collections: NFTCollectionSummary[] = (data.collections || []).map((c: any) => ({
      slug: c.collection,
      name: c.name,
      floorPrice: c.payment_tokens?.[0]?.eth_price || 0,
      floorPriceUsd: 0, // compute using ETH price
      volume24h: 0,
      volumeChange24h: 0,
      salesCount24h: 0,
      numOwners: c.total_supply || 0,
      totalSupply: c.total_supply || 0,
      chain: 'ethereum',
    }));

    return {
      data: {
        totalVolume24h: 0,
        totalVolumeUsd24h: 0,
        totalSales24h: 0,
        uniqueBuyers24h: 0,
        uniqueSellers24h: 0,
        topCollections: collections,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/nft-market/reservoir.ts` (Secondary)

```typescript
// Reservoir — aggregated NFT data across marketplaces
// https://api.reservoir.tools/collections/v7?sortBy=1DayVolume
// Requires RESERVOIR_API_KEY (free tier: 120 req/min)
// Better volume/sales data than OpenSea API

export const reservoirNftProvider: DataProvider<NFTMarketData> = {
  name: 'reservoir-nft',
  category: 'nft-market',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://api.reservoir.tools',
};
```

#### `src/lib/providers/adapters/nft-market/simplehash.ts` (Multi-chain)

```typescript
// SimpleHash — multi-chain NFT data (ETH, Polygon, Solana, Base, Arbitrum, etc.)
// https://api.simplehash.com/api/v0/nfts/collections/trending
// Requires SIMPLEHASH_API_KEY (free tier: 1000 req/day)
// Unique value: best multi-chain coverage, especially Solana NFTs

export const simplehashNftProvider: DataProvider<NFTMarketData> = {
  name: 'simplehash-nft',
  category: 'nft-market',
  priority: 3,
  weight: 0.2,
  baseUrl: 'https://api.simplehash.com/api/v0',

  async fetch(params: FetchParams): Promise<ProviderResult<NFTMarketData>> {
    const key = process.env.SIMPLEHASH_API_KEY;
    if (!key) throw new Error('SIMPLEHASH_API_KEY required');

    const chain = params.chain || 'ethereum';
    const response = await fetch(
      `${this.baseUrl}/nfts/collections/trending?chains=${chain}&time_period=24h&limit=25`,
      { headers: { 'X-API-KEY': key } }
    );
    const data = await response.json();

    return {
      data: {
        totalVolume24h: 0,
        totalVolumeUsd24h: 0,
        totalSales24h: 0,
        uniqueBuyers24h: 0,
        uniqueSellers24h: 0,
        topCollections: (data.collections || []).map((c: any) => ({
          slug: c.collection_id,
          name: c.name,
          floorPrice: c.floor_prices?.[0]?.value || 0,
          floorPriceUsd: c.floor_prices?.[0]?.value_usd_cents / 100 || 0,
          volume24h: c.volume_24h || 0,
          volumeChange24h: c.volume_change || 0,
          salesCount24h: c.sales_24h || 0,
          numOwners: c.distinct_owner_count || 0,
          totalSupply: c.total_quantity || 0,
          chain: c.chain || chain,
        })),
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 3. Create Gaming Adapters

Create `src/lib/providers/adapters/gaming-data/`:

#### `src/lib/providers/adapters/gaming-data/dappradar.ts`

```typescript
// DappRadar — blockchain dApp and gaming analytics
// https://api.dappradar.com/4tsxo4vuhotaojtl/
// Requires DAPPRADAR_API_KEY (free tier available)
// Best for: gaming dApp rankings, user activity, transaction volumes

export interface GamingData {
  games: Array<{
    name: string;
    chain: string;
    dau: number;              // daily active users
    transactions24h: number;
    volume24h: number;        // USD
    balance: number;          // contract USD balance
    category: string;
  }>;
  totalDau: number;
  totalVolume24h: number;
  gamesCount: number;
  timestamp: string;
}

export const dappradarGamingProvider: DataProvider<GamingData> = {
  name: 'dappradar-gaming',
  category: 'gaming-data',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://api.dappradar.com/4tsxo4vuhotaojtl',

  async fetch(params: FetchParams): Promise<ProviderResult<GamingData>> {
    const key = process.env.DAPPRADAR_API_KEY;
    if (!key) throw new Error('DAPPRADAR_API_KEY required');

    const response = await fetch(
      `${this.baseUrl}/dapps?chain=all&category=games&sort=dau&order=desc&resultsPerPage=25`,
      { headers: { 'X-BLOBR-KEY': key } }
    );
    const data = await response.json();

    const games = (data.results || []).map((d: any) => ({
      name: d.name,
      chain: d.chains?.[0] || 'unknown',
      dau: d.activeUsers || 0,
      transactions24h: d.transactions || 0,
      volume24h: d.volume || 0,
      balance: d.balance || 0,
      category: d.category || 'game',
    }));

    return {
      data: {
        games,
        totalDau: games.reduce((sum: number, g: any) => sum + g.dau, 0),
        totalVolume24h: games.reduce((sum: number, g: any) => sum + g.volume24h, 0),
        gamesCount: games.length,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/gaming-data/footprint.ts`

```typescript
// Footprint Analytics — GameFi + NFT analytics
// https://api.footprint.network/api/v1
// Requires FOOTPRINT_API_KEY (free tier available)
// Specializes in: GameFi, token economics, chain-level gaming metrics

export const footprintGamingProvider: DataProvider<GamingData> = {
  name: 'footprint-gaming',
  category: 'gaming-data',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://api.footprint.network/api/v1',
};
```

### 4. New API Routes

Create new routes that use the provider chains:

```
/api/gaming                      → gaming overview (DappRadar + Footprint)
/api/gaming/top                  → top games by DAU
/api/gaming/chains               → gaming activity by chain
/api/nft/multi-chain             → cross-chain NFT data (SimpleHash)
/api/nft/blue-chips              → blue chip NFT index
```

### 5. Register Provider Chains

```typescript
// src/lib/providers/chains/nft-gaming.ts

export const nftMarketChain = createProviderChain('nft-market', {
  providers: [openseaNftProvider, reservoirNftProvider, simplehashNftProvider],
  strategy: 'broadcast',         // get data from all marketplaces
  ttl: 120_000,                 // 2min cache
});

export const gamingDataChain = createProviderChain('gaming-data', {
  providers: [dappradarGamingProvider, footprintGamingProvider],
  strategy: 'fallback',
  ttl: 300_000,                 // 5min cache
});
```

### Environment Variables

```bash
# Existing
OPENSEA_API_KEY=                # OpenSea API (free tier at opensea.io/developers)
RESERVOIR_API_KEY=              # Reservoir (free tier at reservoir.tools, 120 req/min)

# New — sign up for these
SIMPLEHASH_API_KEY=             # Multi-chain NFT data (free tier at simplehash.com, 1000 req/day)
DAPPRADAR_API_KEY=              # Gaming/dApp analytics (free tier at dappradar.com/dashboard/developers)
FOOTPRINT_API_KEY=              # GameFi analytics (free tier at footprint.network)
```

## Success Criteria

- [ ] 3 NFT market adapters (OpenSea, Reservoir, SimpleHash)
- [ ] 2 gaming adapters (DappRadar, Footprint)
- [ ] DataCategory extended with `nft-market` and `gaming-data`
- [ ] Existing `/api/nft/*` routes migrated to use provider chain
- [ ] New `/api/gaming/*` routes created
- [ ] Multi-chain NFT support (ETH, Solana, Polygon, Base)
- [ ] Blue-chip NFT index derived from top collections
- [ ] Unit tests for each adapter
- [ ] Floor price consensus across 3 sources
