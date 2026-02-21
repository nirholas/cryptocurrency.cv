import { NextRequest, NextResponse } from 'next/server';
import { getMempoolBlocks } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 15;

/**
 * GET /api/bitcoin/mempool/blocks
 * Returns projected mempool blocks with fee estimates
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMempoolBlocks();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mempool blocks', message: String(error) },
      { status: 500 }
    );
  }
}
