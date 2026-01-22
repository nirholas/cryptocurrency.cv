import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrice, HistoricalSnapshot } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 86400; // 24 hours - historical data doesn't change

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

/**
 * GET /api/market/snapshot/[coinId]
 * 
 * Get historical price snapshot for a cryptocurrency at a specific date
 * 
 * Query parameters:
 * - date: Date in DD-MM-YYYY format (required)
 * 
 * @example
 * GET /api/market/snapshot/bitcoin?date=01-01-2024
 * GET /api/market/snapshot/ethereum?date=15-06-2023
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<HistoricalSnapshot | { error: string; message: string }>> {
  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  
  if (!coinId) {
    return NextResponse.json(
      { error: 'Missing coin ID', message: 'Coin ID is required' },
      { status: 400 }
    );
  }
  
  if (!date) {
    return NextResponse.json(
      { error: 'Missing date parameter', message: 'Date is required in DD-MM-YYYY format' },
      { status: 400 }
    );
  }
  
  // Validate date format (DD-MM-YYYY)
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format', message: 'Date must be in DD-MM-YYYY format' },
      { status: 400 }
    );
  }
  
  // Validate date is not in the future
  const [day, month, year] = date.split('-').map(Number);
  const requestedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (requestedDate > today) {
    return NextResponse.json(
      { error: 'Invalid date', message: 'Date cannot be in the future' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getHistoricalPrice(coinId, date);
    
    if (!data) {
      return NextResponse.json(
        { error: 'Snapshot not found', message: `No data available for "${coinId}" on ${date}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        // Historical data is immutable, cache for 24 hours
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in snapshot route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshot', message: String(error) },
      { status: 500 }
    );
  }
}
