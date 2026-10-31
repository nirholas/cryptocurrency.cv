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
 * Blockchain Gaming Data Types
 * @module providers/adapters/gaming-data/types
 */

/**
 * Activity metrics are `null` when the source does not report them. They are
 * never zero-filled, so "0 players" always means zero, not "unknown".
 */
export interface GameData {
  name: string;
  slug: string;
  chain: string;
  dau: number | null;             // daily active users
  transactions24h: number | null;
  volume24h: number | null;       // USD
  category: string;               // 'game' | 'metaverse' | 'gambling'
  balance: number | null;         // value locked in the game's contracts, USD
  change24h: number | null;       // 24h change of `balance`, percent
  logo: string | null;
  url: string | null;
  timestamp: string;
}

/** Metric `topGames` is ordered by. */
export type GamingRanking = 'dau' | 'tvl';

export interface GamingOverview {
  totalDau: number | null;
  totalVolume24h: number | null;
  /** Sum of `balance` across `topGames`. */
  totalTvl: number | null;
  topGames: GameData[];
  /** Number of games in `topGames` per chain. */
  byChain: Record<string, number>;
  rankedBy: GamingRanking;
  /** Provider that produced this overview. */
  source: string;
  timestamp: string;
}
