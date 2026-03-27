/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Reservoir Adapter — Aggregated NFT market data provider
 *
 * Reservoir is a decentralized NFT order aggregator:
 * - Aggregates orders across marketplaces (OpenSea, Blur, X2Y2, etc.)
 * - Superior volume and liquidity data
 * - Requires API key (free tier available)
 * - Rate limit: 120 requests/minute
 *
 * @module providers/adapters/nft-market/reservoir
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { NFTMarketOverview, NFTCollectionSummary } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const RESERVOIR_BASE = 'https://api.reservoir.tools';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * Reservoir NFT data provider.
 *
 * Priority: 2 (secondary — better aggregated volume data than single marketplace)
 * Weight: 0.3 (good cross-marketplace aggregation)
 */
export const reservoirAdapter: DataProvider<NFTMarketOverview> = {
  name: 'reservoir',
  description: 'Reservoir API — aggregated NFT data across multiple marketplaces',
  priority: 2,
  weight: 0.3,
  rateLimit: RATE_LIMIT,
  capabilities: ['nft-market'],

  async fetch(params: FetchParams): Promise<NFTMarketOverview> {
    const apiKey = process.env.RESERVOIR_API_KEY;
    if (!apiKey) {
      throw new Error('RESERVOIR_API_KEY environment variable is not configured');
    }

    const limit = params.limit ?? 25;

    const response = await fetch(
      `${RESERVOIR_BASE}/collections/v7?sortBy=1DayVolume&limit=${limit}`,
      {
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
    }

    const data: ReservoirCollectionsResponse = await response.json();
    const collections = (data.collections ?? []).map(normalizeCollection);

    const totalVolume24h = collections.reduce((sum, c) => sum + c.volume24h, 0);
    const totalSales24h = collections.reduce((sum, c) => sum + c.salesCount24h, 0);

    return {
      totalVolume24h,
      totalVolumeUsd24h: totalVolume24h,
      totalSales24h,
      uniqueBuyers24h: 0,
      uniqueSellers24h: 0,
      topCollections: collections,
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    const apiKey = process.env.RESERVOIR_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch(`${RESERVOIR_BASE}/collections/v7?limit=1`, {
        headers: { 'x-api-key': apiKey },
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

interface ReservoirCollection {
  id?: string;
  slug?: string;
  name?: string;
  image?: string;
  floorAsk?: {
    price?: {
      amount?: { native?: number; usd?: number };
      currency?: { symbol?: string };
    };
  };
  volume?: {
    '1day'?: number;
    '7day'?: number;
    '30day'?: number;
    allTime?: number;
  };
  volumeChange?: {
    '1day'?: number;
    '7day'?: number;
  };
  count?: number;
  ownerCount?: number;
  onSaleCount?: number;
  salesCount?: {
    '1day'?: number;
    '7day'?: number;
  };
  primaryContract?: string;
  chainId?: number;
}

interface ReservoirCollectionsResponse {
  collections: ReservoirCollection[];
  continuation?: string;
}

/** Map chain IDs to chain names */
const CHAIN_ID_MAP: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  56: 'bsc',
  43114: 'avalanche',
};

function normalizeCollection(raw: ReservoirCollection): NFTCollectionSummary {
  const floorNative = raw.floorAsk?.price?.amount?.native ?? 0;
  const floorUsd = raw.floorAsk?.price?.amount?.usd ?? 0;
  const chain = raw.chainId ? (CHAIN_ID_MAP[raw.chainId] ?? `chain-${raw.chainId}`) : 'ethereum';

  return {
    slug: raw.slug ?? raw.id ?? '',
    name: raw.name ?? '',
    floorPrice: floorNative,
    floorPriceUsd: floorUsd,
    volume24h: raw.volume?.['1day'] ?? 0,
    volumeChange24h: raw.volumeChange?.['1day'] ?? 0,
    salesCount24h: raw.salesCount?.['1day'] ?? 0,
    numOwners: raw.ownerCount ?? 0,
    totalSupply: raw.count ?? 0,
    chain,
    imageUrl: raw.image ?? undefined,
  };
}
