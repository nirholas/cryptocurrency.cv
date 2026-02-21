import { NextRequest, NextResponse } from 'next/server';
import { getOnChainHealthAssessment } from '@/lib/apis/glassnode';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/health
 * Returns an on-chain health score and signal summary for BTC or ETH from Glassnode
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
    const { score, signals, summary } = await getOnChainHealthAssessment(asset);
    return NextResponse.json(
      { asset, score, signals, summary },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch on-chain health assessment', message: String(error) },
      { status: 500 }
    );
  }
}
