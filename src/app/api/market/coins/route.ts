import { NextRequest, NextResponse } from 'next/server';
import { getCoinsList, getTopCoins, CoinListItem, TokenPrice } from '@/lib/market-data';
import { ApiError, type ApiErrorResponse } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { validateQuery } from '@/lib/validation-middleware';
import { marketCoinsQuerySchema } from '@/lib/schemas';

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
): Promise<NextResponse<CoinsListResponse | TopCoinsResponse | ApiErrorResponse>> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  // Validate query parameters
  const validation = validateQuery(request, marketCoinsQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { type, limit: validatedLimit } = validation.data;
  
  try {
    if (type === 'list') {
      // Return full coins list for autocomplete
      logger.info('Fetching coins list for autocomplete');
      const coins = await getCoinsList();
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
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
    const limit = validatedLimit;
    
    logger.info('Fetching top coins', { limit });
    const coins = await getTopCoins(limit);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
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
    logger.error('Failed to fetch coins', error);
    return ApiError.internal('Failed to fetch coins', error);
  }
}
