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
import { getCoinCommunityData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/market/coins/[coinId]/community
 * Returns community stats for a coin (Twitter, Reddit, Telegram, etc.)
 *
 * @param coinId - CoinGecko coin ID (e.g. "bitcoin", "ethereum")
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
): Promise<NextResponse> {
  const { coinId } = await params;

  if (!coinId) {
    return NextResponse.json(
      { error: 'coinId is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getCoinCommunityData(coinId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch community data' },
      { status: 500 }
    );
  }
}
