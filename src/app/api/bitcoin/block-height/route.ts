import { NextRequest, NextResponse } from 'next/server';
import { getBlockHeight } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/bitcoin/block-height
 * Returns the current Bitcoin block height
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const blockHeight = await getBlockHeight();
    return NextResponse.json({ blockHeight }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch block height', message: String(error) },
      { status: 500 }
    );
  }
}
