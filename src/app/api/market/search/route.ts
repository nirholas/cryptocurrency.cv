import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, SearchResult } from '@/lib/market-data';
import { ApiError, type ApiErrorResponse } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/search
 * 
 * Search for coins, exchanges, and categories
 * 
 * Query parameters:
 * - q: Search query (required, min 2 characters)
 * 
 * @example
 * GET /api/market/search?q=bitcoin
 * GET /api/market/search?q=defi
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    logger.error('Invalid search query', { query });
    return ApiError.badRequest('Search query must be at least 2 characters');
  }
  
  try {
    logger.info('Searching coins', { query });
    const data = await searchCoins(query);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Search failed', error);
    return ApiError.internal('Search failed', error);
  }
}
