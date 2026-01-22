import { NextRequest, NextResponse } from 'next/server';
import { getDerivativesTickers, DerivativeTicker } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 120;

/**
 * GET /api/market/derivatives
 * 
 * Get derivatives market tickers (futures, perpetuals)
 * 
 * @example
 * GET /api/market/derivatives
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<DerivativeTicker[] | { error: string; message: string }>> {
  try {
    const data = await getDerivativesTickers();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in derivatives route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch derivatives data', message: String(error) },
      { status: 500 }
    );
  }
}
