import { NextRequest, NextResponse } from 'next/server';
import { compareCoins, CompareData } from '@/lib/market-data';
import { validateQuery } from '@/lib/validation-middleware';
import { marketCompareQuerySchema2 } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';

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
  // Validate query parameters
  const validation = validateQuery(request, marketCompareQuerySchema2);
  if (!validation.success) {
    return validation.error;
  }
  
  const { ids: idsParam } = validation.data;
  const coinIds = idsParam
    .split(',')
    .map(id => id.trim().toLowerCase())
    .filter(id => id.length > 0);
  
  if (coinIds.length === 0) {
    return ApiError.badRequest('No valid coin IDs provided');
  }
  
  if (coinIds.length > 25) {
    return ApiError.badRequest('Maximum 25 coins can be compared at once');
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
