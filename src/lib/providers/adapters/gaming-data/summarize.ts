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
 * Builds a GamingOverview from normalized games so every provider reports
 * totals and chain counts the same way.
 *
 * @module providers/adapters/gaming-data/summarize
 */

import type { GameData, GamingOverview, GamingRanking } from './types';

/** Sum a metric, or null when no game reports it. */
function sumKnown(games: readonly GameData[], pick: (game: GameData) => number | null): number | null {
  let total: number | null = null;
  for (const game of games) {
    const value = pick(game);
    if (value !== null) total = (total ?? 0) + value;
  }
  return total;
}

export function summarizeGames(
  games: GameData[],
  rankedBy: GamingRanking,
  source: string,
): GamingOverview {
  const byChain: Record<string, number> = {};
  for (const game of games) {
    byChain[game.chain] = (byChain[game.chain] ?? 0) + 1;
  }

  return {
    totalDau: sumKnown(games, (g) => g.dau),
    totalVolume24h: sumKnown(games, (g) => g.volume24h),
    totalTvl: sumKnown(games, (g) => g.balance),
    topGames: games,
    byChain,
    rankedBy,
    source,
    timestamp: new Date().toISOString(),
  };
}
