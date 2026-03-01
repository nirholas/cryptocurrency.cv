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
  getSmartMoneyActivity,
  getTokenGodMode,
  getWalletProfiler,
} from '@/lib/apis/nansen';

export const runtime = 'nodejs';
export const revalidate = 60;

/**
 * GET /api/nansen
 *
 * Nansen on-chain analytics — smart money, token God Mode, wallet profiling.
 *
 * Query params:
 *   - action: "smart-money" | "token-god-mode" | "wallet-profiler"
 *   - token: token identifier (for token-god-mode)
 *   - address: wallet address (for wallet-profiler)
 *   - chain, limit: (for smart-money)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'smart-money';

    switch (action) {
      case 'smart-money': {
        const data = await getSmartMoneyActivity({
          chain: searchParams.get('chain') || undefined,
          token: searchParams.get('token') || undefined,
          action: (searchParams.get('txAction') as 'buy' | 'sell') || undefined,
          limit: searchParams.get('limit')
            ? Number(searchParams.get('limit'))
            : undefined,
        });
        return jsonResponse(data);
      }

      case 'token-god-mode': {
        const token = searchParams.get('token');
        if (!token) {
          return NextResponse.json(
            { error: 'token parameter required' },
            { status: 400 },
          );
        }
        const data = await getTokenGodMode(token);
        return jsonResponse(data);
      }

      case 'wallet-profiler': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { error: 'address parameter required' },
            { status: 400 },
          );
        }
        const data = await getWalletProfiler(address);
        return jsonResponse(data);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Nansen data' },
      { status: 500 },
    );
  }
}

function jsonResponse(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
