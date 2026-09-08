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
import { getL2Summary } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2
 * Returns L2 scaling ecosystem summary: total TVL, project count, activity metrics, risk distribution.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getL2Summary();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch L2 summary' },
      { status: 500 }
    );
  }
}
