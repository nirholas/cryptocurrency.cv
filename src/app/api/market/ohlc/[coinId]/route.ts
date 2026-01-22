import { NextRequest, NextResponse } from 'next/server';
import { getOHLC, OHLCData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 60;

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

/**
 * GET /api/market/ohlc/[coinId]
 * 
 * Get OHLC candlestick data for a cryptocurrency
 * 
 * Query parameters:
 * - days: Number of days (1, 7, 14, 30, 90, 180, 365)
 * 
 * @example
 * GET /api/market/ohlc/bitcoin?days=30
 * GET /api/market/ohlc/ethereum?days=7
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OHLCData[] | { error: string; message: string }>> {
  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  // Parse days parameter
  const daysParam = searchParams.get('days') || '30';
  const days = parseInt(daysParam, 10);
  
  // Validate days
  if (isNaN(days) || days < 1 || days > 365) {
    return NextResponse.json(
      { error: 'Invalid days parameter', message: 'Days must be between 1 and 365' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getOHLC(coinId, days);
    
    // Calculate appropriate cache duration based on days
    const maxAge = days <= 1 ? 60 : days <= 7 ? 300 : 900;
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in OHLC route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OHLC data', message: String(error) },
      { status: 500 }
    );
  }
}
