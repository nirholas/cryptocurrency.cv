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
 * Footprint Analytics Adapter — On-chain gaming analytics
 *
 * @see https://docs.footprint.network/
 * @module providers/adapters/gaming-data/footprint
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import { summarizeGames } from './summarize';
import type { GamingOverview, GameData } from './types';

const FP_BASE = 'https://api.footprint.network/api/v1';
const FP_API_KEY = process.env.FOOTPRINT_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };

interface FootprintGame {
  protocol_name?: string;
  protocol_slug?: string;
  chain?: string;
  active_addresses_24h?: number | null;
  transactions_24h?: number | null;
  volume_24h?: number | null;
  tvl?: number | null;
  logo?: string | null;
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export const footprintAdapter: DataProvider<GamingOverview> = {
  name: 'footprint',
  description: 'Footprint Analytics — on-chain gaming data',
  priority: 1,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['gaming-data'],

  async fetch(params: FetchParams): Promise<GamingOverview> {
    if (!FP_API_KEY) throw new Error('FOOTPRINT_API_KEY not configured');

    const limit = params.limit ?? 25;
    const url = `${FP_BASE}/protocol/ranking/GameFi?limit=${Math.min(limit, 50)}&sort=-active_addresses_24h`;

    const res = await fetch(url, {
      headers: { 'API-KEY': FP_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Footprint HTTP ${res.status}`);
    const json = (await res.json()) as { data?: FootprintGame[] };
    const timestamp = new Date().toISOString();

    const games: GameData[] = (json.data ?? []).map((d) => ({
      name: d.protocol_name ?? '',
      slug: d.protocol_slug ?? d.protocol_name ?? '',
      chain: d.chain ?? 'multi',
      dau: numberOrNull(d.active_addresses_24h),
      transactions24h: numberOrNull(d.transactions_24h),
      volume24h: numberOrNull(d.volume_24h),
      category: 'game',
      balance: numberOrNull(d.tvl),
      change24h: null,
      logo: d.logo ?? null,
      url: null,
      timestamp,
    }));

    return summarizeGames(games.slice(0, 25), 'dau', 'footprint');
  },

  async healthCheck(): Promise<boolean> {
    if (!FP_API_KEY) return false;
    try {
      const res = await fetch(`${FP_BASE}/protocol/ranking/GameFi?limit=1`, {
        headers: { 'API-KEY': FP_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch { return false; }
  },

  validate(data: GamingOverview): boolean {
    return Array.isArray(data.topGames);
  },
};
