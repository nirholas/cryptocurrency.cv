import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, SearchResult } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/search
 * 
 * Search for coins, exchanges, and categories
 * 
 * Query parameters:
 * - q: Search query (required, min 2 characters)
 * 
 * @example
 * GET /api/market/search?q=bitcoin
 * GET /api/market/search?q=defi
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchResult | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Invalid query', message: 'Search query must be at least 2 characters' },
      { status: 400 }
    );
  }
  
  try {
    const data = await searchCoins(query);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in search route:', error);
    return NextResponse.json(
      { error: 'Search failed', message: String(error) },
      { status: 500 }
    );
  }
}
