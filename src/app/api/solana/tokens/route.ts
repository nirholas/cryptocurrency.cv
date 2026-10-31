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
import { getTokenAccounts } from '@/lib/apis/helius';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/tokens
 *
 * Get all SPL token accounts for a wallet or all holders of a specific mint.
 *
 *   ?owner=<wallet_addr>   — all token accounts owned by wallet
 *   ?mint=<token_mint>     — all holders of a token mint
 *   ?page=1&limit=100      — pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const mint = searchParams.get('mint');
    const page = intParam(searchParams, 'page', { fallback: 1, min: 1, max: 1000 });
    const limit = intParam(searchParams, 'limit', { fallback: 100, min: 1, max: 1000 });

    if (!owner && !mint) {
      return NextResponse.json({
        error: 'Provide owner or mint address',
        usage: {
          byOwner: '/api/solana/tokens?owner=<wallet_addr>',
          byMint: '/api/solana/tokens?mint=<token_mint>',
        },
      }, { status: 400, headers: CORS_HEADERS });
    }

    const data = await getTokenAccounts(
      owner || undefined,
      mint || undefined,
      { page, limit },
    );

    return NextResponse.json({
      query: { owner, mint },
      data,
      source: 'helius',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch token accounts' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
