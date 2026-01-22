import { NextRequest, NextResponse } from 'next/server';
import { getCoinsList, getTopCoins, CoinListItem, TokenPrice } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 3600;

interface CoinsListResponse {
  coins: CoinListItem[];
  total: number;
}

interface TopCoinsResponse {
  coins: TokenPrice[];
  total: number;
}

/**
 * GET /api/market/coins
 * 
 * Get list of all coins or top coins by market cap
 * 
 * Query parameters:
 * - type: 'list' for all coins (autocomplete), 'top' for top coins by market cap
 * - limit: Number of coins for 'top' type (default: 100, max: 250)
 * 
 * @example
 * GET /api/market/coins?type=list        # All coins (for autocomplete)
 * GET /api/market/coins?type=top         # Top 100 by market cap
 * GET /api/market/coins?type=top&limit=50
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CoinsListResponse | TopCoinsResponse | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'top';
  
  try {
    if (type === 'list') {
      // Return full coins list for autocomplete
      const coins = await getCoinsList();
      
      return NextResponse.json(
        { coins, total: coins.length },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Default: return top coins by market cap
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100', 10),
      250
    );
    
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter', message: 'Limit must be a positive number' },
        { status: 400 }
      );
    }
    
    const coins = await getTopCoins(limit);
    
    return NextResponse.json(
      { coins, total: coins.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in coins route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coins', message: String(error) },
      { status: 500 }
    );
  }
}
