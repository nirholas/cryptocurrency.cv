/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * GET /api/gaming
 *
 * Returns blockchain gaming market data — top games by DAU,
 * transaction volume, chain breakdown.
 */

import { NextResponse } from 'next/server';
import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await gamingDataChain.fetch({});

    return NextResponse.json({
      ...result.data,
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Gaming] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaming data', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
