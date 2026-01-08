import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/crypto-news';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  if (!q) {
    return NextResponse.json(
      { error: 'Missing required parameter: q (keywords)' },
      { status: 400 }
    );
  }
  
  try {
    const data = await searchNews(q, limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search news', message: String(error) },
      { status: 500 }
    );
  }
}
