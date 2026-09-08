/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSocialMetrics } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/social/coins/[symbol]
 * Returns social metrics for a specific cryptocurrency symbol.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const data = await getSocialMetrics(symbol.toUpperCase());

    if (!data) {
      return NextResponse.json(
        { error: `No social data found for symbol "${symbol.toUpperCase()}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch social metrics' },
      { status: 500 }
    );
  }
}
