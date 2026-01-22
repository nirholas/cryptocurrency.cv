import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrices, HistoricalData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 60;

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

/**
 * GET /api/market/history/[coinId]
 * 
 * Get historical price data for a cryptocurrency
 * 
 * Query parameters:
 * - days: Number of days (1, 7, 14, 30, 90, 180, 365, or 'max')
 * - interval: Data interval ('minutely', 'hourly', 'daily')
 * 
 * @example
 * GET /api/market/history/bitcoin?days=30
 * GET /api/market/history/ethereum?days=7&interval=hourly
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<HistoricalData | { error: string; message: string }>> {
  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  // Parse days parameter
  const daysParam = searchParams.get('days') || '30';
  const days = daysParam === 'max' ? 'max' : parseInt(daysParam, 10);
  
  // Validate days
  if (typeof days === 'number' && (isNaN(days) || days < 1)) {
    return NextResponse.json(
      { error: 'Invalid days parameter', message: 'Days must be a positive number or "max"' },
      { status: 400 }
    );
  }
  
  // Parse interval parameter
  const interval = searchParams.get('interval') as 'minutely' | 'hourly' | 'daily' | undefined;
  if (interval && !['minutely', 'hourly', 'daily'].includes(interval)) {
    return NextResponse.json(
      { error: 'Invalid interval', message: 'Interval must be minutely, hourly, or daily' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getHistoricalPrices(coinId, days, interval);
    
    // Calculate appropriate cache duration based on days
    const maxAge = typeof days === 'number' && days <= 1 ? 60 : 
                   typeof days === 'number' && days <= 7 ? 300 : 900;
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in history route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', message: String(error) },
      { status: 500 }
    );
  }
}
