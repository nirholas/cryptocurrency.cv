import { NextRequest, NextResponse } from 'next/server';
import { getMinerMetrics } from '@/lib/apis/glassnode';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/onchain/miner-metrics
 * Returns Bitcoin miner revenue, hashrate, and difficulty data from Glassnode
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMinerMetrics();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch miner metrics', message: String(error) },
      { status: 500 }
    );
  }
}
