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
import {
  getSwapQuote,
  getTokenPrices,
  getLiquiditySources,
} from '@/lib/apis/oneinch';
import type { ChainId } from '@/lib/apis/oneinch';

export const runtime = 'nodejs';
export const revalidate = 30;

/**
 * GET /api/oneinch
 *
 * 1inch DEX aggregator — swap quotes, token prices, liquidity sources.
 *
 * Query params:
 *   - action: "quote" | "prices" | "liquidity-sources"
 *   - chainId: chain ID (default 1 = Ethereum)
 *   - src, dst, amount: (for quote)
 *   - slippage, from: (optional for quote)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'prices';
    const chainId = (Number(searchParams.get('chainId')) || 1) as ChainId;

    switch (action) {
      case 'quote': {
        const src = searchParams.get('src');
        const dst = searchParams.get('dst');
        const amount = searchParams.get('amount');
        if (!src || !dst || !amount) {
          return NextResponse.json(
            { error: 'src, dst, and amount parameters required' },
            { status: 400 },
          );
        }
        const data = await getSwapQuote({
          chainId,
          src,
          dst,
          amount,
          from: searchParams.get('from') || undefined,
          slippage: searchParams.get('slippage')
            ? Number(searchParams.get('slippage'))
            : undefined,
        });
        return jsonResponse(data, 15);
      }

      case 'prices': {
        const data = await getTokenPrices(chainId);
        return jsonResponse(data, 30);
      }

      case 'liquidity-sources': {
        const data = await getLiquiditySources(chainId);
        return jsonResponse(data, 3600);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch 1inch data' },
      { status: 500 },
    );
  }
}

function jsonResponse(data: unknown, maxAge: number): NextResponse {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
