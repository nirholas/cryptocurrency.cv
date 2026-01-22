import { NextRequest, NextResponse } from 'next/server';
import { getGlobalDeFiData, GlobalDeFi } from '@/lib/market-data';

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
  _request: NextRequest
): Promise<NextResponse<GlobalDeFi | { error: string; message: string }>> {
  try {
    const data = await getGlobalDeFiData();
    
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch DeFi data', message: 'No data available' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in DeFi route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DeFi data', message: String(error) },
      { status: 500 }
    );
  }
}
