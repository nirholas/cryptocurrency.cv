import { NextRequest, NextResponse } from 'next/server';
import { getDefiNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    const data = await getDefiNews(limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch DeFi news', message: String(error) },
      { status: 500 }
    );
  }
}
