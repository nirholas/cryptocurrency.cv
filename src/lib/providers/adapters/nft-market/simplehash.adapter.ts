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
 * SimpleHash Adapter — Multi-chain NFT data provider
 *
 * SimpleHash provides the best multi-chain NFT coverage:
 * - Supports 50+ chains (Ethereum, Polygon, Solana, Bitcoin Ordinals, etc.)
 * - Comprehensive metadata and ownership data
 * - Requires API key (free tier: 1,000 requests/day)
 * - Rate limit: ~0.7 requests/minute (1,000/day)
 *
 * @module providers/adapters/nft-market/simplehash
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { NFTMarketOverview, NFTCollectionSummary } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const SIMPLEHASH_BASE = 'https://api.simplehash.com/api/v0';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 1,
  windowMs: 86_400, // ~0.7/min → effectively 1 per ~86s (1000/day)
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * SimpleHash NFT data provider.
 *
 * Priority: 3 (tertiary — best multi-chain coverage, lower rate limit)
 * Weight: 0.2 (supplementary — great breadth, lower freshness due to rate limits)
 */
export const simplehashAdapter: DataProvider<NFTMarketOverview> = {
  name: 'simplehash',
  description: 'SimpleHash API — multi-chain NFT data with 50+ chain support',
  priority: 3,
  weight: 0.2,
  rateLimit: RATE_LIMIT,
  capabilities: ['nft-market'],

  async fetch(params: FetchParams): Promise<NFTMarketOverview> {
    const apiKey = process.env.SIMPLEHASH_API_KEY;
    if (!apiKey) {
      throw new Error('SIMPLEHASH_API_KEY environment variable is not configured');
    }

    const limit = params.limit ?? 25;
    const chains = params.chain ?? 'ethereum';
    const timePeriod = params.extra?.timePeriod ?? '24h';

    const response = await fetch(
      `${SIMPLEHASH_BASE}/nfts/collections/trending?chains=${chains}&time_period=${timePeriod}&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`SimpleHash API error: ${response.status} ${response.statusText}`);
    }

    const data: SimpleHashTrendingResponse = await response.json();
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
    const apiKey = process.env.SIMPLEHASH_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch(
        `${SIMPLEHASH_BASE}/nfts/collections/trending?chains=ethereum&limit=1`,
        {
          headers: { 'X-API-KEY': apiKey },
          signal: AbortSignal.timeout(5_000),
        },
      );
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

interface SimpleHashCollection {
  collection_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  banner_image_url?: string;
  external_url?: string;
  chain?: string;
  floor_prices?: Array<{
    marketplace_id?: string;
    value?: number;
    payment_token?: {
      symbol?: string;
      decimals?: number;
    };
    value_usd_cents?: number;
  }>;
  top_contracts?: string[];
  distinct_owner_count?: number;
  distinct_nft_count?: number;
  total_quantity?: number;
  volume?: number;
  volume_usd_cents?: number;
  volume_percent_change?: number;
  transaction_count?: number;
}

interface SimpleHashTrendingResponse {
  collections: SimpleHashCollection[];
  next_cursor?: string;
  next?: string;
}

function normalizeCollection(raw: SimpleHashCollection): NFTCollectionSummary {
  const floorEntry = raw.floor_prices?.[0];
  const floorPrice = floorEntry?.value ?? 0;
  const floorPriceUsd = floorEntry?.value_usd_cents
    ? floorEntry.value_usd_cents / 100
    : 0;

  return {
    slug: raw.collection_id ?? '',
    name: raw.name ?? '',
    floorPrice,
    floorPriceUsd,
    volume24h: raw.volume_usd_cents ? raw.volume_usd_cents / 100 : (raw.volume ?? 0),
    volumeChange24h: raw.volume_percent_change ?? 0,
    salesCount24h: raw.transaction_count ?? 0,
    numOwners: raw.distinct_owner_count ?? 0,
    totalSupply: raw.distinct_nft_count ?? raw.total_quantity ?? 0,
    chain: raw.chain ?? 'ethereum',
    imageUrl: raw.image_url ?? undefined,
  };
}
