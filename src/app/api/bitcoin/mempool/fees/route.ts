import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedFees } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/bitcoin/mempool/fees
 * Returns recommended Bitcoin transaction fee rates from mempool.space
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getRecommendedFees();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mempool fees', message: String(error) },
      { status: 500 }
    );
  }
}
