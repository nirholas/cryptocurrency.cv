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
import * as helius from '@/lib/apis/helius';
import * as shyft from '@/lib/apis/shyft';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Solana Deep Data API
 *
 * Aggregates Helius (token balances, NFTs, transactions, DAS) and
 * Shyft (DeFi positions, parsed transactions, token metadata).
 *
 * GET /api/solana                        — overview of available endpoints
 * GET /api/solana?address=<addr>         — wallet summary (balances + DeFi + recent txs)
 * GET /api/solana?address=<addr>&view=balances    — token balances only
 * GET /api/solana?address=<addr>&view=nfts        — NFTs only
 * GET /api/solana?address=<addr>&view=transactions — transaction history
 * GET /api/solana?address=<addr>&view=defi        — DeFi positions
 * GET /api/solana?address=<addr>&view=assets      — DAS digital assets
 * GET /api/solana?mint=<addr>                     — token metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const mint = searchParams.get('mint');
    const view = searchParams.get('view');

    // Token metadata lookup by mint
    if (mint) {
      const metadata = await shyft.getTokenMetadata(mint);
      return NextResponse.json({
        data: metadata,
        source: 'shyft',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Without an address, return endpoint documentation
    if (!address) {
      return NextResponse.json({
        chain: 'solana',
        endpoints: {
          walletSummary: '/api/solana?address=<wallet>',
          tokenBalances: '/api/solana?address=<wallet>&view=balances',
          nfts: '/api/solana?address=<wallet>&view=nfts',
          transactions: '/api/solana?address=<wallet>&view=transactions',
          defiPositions: '/api/solana?address=<wallet>&view=defi',
          digitalAssets: '/api/solana?address=<wallet>&view=assets',
          tokenMetadata: '/api/solana?mint=<token_address>',
        },
        dataSources: ['helius', 'shyft'],
        subroutes: {
          balances: '/api/solana/balances?address=<wallet>',
          nfts: '/api/solana/nfts?address=<wallet>',
          transactions: '/api/solana/transactions?address=<wallet>',
          defi: '/api/solana/defi?address=<wallet>',
          assets: '/api/solana/assets?address=<wallet>',
          collections: '/api/solana/collections?groupKey=collection&groupValue=<addr>',
          search: '/api/solana/search?owner=<wallet>&compressed=true',
          tokens: '/api/solana/tokens?owner=<wallet>',
          wallet: '/api/solana/wallet?address=<wallet>',
          priorityFees: '/api/solana/priority-fees?accounts=<addr1>,<addr2>',
        },
        relatedChains: {
          sui: '/api/sui',
          aptos: '/api/aptos',
        },
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=3600' },
      });
    }

    // Address-based queries
    switch (view) {
      case 'balances': {
        const data = await helius.getTokenBalances(address);
        return NextResponse.json({
          data,
          source: 'helius',
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }

      case 'nfts': {
        const data = await helius.getNFTsByWallet(address);
        return NextResponse.json({
          count: data.length,
          data,
          source: 'helius',
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        });
      }

      case 'transactions': {
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const data = await helius.getTransactionHistory(address, { limit: Math.min(limit, 100) });
        return NextResponse.json({
          count: data.length,
          data,
          source: 'helius',
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'defi': {
        const data = await shyft.getDeFiPositions(address);
        return NextResponse.json({
          data,
          source: 'shyft',
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }

      case 'assets': {
        const data = await helius.getDASAssets(address);
        return NextResponse.json({
          data,
          source: 'helius',
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        });
      }

      default: {
        // Full wallet summary — combine Helius + Shyft
        const [heliusSummary, shyftSummary] = await Promise.allSettled([
          helius.getWalletSummary(address),
          shyft.getWalletDeFiSummary(address),
        ]);

        return NextResponse.json({
          address,
          helius: heliusSummary.status === 'fulfilled' ? heliusSummary.value : null,
          shyft: shyftSummary.status === 'fulfilled' ? shyftSummary.value : null,
          sources: ['helius', 'shyft'],
          timestamp: new Date().toISOString(),
        }, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Solana data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
