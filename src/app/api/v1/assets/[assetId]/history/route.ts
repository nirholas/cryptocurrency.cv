import { NextRequest, NextResponse } from 'next/server';
import { getCoinCapHistory } from '@/lib/external-apis';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/v1/assets/[assetId]/history
 *
 * Get price history for a specific asset from CoinCap.
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
  const interval = (searchParams.get('interval') || 'h1') as
    | 'm1'
    | 'm5'
    | 'm15'
    | 'm30'
    | 'h1'
    | 'h2'
    | 'h6'
    | 'h12'
    | 'd1';

  try {
    logger.info('Fetching asset history', { assetId, interval });

    const history = await getCoinCapHistory(assetId, interval);

    // Transform to standard format
    const data = history.map((point) => ({
      timestamp: point.time,
      date: point.date,
      price: parseFloat(point.priceUsd),
    }));

    logger.info('Asset history fetched successfully', { assetId, dataPoints: data.length, duration: Date.now() - startTime });

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
    logger.error('Failed to fetch asset history', error, { assetId, interval });
    return ApiError.internal('Failed to fetch asset history', error);
  }
}
