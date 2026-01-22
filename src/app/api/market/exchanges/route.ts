import { NextRequest, NextResponse } from 'next/server';
import { getExchanges, Exchange } from '@/lib/market-data';

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
): Promise<NextResponse<Exchange[] | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  
  // Parse pagination parameters
  const perPage = Math.min(
    parseInt(searchParams.get('per_page') || '100', 10),
    250
  );
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  if (isNaN(perPage) || perPage < 1) {
    return NextResponse.json(
      { error: 'Invalid per_page parameter', message: 'per_page must be a positive number' },
      { status: 400 }
    );
  }
  
  if (isNaN(page) || page < 1) {
    return NextResponse.json(
      { error: 'Invalid page parameter', message: 'Page must be a positive number' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getExchanges(perPage, page);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in exchanges route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchanges', message: String(error) },
      { status: 500 }
    );
  }
}
