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
import { getCollectionActivity } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/nft/collections/[slug]/activity
 * Returns recent activity (sales, bids, listings) for a specific NFT collection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const eventType = searchParams.get('event_type') || undefined;

  try {
    const data = await getCollectionActivity(slug, limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch collection activity' },
      { status: 500 }
    );
  }
}
