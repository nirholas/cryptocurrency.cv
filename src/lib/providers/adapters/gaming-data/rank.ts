/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Sorting and per-chain aggregation for the /api/gaming routes.
 *
 * Metrics are nullable because each provider reports a different subset
 * (DefiLlama has value locked, Footprint has players and volume). A missing
 * value sorts last and never counts as zero in a total.
 *
 * @module providers/adapters/gaming-data/rank
 */

import type { GameData } from './types';

export type GameSortKey = 'dau' | 'volume' | 'tvl';

const SORT_FIELD: Record<GameSortKey, (game: GameData) => number | null> = {
  dau: (game) => game.dau,
  volume: (game) => game.volume24h,
  tvl: (game) => game.balance,
};

/** Map a `?sort=` value to a sort key. `players` is an alias for `dau`. */
export function parseGameSort(value: string | null): GameSortKey | null {
  if (value === null || value === '') return null;
  if (value === 'players') return 'dau';
  return Object.hasOwn(SORT_FIELD, value) ? (value as GameSortKey) : null;
}

/**
 * Sort games by a metric, highest first. Games without the metric go last
 * and keep the provider's order among themselves.
 */
export function sortGames(games: readonly GameData[], key: GameSortKey): GameData[] {
  const read = SORT_FIELD[key];
  return games
    .map((game, index) => ({ game, index, value: read(game) }))
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.index - b.index;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return b.value - a.value || a.index - b.index;
    })
    .map(({ game }) => game);
}

export interface GamingChainStats {
  chain: string;
  games: number;
  totalDau: number | null;
  totalVolume: number | null;
  totalTvl: number | null;
}

function addKnown(total: number | null, value: number | null): number | null {
  if (value === null) return total;
  return (total ?? 0) + value;
}

/** Per-chain game counts and totals, ordered by game count then value locked. */
export function aggregateByChain(games: readonly GameData[]): GamingChainStats[] {
  const byChain = new Map<string, GamingChainStats>();

  for (const game of games) {
    const chain = game.chain || 'Unknown';
    const stats = byChain.get(chain) ?? {
      chain,
      games: 0,
      totalDau: null,
      totalVolume: null,
      totalTvl: null,
    };
    stats.games += 1;
    stats.totalDau = addKnown(stats.totalDau, game.dau);
    stats.totalVolume = addKnown(stats.totalVolume, game.volume24h);
    stats.totalTvl = addKnown(stats.totalTvl, game.balance);
    byChain.set(chain, stats);
  }

  return Array.from(byChain.values()).sort(
    (a, b) => b.games - a.games || (b.totalTvl ?? -1) - (a.totalTvl ?? -1),
  );
}
