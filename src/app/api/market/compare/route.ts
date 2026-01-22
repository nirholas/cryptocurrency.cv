import { NextRequest, NextResponse } from 'next/server';
import { compareCoins, CompareData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/market/compare
 * 
 * Compare multiple cryptocurrencies side by side
 * 
 * Query parameters:
 * - ids: Comma-separated list of coin IDs (required, max 25)
 * 
 * @example
 * GET /api/market/compare?ids=bitcoin,ethereum,solana
 * GET /api/market/compare?ids=bitcoin,ethereum,binancecoin,cardano,ripple
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CompareData | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const idsParam = searchParams.get('ids') || '';
  
  if (!idsParam) {
    return NextResponse.json(
      { error: 'Missing coin IDs', message: 'Provide comma-separated coin IDs in the "ids" parameter' },
      { status: 400 }
    );
  }
  
  const coinIds = idsParam
    .split(',')
    .map(id => id.trim().toLowerCase())
    .filter(id => id.length > 0);
  
  if (coinIds.length === 0) {
    return NextResponse.json(
      { error: 'No valid coin IDs', message: 'Provide at least one valid coin ID' },
      { status: 400 }
    );
  }
  
  if (coinIds.length > 25) {
    return NextResponse.json(
      { error: 'Too many coins', message: 'Maximum 25 coins can be compared at once' },
      { status: 400 }
    );
  }
  
  try {
    const data = await compareCoins(coinIds);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in compare route:', error);
    return NextResponse.json(
      { error: 'Comparison failed', message: String(error) },
      { status: 500 }
    );
  }
}
