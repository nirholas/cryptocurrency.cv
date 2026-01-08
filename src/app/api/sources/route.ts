import { NextResponse } from 'next/server';
import { getSources } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const data = await getSources();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sources', message: String(error) },
      { status: 500 }
    );
  }
}
