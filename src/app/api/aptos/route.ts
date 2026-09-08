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
import * as aptos from '@/lib/apis/aptos';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Aptos Blockchain API
 *
 * Queries the Aptos mainnet fullnode via REST API.
 *
 * GET /api/aptos                                — network summary (ledger info + gas)
 * GET /api/aptos?address=<addr>                 — account resources
 * GET /api/aptos?address=<addr>&view=transactions — account transactions
 * GET /api/aptos?address=<addr>&view=balance    — APT balance
 * GET /api/aptos?tx=<hash>                      — transaction by hash
 * GET /api/aptos?block=<height>                 — block by height
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const txHash = searchParams.get('tx');
    const blockHeight = searchParams.get('block');
    const view = searchParams.get('view');

    // Transaction lookup
    if (txHash) {
      const data = await aptos.getTransactionByHash(txHash);
      return NextResponse.json({
        data,
        source: 'aptos-rest',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Block lookup
    if (blockHeight) {
      const withTxs = searchParams.get('with_transactions') === 'true';
      const data = await aptos.getBlockByHeight(blockHeight, withTxs);
      return NextResponse.json({
        data,
        source: 'aptos-rest',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Address-based queries
    if (address) {
      switch (view) {
        case 'transactions': {
          const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
          const start = searchParams.get('start') || undefined;
          const data = await aptos.getAccountTransactions(address, { limit, start });
          return NextResponse.json({
            address,
            count: data.length,
            data,
            source: 'aptos-rest',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }

        case 'balance': {
          const balance = await aptos.getAptBalance(address);
          return NextResponse.json({
            address,
            balance,
            balanceApt: balance ? (parseInt(balance, 10) / 1e8).toFixed(8) : null,
            source: 'aptos-rest',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }

        case 'modules': {
          const data = await aptos.getAccountModules(address);
          return NextResponse.json({
            address,
            count: data.length,
            data: data.map((m) => ({ abi: m.abi })), // Omit raw bytecode
            source: 'aptos-rest',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=300' },
          });
        }

        default: {
          // All account resources
          const resources = await aptos.getAccountResources(address);
          return NextResponse.json({
            address,
            count: resources.length,
            data: resources,
            source: 'aptos-rest',
            timestamp: new Date().toISOString(),
          }, {
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
          });
        }
      }
    }

    // Default: network summary
    const summary = await aptos.getNetworkSummary();
    return NextResponse.json({
      chain: 'aptos',
      ...summary,
      endpoints: {
        networkSummary: '/api/aptos',
        accountResources: '/api/aptos?address=<addr>',
        accountTransactions: '/api/aptos?address=<addr>&view=transactions',
        aptBalance: '/api/aptos?address=<addr>&view=balance',
        accountModules: '/api/aptos?address=<addr>&view=modules',
        transactionLookup: '/api/aptos?tx=<hash>',
        blockLookup: '/api/aptos?block=<height>',
      },
      subroutes: {
        resources: '/api/aptos/resources?address=<addr>',
        transactions: '/api/aptos/transactions?address=<addr>',
        events: '/api/aptos/events?address=<addr>&handle=<struct>&field=<name>',
      },
      source: 'aptos-rest',
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Aptos data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
