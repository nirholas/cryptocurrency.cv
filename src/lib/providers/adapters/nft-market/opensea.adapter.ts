/**
 * OpenSea Adapter — Primary NFT market data provider
 *
 * OpenSea is the largest NFT marketplace:
 * - Comprehensive collection metadata
 * - Real-time floor prices and volume
 * - Requires API key (free tier available)
 * - Rate limit: 4 requests/second
 *
 * @module providers/adapters/nft-market/opensea
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { NFTMarketOverview, NFTCollectionSummary } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const OPENSEA_BASE = 'https://api.opensea.io/api/v2';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 4,
  windowMs: 1_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * OpenSea NFT market data provider.
 *
 * Priority: 1 (primary — largest marketplace, most comprehensive data)
 * Weight: 0.5 (highest — authoritative floor prices and volume)
 */
export const openseaAdapter: DataProvider<NFTMarketOverview> = {
  name: 'opensea',
  description: 'OpenSea API — largest NFT marketplace with comprehensive collection data',
  priority: 1,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['nft-market'],

  async fetch(params: FetchParams): Promise<NFTMarketOverview> {
    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) {
      throw new Error('OPENSEA_API_KEY environment variable is required');
    }

    const limit = params.limit ?? 25;
    const chain = params.chain ?? 'ethereum';

    const response = await fetch(
      `${OPENSEA_BASE}/collections?chain=${chain}&order_by=seven_day_volume&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenSeaCollectionsResponse = await response.json();
    const collections = (data.collections ?? []).map(normalizeCollection);

    const totalVolume24h = collections.reduce((sum, c) => sum + c.volume24h, 0);
    const totalSales24h = collections.reduce((sum, c) => sum + c.salesCount24h, 0);

    return {
      totalVolume24h,
      totalVolumeUsd24h: totalVolume24h,
      totalSales24h,
      uniqueBuyers24h: 0,   // Not available from this endpoint
      uniqueSellers24h: 0,  // Not available from this endpoint
      topCollections: collections,
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch(`${OPENSEA_BASE}/collections?limit=1`, {
        headers: { 'X-API-KEY': apiKey },
        signal: AbortSignal.timeout(5_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: NFTMarketOverview): boolean {
    if (!data || !Array.isArray(data.topCollections)) return false;
    if (data.topCollections.length === 0) return false;
    return data.topCollections.every(
      (c) => typeof c.name === 'string' && c.name.length > 0,
    );
  },
};

// =============================================================================
// INTERNAL — Raw types and normalization
// =============================================================================

interface OpenSeaCollection {
  collection: string;
  name: string;
  description?: string;
  image_url?: string;
  owner?: string;
  safelist_status?: string;
  category?: string;
  is_disabled?: boolean;
  is_nsfw?: boolean;
  trait_offers_enabled?: boolean;
  opensea_url?: string;
  contracts?: Array<{ address: string; chain: string }>;
  stats?: {
    floor_price?: number;
    floor_price_symbol?: string;
    total_volume?: number;
    one_day_volume?: number;
    one_day_change?: number;
    one_day_sales?: number;
    seven_day_volume?: number;
    num_owners?: number;
    total_supply?: number;
  };
}

interface OpenSeaCollectionsResponse {
  collections: OpenSeaCollection[];
  next?: string;
}

function normalizeCollection(raw: OpenSeaCollection): NFTCollectionSummary {
  const stats = raw.stats ?? {};
  const chain = raw.contracts?.[0]?.chain ?? 'ethereum';

  return {
    slug: raw.collection ?? '',
    name: raw.name ?? '',
    floorPrice: stats.floor_price ?? 0,
    floorPriceUsd: stats.floor_price ?? 0, // OpenSea reports in native token
    volume24h: stats.one_day_volume ?? 0,
    volumeChange24h: stats.one_day_change ?? 0,
    salesCount24h: stats.one_day_sales ?? 0,
    numOwners: stats.num_owners ?? 0,
    totalSupply: stats.total_supply ?? 0,
    chain,
    imageUrl: raw.image_url ?? undefined,
  };
}
