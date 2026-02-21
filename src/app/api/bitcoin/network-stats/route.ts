import { NextRequest, NextResponse } from 'next/server';
import { getNetworkStats } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/bitcoin/network-stats
 * Returns Bitcoin network statistics (hashrate, difficulty, block height, unconfirmed txs)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getNetworkStats();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch network stats', message: String(error) },
      { status: 500 }
    );
  }
}
