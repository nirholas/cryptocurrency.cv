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
import { getAccountResources, getAccountResource } from '@/lib/apis/aptos';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/aptos/resources?address=<addr>              — all resources
 * GET /api/aptos/resources?address=<addr>&type=<type>  — specific resource by type
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

    const resourceType = searchParams.get('type');

    if (resourceType) {
      const data = await getAccountResource(address, resourceType);
      return NextResponse.json({
        address,
        data,
        source: 'aptos-rest',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    const data = await getAccountResources(address);

    return NextResponse.json({
      address,
      count: data.length,
      data,
      source: 'aptos-rest',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Aptos resources' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
