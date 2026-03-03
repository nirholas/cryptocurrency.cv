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
 * Token Unlocks Types — Shared types for token vesting/unlock data
 *
 * @module providers/adapters/token-unlocks/types
 */

/** A scheduled token unlock event */
export interface TokenUnlockEvent {
  /** Project / token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Unlock date (ISO 8601) */
  unlockDate: string;
  /** USD value of tokens being unlocked */
  unlockValueUsd: number;
  /** Number of tokens being unlocked */
  unlockTokens: number;
  /** Percentage of circulating supply being unlocked */
  unlockPctCirculating: number;
  /** Percentage of total supply being unlocked */
  unlockPctTotal: number;
  /** Current token price (USD) */
  price: number;
  /** Market cap (USD) */
  marketCap: number;
  /** Category of unlock (cliff, linear, team, investor, ecosystem, etc.) */
  unlockCategory: string;
  /** CoinGecko ID if available */
  coingeckoId?: string;
  /** Data source */
  source: string;
  /** Data timestamp */
  timestamp: string;
}
