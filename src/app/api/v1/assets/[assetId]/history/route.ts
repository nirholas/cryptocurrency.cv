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
import { getAssetHistory, type AssetHistoryInterval } from '@/lib/external-apis';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/v1/assets/[assetId]/history
 *
 * Get price history for a specific asset from keyless sources (DefiLlama).
 *
 * Query parameters:
 * - interval: Time interval (m1, m5, m15, m30, h1, h2, h6, h12, d1)
 *
 * @example
 * GET /api/v1/assets/bitcoin/history              # Hourly history
 * GET /api/v1/assets/bitcoin/history?interval=d1  # Daily history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const startTime = Date.now();
  const { assetId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const interval = (searchParams.get('interval') || 'h1') as AssetHistoryInterval;

  try {
    logger.info({ assetId, interval }, 'Fetching asset history');

    const history = await getAssetHistory(assetId, interval);

    // Transform to standard format
    const data = history.map((point) => ({
      timestamp: point.time,
      date: point.date,
      price: point.priceUsd,
    }));

    logger.info({ assetId, dataPoints: data.length, duration: Date.now() - startTime }, 'Asset history fetched successfully');

    return NextResponse.json(
      {
        assetId,
        interval,
        data,
        total: data.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : undefined, assetId, interval }, 'Failed to fetch asset history');
    return ApiError.internal('Failed to fetch asset history', error);
  }
}
