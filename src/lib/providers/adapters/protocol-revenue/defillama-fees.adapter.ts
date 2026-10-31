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
 * DefiLlama Fees Adapter
 *
 * DefiLlama provides comprehensive fee/revenue data:
 * - 500+ protocols tracked
 * - Daily, weekly, monthly aggregations
 * - No API key required
 *
 * @module providers/adapters/protocol-revenue/defillama-fees
 */

import { getLlamaFeesOverview, LLAMA_API } from '@/lib/apis/llama-bulk';
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { ProtocolRevenue } from './types';

const BASE = LLAMA_API;

const RATE_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

export const defillamaFeesAdapter: DataProvider<ProtocolRevenue[]> = {
  name: 'defillama-fees',
  description: 'DefiLlama — protocol fees & revenue for 500+ protocols',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['protocol-revenue'],

  async fetch(params: FetchParams): Promise<ProtocolRevenue[]> {
    const limit = params.limit ?? 50;

    // The fees overview has no revenue fields; revenue is the same overview
    // with dataType=dailyRevenue. Revenue is optional: fees alone still rank.
    const [fees, revenue] = await Promise.all([
      getLlamaFeesOverview<DefiLlamaFeeProtocol>(),
      getLlamaFeesOverview<DefiLlamaFeeProtocol>({ dataType: 'dailyRevenue' }).catch(() => null),
    ]);
    const revenueByKey = new Map<string, DefiLlamaFeeProtocol>();
    for (const row of revenue?.protocols ?? []) revenueByKey.set(rowKey(row), row);
    const now = new Date().toISOString();

    // filter() copies, so sorting never touches the shared cached array.
    return fees.protocols
      .filter((p) => (p.total24h ?? 0) > 0)
      .sort((a, b) => (b.total24h ?? 0) - (a.total24h ?? 0))
      .slice(0, limit)
      .map((p): ProtocolRevenue => {
        const rev = revenueByKey.get(rowKey(p));
        return {
          name: p.name ?? 'Unknown',
          slug: p.slug ?? '',
          dailyFees: p.total24h ?? 0,
          dailyRevenue: rev?.total24h ?? 0,
          totalFees: p.totalAllTime ?? 0,
          totalRevenue: rev?.totalAllTime ?? 0,
          weeklyFees: p.total7d ?? 0,
          monthlyFees: p.total30d ?? 0,
          category: p.category ?? 'Unknown',
          chains: p.chains ?? [],
          source: 'defillama-fees',
          timestamp: now,
        };
      });
  },

  async healthCheck(): Promise<boolean> {
    try {
      // /v2/chains is ~60 KB; the fees overview is several MB.
      const res = await fetch(`${BASE}/v2/chains`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: ProtocolRevenue[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface DefiLlamaFeeProtocol {
  name?: string;
  slug?: string;
  category?: string;
  chains?: string[];
  total24h?: number | null;
  total7d?: number | null;
  total30d?: number | null;
  totalAllTime?: number | null;
}

function rowKey(row: DefiLlamaFeeProtocol): string {
  return row.slug || (row.name ?? '').toLowerCase().replace(/\s+/g, '-');
}
