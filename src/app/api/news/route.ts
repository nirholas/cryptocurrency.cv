import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const source = searchParams.get('source') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
  const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined;
  
  try {
    const data = await getLatestNews(limit, source, { from, to, page, perPage });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch news', message: String(error) },
      { status: 500 }
    );
  }
}
