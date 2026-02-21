import { NextRequest, NextResponse } from 'next/server';
import { getCrossProtocolAnalysis } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/cross-protocol
 * Returns comparative analysis across Uniswap, Aave, and Curve (TVL, volume, rates)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getCrossProtocolAnalysis();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cross-protocol analysis', message: String(error) },
      { status: 500 }
    );
  }
}
