import { NextRequest, NextResponse } from 'next/server';
import { getBridges } from '@/lib/apis/defillama';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/bridges
 * Returns cross-chain bridge data from DefiLlama.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getBridges();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bridge data', message: String(error) },
      { status: 500 }
    );
  }
}
