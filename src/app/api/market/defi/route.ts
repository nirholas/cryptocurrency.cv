import { NextRequest, NextResponse } from 'next/server';
import { getGlobalDeFiData } from '@/lib/market-data';
import { ApiError, type ApiErrorResponse } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import type { GlobalDeFi } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/defi
 * 
 * Get global DeFi market statistics
 * 
 * @example
 * GET /api/market/defi
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Fetching global DeFi data');
    const data = await getGlobalDeFiData();
    
    if (!data) {
      logger.error('No DeFi data available');
      return ApiError.internal('No DeFi data available');
    }
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch DeFi data', error);
    return ApiError.internal('Failed to fetch DeFi data', error);
  }
}
