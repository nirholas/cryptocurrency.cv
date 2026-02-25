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

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { ProtocolRevenue } from './types';

const BASE = 'https://api.llama.fi';

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

    const res = await fetch(`${BASE}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`);
    if (!res.ok) throw new Error(`DefiLlama fees: ${res.status}`);

    const json = await res.json();
    const protocols: DefiLlamaFeeProtocol[] = json.protocols ?? [];
    const now = new Date().toISOString();

    return protocols
      .sort((a, b) => (b.total24h ?? 0) - (a.total24h ?? 0))
      .slice(0, limit)
      .map((p): ProtocolRevenue => ({
        name: p.name ?? 'Unknown',
        slug: p.slug ?? '',
        dailyFees: p.total24h ?? 0,
        dailyRevenue: p.dailyRevenue ?? p.revenue24h ?? 0,
        totalFees: p.totalAllTime ?? 0,
        totalRevenue: 0,
        weeklyFees: p.total7d ?? 0,
        monthlyFees: p.total30d ?? 0,
        category: p.category ?? 'Unknown',
        chains: p.chains ?? [],
        source: 'defillama-fees',
        timestamp: now,
      }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/overview/fees?excludeTotalDataChart=true`, {
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
  total24h?: number;
  total7d?: number;
  total30d?: number;
  totalAllTime?: number;
  dailyRevenue?: number;
  revenue24h?: number;
}
