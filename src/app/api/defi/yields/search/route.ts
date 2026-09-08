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
import { searchPools } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 0;

/**
 * GET /api/defi/yields/search
 * Search yield pools by query string.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';

  if (!q) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    const data = await searchPools(q);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to search pools' },
      { status: 500 }
    );
  }
}
