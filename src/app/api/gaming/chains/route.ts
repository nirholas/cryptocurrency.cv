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
 * GET /api/gaming/chains
 *
 * Returns a breakdown of blockchain gaming activity per chain.
 * Shows which chains have the most gaming dApps, players, and volume.
 */

import { NextResponse } from 'next/server';
import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await gamingDataChain.fetch({ extra: { breakdown: 'chains' } });
    const games = Array.isArray(result.data) ? result.data : [];

    // Aggregate by chain
    const chainMap = new Map<string, { games: number; totalDau: number; totalVolume: number }>();

    for (const game of games) {
      const g = game as Record<string, unknown>;
      const chain = (g.chain as string) || 'unknown';
      const existing = chainMap.get(chain) || { games: 0, totalDau: 0, totalVolume: 0 };
      existing.games += 1;
      existing.totalDau += (g.dau as number) ?? 0;
      existing.totalVolume += (g.volume as number) ?? 0;
      chainMap.set(chain, existing);
    }

    const chains = Array.from(chainMap.entries())
      .map(([chain, stats]) => ({
        chain,
        games: stats.games,
        totalDau: stats.totalDau,
        totalVolume: stats.totalVolume,
      }))
      .sort((a, b) => b.totalDau - a.totalDau);

    return NextResponse.json({
      data: chains,
      count: chains.length,
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Gaming/Chains] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaming chain data', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
