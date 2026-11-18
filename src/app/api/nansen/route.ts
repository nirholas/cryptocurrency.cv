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
import { optionalIntParam } from '@/lib/query-params';

export const runtime = 'nodejs';
export const revalidate = 60;

// Every value below ends up in an upstream URL, so each one is held to a
// strict format before it leaves this route.
const ADDRESS_RE = /^[A-Za-z0-9]{20,100}$/;
const CHAIN_RE = /^[a-z0-9-]{1,32}$/;
const TOKEN_RE = /^[A-Za-z0-9.-]{1,100}$/;

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
        const chain = searchParams.get('chain') || undefined;
        const token = searchParams.get('token') || undefined;
        const txAction = searchParams.get('txAction') || undefined;
        if (chain && !CHAIN_RE.test(chain)) {
          return NextResponse.json({ error: `invalid chain parameter` }, { status: 400 });
        }
        if (token && !TOKEN_RE.test(token)) {
          return NextResponse.json({ error: `invalid token parameter` }, { status: 400 });
        }
        if (txAction && txAction !== 'buy' && txAction !== 'sell') {
          return NextResponse.json({ error: `invalid txAction parameter` }, { status: 400 });
        }
        const data = await getSmartMoneyActivity({
          chain,
          token,
          action: txAction as 'buy' | 'sell' | undefined,
          limit: optionalIntParam(searchParams, 'limit', { min: 1, max: 100 }),
        });
        return jsonResponse(data);
      }

      case 'token-god-mode': {
        const token = searchParams.get('token');
        if (token && !TOKEN_RE.test(token)) {
          return NextResponse.json({ error: `invalid token parameter` }, { status: 400 });
        }
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
        if (address && !ADDRESS_RE.test(address)) {
          return NextResponse.json({ error: `invalid address parameter` }, { status: 400 });
        }
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
  } catch {
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
