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
import { searchDASAssets } from '@/lib/apis/helius';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/search
 *
 * Search Solana digital assets (DAS) with flexible filters.
 *
 *   ?owner=<addr>          — filter by owner address
 *   ?creator=<addr>        — filter by creator address
 *   ?collection=<addr>     — filter by collection group
 *   ?compressed=true       — only compressed NFTs
 *   ?frozen=true           — only frozen assets
 *   ?burnt=true            — include burnt assets
 *   ?page=1&limit=100      — pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const owner = searchParams.get('owner') || undefined;
    const creator = searchParams.get('creator') || undefined;
    const collection = searchParams.get('collection') || undefined;
    const compressed = searchParams.get('compressed') === 'true' ? true : undefined;
    const frozen = searchParams.get('frozen') === 'true' ? true : undefined;
    const burnt = searchParams.get('burnt') === 'true' ? true : undefined;
    const page = intParam(searchParams, 'page', { fallback: 1, min: 1, max: 1000 });
    const limit = intParam(searchParams, 'limit', { fallback: 100, min: 1, max: 1000 });

    if (!owner && !creator && !collection) {
      return NextResponse.json({
        error: 'Provide at least one filter: owner, creator, or collection',
        usage: {
          byOwner: '/api/solana/search?owner=<wallet_addr>',
          byCreator: '/api/solana/search?creator=<creator_addr>',
          byCollection: '/api/solana/search?collection=<collection_addr>',
          combined: '/api/solana/search?owner=<addr>&compressed=true',
        },
      }, { status: 400, headers: CORS_HEADERS });
    }

    const grouping = collection
      ? { groupKey: 'collection', groupValue: collection }
      : undefined;

    const data = await searchDASAssets({
      ownerAddress: owner,
      creatorAddress: creator,
      grouping,
      compressed,
      frozen,
      burnt,
      page,
      limit,
    });

    return NextResponse.json({
      filters: { owner, creator, collection, compressed, frozen, burnt },
      data,
      source: 'helius-das',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
