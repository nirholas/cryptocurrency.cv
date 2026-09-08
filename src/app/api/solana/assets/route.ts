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
import { getDASAssets, getDASAssetById } from '@/lib/apis/helius';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/assets?address=<wallet>  — all digital assets (DAS)
 * GET /api/solana/assets?id=<asset_id>     — single asset by ID
 * Returns DAS (Digital Asset Standard) data via Helius, including compressed NFTs.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const assetId = searchParams.get('id');

    if (assetId) {
      const data = await getDASAssetById(assetId);
      return NextResponse.json({
        data,
        source: 'helius-das',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address or id' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000);

    const data = await getDASAssets(address, { page, limit });

    return NextResponse.json({
      address,
      data,
      source: 'helius-das',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch digital assets' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
