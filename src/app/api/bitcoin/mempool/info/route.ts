import { NextRequest, NextResponse } from 'next/server';
import { getMempoolInfo } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/bitcoin/mempool/info
 * Returns current mempool statistics (tx count, vsize, fees, histogram)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMempoolInfo();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mempool info', message: String(error) },
      { status: 500 }
    );
  }
}
