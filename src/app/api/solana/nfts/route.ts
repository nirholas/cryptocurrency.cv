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
import { getNFTsByWallet, getDASAssets } from '@/lib/apis/helius';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/nfts?address=<wallet>
 * GET /api/solana/nfts?address=<wallet>&source=das   — use DAS API (includes compressed NFTs)
 * Returns NFTs owned by a Solana wallet via Helius.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const source = searchParams.get('source');

    if (source === 'das') {
      const data = await getDASAssets(address);
      return NextResponse.json({
        address,
        data,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    const data = await getNFTsByWallet(address);

    return NextResponse.json({
      address,
      count: data.length,
      data,
      source: 'helius',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
