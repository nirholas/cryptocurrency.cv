import { NextRequest, NextResponse } from 'next/server';
import { 
  getCoinDeveloperData, 
  getCoinCommunityData,
  DeveloperData,
  CommunityData
} from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 1800;

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

interface CoinSocialData {
  developer: DeveloperData | null;
  community: CommunityData | null;
}

/**
 * GET /api/market/social/[coinId]
 * 
 * Get developer and community statistics for a cryptocurrency
 * 
 * Query parameters:
 * - type: 'all' (default), 'developer', or 'community'
 * 
 * @example
 * GET /api/market/social/bitcoin              # Both developer and community data
 * GET /api/market/social/ethereum?type=developer
 * GET /api/market/social/solana?type=community
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<CoinSocialData | DeveloperData | CommunityData | { error: string; message: string }>> {
  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'all';
  
  if (!coinId) {
    return NextResponse.json(
      { error: 'Missing coin ID', message: 'Coin ID is required' },
      { status: 400 }
    );
  }
  
  try {
    if (type === 'developer') {
      const data = await getCoinDeveloperData(coinId);
      
      if (!data) {
        return NextResponse.json(
          { error: 'Developer data not found', message: `No developer data for "${coinId}"` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    if (type === 'community') {
      const data = await getCoinCommunityData(coinId);
      
      if (!data) {
        return NextResponse.json(
          { error: 'Community data not found', message: `No community data for "${coinId}"` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Default: fetch both
    const [developer, community] = await Promise.all([
      getCoinDeveloperData(coinId),
      getCoinCommunityData(coinId),
    ]);
    
    return NextResponse.json(
      { developer, community },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in social route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social data', message: String(error) },
      { status: 500 }
    );
  }
}
