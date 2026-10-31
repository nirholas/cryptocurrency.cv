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

import { getLlamaYieldPools } from '@/lib/apis/llama-bulk';
export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

/**
 * GET /api/yields
 *
 * Get top DeFi yields from lending, staking, and liquidity protocols
 * Uses DeFiLlama API (free)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  try {
    const pools = await getLlamaYieldPools();
    const chainLower = chain?.toLowerCase();

    // filter() copies, so sorting never touches the shared cached array.
    const topPools = pools
      .filter(
        (p) =>
          (!chainLower || p.chain.toLowerCase() === chainLower) &&
          (p.apy ?? 0) > 0 &&
          p.tvlUsd > 100000,
      )
      .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))
      .slice(0, limit)
      .map((p) => ({
        pool: p.pool,
        chain: p.chain,
        project: p.project,
        symbol: p.symbol,
        tvlUsd: Math.round(p.tvlUsd),
        apy: {
          total: p.apy?.toFixed(2),
          base: p.apyBase?.toFixed(2),
          reward: p.apyReward?.toFixed(2),
        },
        stablecoin: p.stablecoin || false,
        ilRisk: p.ilRisk || 'unknown',
      }));

    return NextResponse.json({
      chain: chain || 'all',
      count: topPools.length,
      yields: topPools,
      timestamp: new Date().toISOString(),
      source: 'defillama',
    });
  } catch (error) {
    console.error('Yields API error:', error);
    return NextResponse.json({ error: 'Failed to fetch DeFi yields' }, { status: 500 });
  }
}
