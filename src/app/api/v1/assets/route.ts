/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAggregatedAssets, getCoinCapAsset } from '@/lib/external-apis';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/v1/assets
 *
 * Get aggregated cryptocurrency assets from multiple free sources.
 * Data is normalized and combined from CoinCap, CoinPaprika, and CoinLore.
 *
 * Query parameters:
 * - limit: Number of assets to return (default: 100, max: 250)
 * - id: Specific asset ID to fetch (returns single asset)
 *
 * @example
 * GET /api/v1/assets               # Top 100 assets
 * GET /api/v1/assets?limit=50      # Top 50 assets
 * GET /api/v1/assets?id=bitcoin    # Single asset
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 250);

  try {
    if (id) {
      logger.info({ id }, 'Fetching single asset');

      // Fetch single asset
      const asset = await getCoinCapAsset(id);

      logger.info({ id, duration: Date.now() - startTime }, 'Asset fetched successfully');

      return NextResponse.json(
        {
          data: {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            rank: parseInt(asset.rank, 10),
            price: parseFloat(asset.priceUsd),
            marketCap: parseFloat(asset.marketCapUsd),
            volume24h: parseFloat(asset.volumeUsd24Hr),
            change24h: parseFloat(asset.changePercent24Hr),
            supply: parseFloat(asset.supply),
            maxSupply: asset.maxSupply ? parseFloat(asset.maxSupply) : null,
            vwap24h: parseFloat(asset.vwap24Hr),
            explorer: asset.explorer,
          },
          source: 'coincap',
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    logger.info({ limit }, 'Fetching aggregated assets');

    // Fetch aggregated assets
    const assets = await getAggregatedAssets(limit);

    logger.info({ count: assets.length, duration: Date.now() - startTime }, 'Assets fetched successfully');

    return NextResponse.json(
      {
        data: assets,
        total: assets.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : undefined, id, limit }, 'Failed to fetch assets');
    return ApiError.internal('Failed to fetch assets', error);
  }
}
