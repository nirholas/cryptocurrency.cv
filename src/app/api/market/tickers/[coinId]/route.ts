import { NextRequest, NextResponse } from 'next/server';
import { getCoinTickers, TickerData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 120;

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

/**
 * GET /api/market/tickers/[coinId]
 * 
 * Get trading pairs/tickers for a cryptocurrency across exchanges
 * 
 * Query parameters:
 * - page: Page number for pagination (default: 1)
 * 
 * @example
 * GET /api/market/tickers/bitcoin
 * GET /api/market/tickers/ethereum?page=2
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<TickerData | { error: string; message: string }>> {
  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  // Parse page parameter
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  if (isNaN(page) || page < 1) {
    return NextResponse.json(
      { error: 'Invalid page parameter', message: 'Page must be a positive number' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getCoinTickers(coinId, page);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in tickers route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data', message: String(error) },
      { status: 500 }
    );
  }
}
