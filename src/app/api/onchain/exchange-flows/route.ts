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
import { getExchangeFlows } from '@/lib/apis/glassnode';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/exchange-flows
 * Returns Bitcoin or Ethereum exchange inflow/outflow data from Glassnode
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const assetParam = searchParams.get('asset') || 'BTC';
  const asset = assetParam.toUpperCase() as 'BTC' | 'ETH';
  if (asset !== 'BTC' && asset !== 'ETH') {
    return NextResponse.json(
      { error: 'Invalid asset', message: "asset must be 'BTC' or 'ETH'" },
      { status: 400 }
    );
  }

  try {
    const data = await getExchangeFlows(asset);
    if (data === null) {
      return NextResponse.json(
        { data: null, message: 'No exchange flow data available for this asset' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'Access-Control-Allow-Origin': '*',
          },
        }
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
      { error: 'Failed to fetch exchange flows' },
      { status: 500 }
    );
  }
}
