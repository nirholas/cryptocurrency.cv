import { NextRequest, NextResponse } from 'next/server';
import { getAaveLendingRates } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/aave/rates
 * Returns Aave V3 lending and borrowing rates from The Graph
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const reserve = searchParams.get('reserve') || undefined;

  try {
    const data = await getAaveLendingRates(reserve);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Aave lending rates', message: String(error) },
      { status: 500 }
    );
  }
}
