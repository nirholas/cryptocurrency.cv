import { NextRequest, NextResponse } from 'next/server';
import { getLongTermHolderMetrics } from '@/lib/apis/glassnode';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/onchain/lth-metrics
 * Returns Long-Term Holder (LTH) metrics (HODL waves, supply held 1yr+, etc.) from Glassnode
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
    const data = await getLongTermHolderMetrics(asset);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch long-term holder metrics', message: String(error) },
      { status: 500 }
    );
  }
}
