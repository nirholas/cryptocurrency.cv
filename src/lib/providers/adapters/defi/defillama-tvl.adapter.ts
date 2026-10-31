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
 * DefiLlama TVL Adapter — Protocol and chain TVL data
 *
 * DefiLlama is the gold standard for DeFi TVL data:
 * - 5,000+ protocols tracked
 * - 200+ chains
 * - Completely free, no API key required
 * - No rate limit (be reasonable)
 *
 * @module providers/adapters/defi/defillama-tvl
 */

import { getLlamaProtocols } from '@/lib/apis/llama-bulk';
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { ProtocolTvl } from './types';

const BASE = 'https://api.llama.fi';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export const defillamaTvlAdapter: DataProvider<ProtocolTvl[]> = {
  name: 'defillama-tvl',
  description: 'DefiLlama — TVL data for 5,000+ DeFi protocols across 200+ chains',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['tvl'],

  async fetch(params: FetchParams): Promise<ProtocolTvl[]> {
    // Copy: the shared cached array must not be sorted in place.
    let protocols: LlamaProtocol[] = [...(await getLlamaProtocols<LlamaProtocol>())];

    // Filter by chain if specified
    if (params.chain) {
      protocols = protocols.filter(p =>
        p.chains?.includes(params.chain!) || p.chain === params.chain,
      );
    }

    // Filter by category
    if (params.category) {
      protocols = protocols.filter(p =>
        p.category?.toLowerCase() === params.category!.toLowerCase(),
      );
    }

    // Sort by TVL descending and limit
    protocols.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    const limit = params.limit ?? 100;
    protocols = protocols.slice(0, limit);

    return protocols.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/v2/chains`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: ProtocolTvl[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.tvl === 'number' &&
      typeof item.name === 'string',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface LlamaProtocol {
  id: string;
  name: string;
  slug: string;
  category: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
  url: string;
  logo: string;
}

function normalize(raw: LlamaProtocol): ProtocolTvl {
  return {
    id: raw.slug ?? raw.id,
    name: raw.name,
    category: raw.category ?? 'Unknown',
    chain: raw.chain ?? 'Multi',
    chains: raw.chains ?? [],
    tvl: raw.tvl ?? 0,
    tvlChange1d: raw.change_1d ?? 0,
    tvlChange7d: raw.change_7d ?? 0,
    url: raw.url ?? '',
    logo: raw.logo ?? '',
    timestamp: new Date().toISOString(),
  };
}
