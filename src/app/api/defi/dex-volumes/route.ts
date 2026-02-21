import { NextRequest, NextResponse } from 'next/server';
import { getDexVolumes } from '@/lib/apis/defillama';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/dex-volumes
 * Returns DEX trading volumes from DefiLlama.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getDexVolumes();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch DEX volumes', message: String(error) },
      { status: 500 }
    );
  }
}
