import { NextRequest, NextResponse } from 'next/server';
import { getExchanges, Exchange } from '@/lib/market-data';
import { ApiError, type ApiErrorResponse } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/market/exchanges
 * 
 * Get list of all cryptocurrency exchanges
 * 
 * Query parameters:
 * - per_page: Number of exchanges per page (default: 100, max: 250)
 * - page: Page number (default: 1)
 * 
 * @example
 * GET /api/market/exchanges
 * GET /api/market/exchanges?per_page=50&page=2
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Parse pagination parameters
  const perPage = Math.min(
    parseInt(searchParams.get('per_page') || '100', 10),
    250
  );
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  if (isNaN(perPage) || perPage < 1) {
    logger.error('Invalid per_page parameter', { perPage: searchParams.get('per_page') });
    return ApiError.badRequest('per_page must be a positive number');
  }
  
  if (isNaN(page) || page < 1) {
    logger.error('Invalid page parameter', { page: searchParams.get('page') });
    return ApiError.badRequest('Page must be a positive number');
  }
  
  try {
    logger.info('Fetching exchanges', { perPage, page });
    const data = await getExchanges(perPage, page);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch exchanges', error);
    return ApiError.internal('Failed to fetch exchanges', error);
  }
}
