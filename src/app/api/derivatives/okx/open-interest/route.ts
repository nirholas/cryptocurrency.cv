import { NextRequest, NextResponse } from 'next/server';
import { getOKXOpenInterest } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/okx/open-interest
 * Returns OKX open interest data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const typeParam = searchParams.get('type') || 'SWAP';
  const instType = (typeParam.toUpperCase() === 'FUTURES' ? 'FUTURES' : 'SWAP') as
    | 'SWAP'
    | 'FUTURES';

  try {
    const data = await getOKXOpenInterest(instType);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch OKX open interest', message: String(error) },
      { status: 500 }
    );
  }
}
