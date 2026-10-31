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
  getDASAssetsByGroup,
  getDASAssetsByCreator,
  getDASAssetsByAuthority,
  getDASAssetProof,
} from '@/lib/apis/helius';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/collections
 *
 * Query DAS assets by grouping, creator, or authority.
 *
 *   ?groupKey=collection&groupValue=<addr>          — NFTs in a collection
 *   ?creator=<addr>                                 — assets by creator
 *   ?authority=<addr>                               — assets by update authority
 *   ?proof=<assetId>                                — merkle proof for compressed NFT
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupKey = searchParams.get('groupKey');
    const groupValue = searchParams.get('groupValue');
    const creator = searchParams.get('creator');
    const authority = searchParams.get('authority');
    const proofId = searchParams.get('proof');
    const page = intParam(searchParams, 'page', { fallback: 1, min: 1, max: 1000 });
    const limit = intParam(searchParams, 'limit', { fallback: 100, min: 1, max: 1000 });

    if (proofId) {
      const proof = await getDASAssetProof(proofId);
      return NextResponse.json({
        assetId: proofId,
        proof,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    if (groupKey && groupValue) {
      const data = await getDASAssetsByGroup(groupKey, groupValue, { page, limit });
      return NextResponse.json({
        groupKey,
        groupValue,
        data,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    if (creator) {
      const data = await getDASAssetsByCreator(creator, { page, limit });
      return NextResponse.json({
        creator,
        data,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    if (authority) {
      const data = await getDASAssetsByAuthority(authority, { page, limit });
      return NextResponse.json({
        authority,
        data,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    return NextResponse.json({
      error: 'Provide one of: groupKey+groupValue, creator, authority, or proof',
      examples: {
        collection: '/api/solana/collections?groupKey=collection&groupValue=<collection_addr>',
        creator: '/api/solana/collections?creator=<creator_addr>',
        authority: '/api/solana/collections?authority=<authority_addr>',
        proof: '/api/solana/collections?proof=<asset_id>',
      },
    }, { status: 400, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch collection data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
