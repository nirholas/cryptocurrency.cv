import { NextRequest, NextResponse } from 'next/server';
import { getBitcoinStats } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/bitcoin/stats
 * Returns comprehensive Bitcoin stats (fees, difficulty, network, mempool, block height)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getBitcoinStats();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin stats', message: String(error) },
      { status: 500 }
    );
  }
}
