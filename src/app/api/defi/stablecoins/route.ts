import { NextRequest, NextResponse } from 'next/server';
import { getStablecoins } from '@/lib/apis/defillama';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/stablecoins
 * Returns stablecoin data from DefiLlama.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getStablecoins();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stablecoins', message: String(error) },
      { status: 500 }
    );
  }
}
