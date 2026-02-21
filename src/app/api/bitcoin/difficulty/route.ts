import { NextRequest, NextResponse } from 'next/server';
import { getDifficultyAdjustment } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/bitcoin/difficulty
 * Returns Bitcoin difficulty adjustment data
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getDifficultyAdjustment();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch difficulty adjustment', message: String(error) },
      { status: 500 }
    );
  }
}
