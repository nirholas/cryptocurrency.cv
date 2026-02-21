import { NextRequest, NextResponse } from 'next/server';
import { getWhaleMetrics } from '@/lib/apis/glassnode';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/whale-metrics
 * Returns whale activity metrics for BTC or ETH from Glassnode
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const assetParam = searchParams.get('asset') || 'BTC';
  const asset = assetParam.toUpperCase() as 'BTC' | 'ETH';
  if (asset !== 'BTC' && asset !== 'ETH') {
    return NextResponse.json(
      { error: 'Invalid asset', message: "asset must be 'BTC' or 'ETH'" },
      { status: 400 }
    );
  }

  try {
    const data = await getWhaleMetrics(asset);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch whale metrics', message: String(error) },
      { status: 500 }
    );
  }
}
