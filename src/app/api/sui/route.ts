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
import * as sui from '@/lib/apis/sui';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Sui Blockchain API
 *
 * Queries the Sui mainnet fullnode via JSON-RPC 2.0.
 *
 * GET /api/sui                              — network summary
 * GET /api/sui?address=<addr>               — account balances
 * GET /api/sui?address=<addr>&view=objects   — owned objects
 * GET /api/sui?address=<addr>&view=transactions — transactions from address
 * GET /api/sui?object=<id>                  — single object lookup
 * GET /api/sui?tx=<digest>                  — single transaction lookup
 * GET /api/sui?coin=<type>                  — coin metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const objectId = searchParams.get('object');
    const txDigest = searchParams.get('tx');
    const coinType = searchParams.get('coin');
    const view = searchParams.get('view');

    // Single object lookup
    if (objectId) {
      const data = await sui.getObject(objectId);
      return NextResponse.json({
        data,
        source: 'sui-rpc',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    // Single transaction lookup
    if (txDigest) {
      const data = await sui.getTransactionBlock(txDigest);
      return NextResponse.json({
        data,
        source: 'sui-rpc',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Coin metadata
    if (coinType) {
      const data = await sui.getCoinMetadata(coinType);
      return NextResponse.json({
        data,
        source: 'sui-rpc',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=3600' },
      });
    }

    // Address-based queries
    if (address) {
      switch (view) {
        case 'objects': {
          const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50);
          const cursor = searchParams.get('cursor') || undefined;
          const data = await sui.getOwnedObjects(address, { limit, cursor });
          return NextResponse.json({
            address,
            ...data,
            source: 'sui-rpc',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }

        case 'transactions': {
          const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
          const cursor = searchParams.get('cursor') || undefined;
          const data = await sui.getTransactionsByAddress(address, { limit, cursor });
          return NextResponse.json({
            address,
            ...data,
            source: 'sui-rpc',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }

        default: {
          // All balances for address
          const balances = await sui.getAllBalances(address);
          return NextResponse.json({
            address,
            balances,
            source: 'sui-rpc',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }
      }
    }

    // Default: network summary
    const summary = await sui.getNetworkSummary();
    return NextResponse.json({
      chain: 'sui',
      ...summary,
      endpoints: {
        networkSummary: '/api/sui',
        balances: '/api/sui?address=<addr>',
        objects: '/api/sui?address=<addr>&view=objects',
        transactions: '/api/sui?address=<addr>&view=transactions',
        objectLookup: '/api/sui?object=<object_id>',
        transactionLookup: '/api/sui?tx=<digest>',
        coinMetadata: '/api/sui?coin=<coin_type>',
      },
      subroutes: {
        balances: '/api/sui/balances?address=<addr>',
        objects: '/api/sui/objects?address=<addr>',
        transactions: '/api/sui/transactions?address=<addr>',
      },
      source: 'sui-rpc',
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Sui data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
