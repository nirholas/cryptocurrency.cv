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
 * DefiLlama Gaming Adapter — keyless gaming data from DefiLlama /protocols
 *
 * DefiLlama tracks on-chain games under the "Gaming" category with the value
 * locked in their contracts. It does not publish player counts or game
 * volume, so those fields are null and games are ranked by TVL.
 *
 * @see https://defillama.com/protocols/gaming
 * @module providers/adapters/gaming-data/defillama
 */

import { getLlamaProtocols, LLAMA_API, type LlamaProtocol } from '@/lib/apis/llama-bulk';
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import { summarizeGames } from './summarize';
import type { GameData, GamingOverview } from './types';

const GAMING_CATEGORY = 'gaming';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const RATE_LIMIT: RateLimitConfig = { maxRequests: 300, windowMs: 60_000 };

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function onChain(protocol: LlamaProtocol, chain: string): boolean {
  const wanted = chain.toLowerCase();
  if (protocol.chain?.toLowerCase() === wanted) return true;
  return protocol.chains?.some((c) => c.toLowerCase() === wanted) ?? false;
}

function toGame(protocol: LlamaProtocol, timestamp: string): GameData {
  return {
    name: protocol.name,
    slug: protocol.slug,
    chain: protocol.chain ?? protocol.chains?.[0] ?? 'Unknown',
    dau: null,
    transactions24h: null,
    volume24h: null,
    category: 'game',
    balance: finiteOrNull(protocol.tvl),
    change24h: finiteOrNull(protocol.change_1d),
    logo: protocol.logo ?? null,
    url: protocol.url ?? null,
    timestamp,
  };
}

export const defillamaGamingAdapter: DataProvider<GamingOverview> = {
  name: 'defillama-gaming',
  description: 'DefiLlama — on-chain games ranked by value locked, no API key',
  priority: 2,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['gaming-data'],

  async fetch(params: FetchParams): Promise<GamingOverview> {
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const { chain } = params;

    // filter() copies, so sorting does not touch the shared cached array.
    const games = (await getLlamaProtocols())
      .filter((p) => p.category?.toLowerCase() === GAMING_CATEGORY)
      .filter((p) => !chain || chain === 'all' || onChain(p, chain))
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, limit);

    const timestamp = new Date().toISOString();
    return summarizeGames(
      games.map((p) => toGame(p, timestamp)),
      'tvl',
      'defillama',
    );
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${LLAMA_API}/v2/chains`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: GamingOverview): boolean {
    return Array.isArray(data.topGames);
  },
};
