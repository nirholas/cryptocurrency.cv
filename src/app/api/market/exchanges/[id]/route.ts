import { NextRequest, NextResponse } from 'next/server';
import { getExchangeDetails, ExchangeDetails } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 120;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/market/exchanges/[id]
 * 
 * Get detailed information about a specific exchange
 * 
 * @example
 * GET /api/market/exchanges/binance
 * GET /api/market/exchanges/coinbase-exchange
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ExchangeDetails | { error: string; message: string }>> {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing exchange ID', message: 'Exchange ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getExchangeDetails(id);
    
    if (!data) {
      return NextResponse.json(
        { error: 'Exchange not found', message: `Exchange with ID "${id}" was not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in exchange details route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange details', message: String(error) },
      { status: 500 }
    );
  }
}
