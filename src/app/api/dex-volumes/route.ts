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
import { getDexVolumes, getDexVolumeByChain, getTopDexes } from '@/lib/apis/dexes';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/dex-volumes
 *
 * DEX trading volume data from DefiLlama.
 *
 * Query params:
 *   ?chain=ethereum   — volume for a specific chain
 *   ?top=20           — top N DEXes ranked by 24h volume
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const top = searchParams.get('top');

    if (chain) {
      const data = await getDexVolumeByChain(chain);
      if (!data) {
        return NextResponse.json(
          { error: `No DEX volume data found for chain: ${chain}` },
          { status: 404 },
        );
      }
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (top) {
      const data = await getTopDexes(parseInt(top, 10) || 20);
      return NextResponse.json(
        { count: data.length, dexes: data, timestamp: new Date().toISOString() },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const data = await getDexVolumes();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch DEX volume data' },
      { status: 500 },
    );
  }
}
