import { NextRequest, NextResponse } from 'next/server';
import { getBreakingNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute for breaking news

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '5');
  
  try {
    const data = await getBreakingNews(limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch breaking news', message: String(error) },
      { status: 500 }
    );
  }
}
