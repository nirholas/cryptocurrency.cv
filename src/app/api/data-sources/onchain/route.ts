/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * On-Chain Dashboard API — gas, mempool, blocks, whale detection
 * GET /api/data-sources/onchain/dashboard — full on-chain snapshot
 * GET /api/data-sources/onchain/gas — multi-chain gas prices
 * GET /api/data-sources/onchain/btc — Bitcoin mempool + stats
 * GET /api/data-sources/onchain/wallet?address=0x...&chain=ethereum — wallet info
 * GET /api/data-sources/onchain/whales?minEth=100 — whale transactions
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getOnChainDashboard,
  getMultiChainGas,
  getBitcoinMempool,
  getBitcoinStats,
  getWalletBalance,
  getTokenTransfers,
  detectWhaleTransactions,
} from '@/lib/data-sources/onchain';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'dashboard';

  try {
    switch (view) {
      case 'gas': {
        const gas = await getMultiChainGas();
        return NextResponse.json({ status: 'ok', data: gas, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'btc': {
        const [mempool, stats] = await Promise.allSettled([getBitcoinMempool(), getBitcoinStats()]);
        return NextResponse.json({
          status: 'ok',
          data: {
            mempool: mempool.status === 'fulfilled' ? mempool.value : null,
            stats: stats.status === 'fulfilled' ? stats.value : null,
          },
          timestamp: new Date().toISOString(),
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'wallet': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
        }
        const chain = (searchParams.get('chain') || 'ethereum') as 'ethereum' | 'base' | 'arbitrum' | 'polygon';
        const includeTransfers = searchParams.get('transfers') === 'true';

        const [balance, transfers] = await Promise.allSettled([
          getWalletBalance(address, chain),
          includeTransfers ? getTokenTransfers(address) : Promise.resolve([]),
        ]);

        return NextResponse.json({
          status: 'ok',
          data: {
            balance: balance.status === 'fulfilled' ? balance.value : null,
            recentTransfers: transfers.status === 'fulfilled' ? transfers.value : [],
          },
          timestamp: new Date().toISOString(),
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }

      case 'whales': {
        const minEth = intParam(searchParams, 'minEth', { fallback: 100, min: 0, max: 1000000000 });
        const whales = await detectWhaleTransactions(minEth);
        return NextResponse.json({ status: 'ok', data: whales, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'dashboard':
      default: {
        const dashboard = await getOnChainDashboard();
        return NextResponse.json({ status: 'ok', data: dashboard, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch on-chain data', details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error' },
      { status: 500 },
    );
  }
}
