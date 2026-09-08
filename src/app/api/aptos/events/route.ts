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
import { getEventsByEventHandle, getEventsByCreationNumber } from '@/lib/apis/aptos';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/aptos/events?address=<addr>&handle=<struct>&field=<name>  — events by handle
 * GET /api/aptos/events?address=<addr>&creation_number=<num>        — events by creation number
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

    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const start = searchParams.get('start') || undefined;
    const handle = searchParams.get('handle');
    const field = searchParams.get('field');
    const creationNumber = searchParams.get('creation_number');

    if (handle && field) {
      const data = await getEventsByEventHandle(address, handle, field, { limit, start });
      return NextResponse.json({
        address,
        handle,
        field,
        count: data.length,
        data,
        source: 'aptos-rest',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    if (creationNumber) {
      const data = await getEventsByCreationNumber(address, creationNumber, { limit, start });
      return NextResponse.json({
        address,
        creationNumber,
        count: data.length,
        data,
        source: 'aptos-rest',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    return NextResponse.json(
      {
        error: 'Missing required parameters: (handle + field) or creation_number',
        usage: {
          byHandle: '/api/aptos/events?address=<addr>&handle=<event_handle_struct>&field=<field_name>',
          byCreationNumber: '/api/aptos/events?address=<addr>&creation_number=<num>',
        },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Aptos events' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
