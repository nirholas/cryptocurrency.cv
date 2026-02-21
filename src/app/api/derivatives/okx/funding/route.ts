import { NextRequest, NextResponse } from 'next/server';
import { getOKXFundingRates } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/okx/funding
 * Returns OKX perpetual funding rates
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getOKXFundingRates();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch OKX funding rates', message: String(error) },
      { status: 500 }
    );
  }
}
