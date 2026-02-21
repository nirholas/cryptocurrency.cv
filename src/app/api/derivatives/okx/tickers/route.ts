import { NextRequest, NextResponse } from 'next/server';
import { getOKXTickers } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/derivatives/okx/tickers
 * Returns OKX perpetual/futures tickers
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const typeParam = searchParams.get('type') || 'SWAP';
  const instType = (typeParam.toUpperCase() === 'FUTURES' ? 'FUTURES' : 'SWAP') as
    | 'SWAP'
    | 'FUTURES';

  try {
    const data = await getOKXTickers(instType);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch OKX tickers', message: String(error) },
      { status: 500 }
    );
  }
}
