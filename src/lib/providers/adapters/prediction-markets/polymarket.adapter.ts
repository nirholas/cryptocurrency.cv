/**
 * Polymarket Adapter
 *
 * Polymarket is the largest prediction market:
 * - Ethereum L2 (Polygon) based
 * - Publicly available CLOB API
 * - High liquidity crypto markets
 *
 * @module providers/adapters/prediction-markets/polymarket
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { PredictionMarket } from './types';

const BASE = 'https://clob.polymarket.com';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const polymarketAdapter: DataProvider<PredictionMarket[]> = {
  name: 'polymarket',
  description: 'Polymarket — largest prediction market, crypto-native',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['prediction-markets'],

  async fetch(params: FetchParams): Promise<PredictionMarket[]> {
    const limit = params.limit ?? 25;

    const res = await fetch(`${BASE}/markets?limit=${limit}&active=true&closed=false`);
    if (!res.ok) throw new Error(`Polymarket API: ${res.status}`);

    const markets: PolymarketMarket[] = await res.json();
    const now = new Date().toISOString();

    return markets
      .filter((m) => m.active && !m.closed)
      .slice(0, limit)
      .map((m): PredictionMarket => ({
        id: m.condition_id ?? m.question_id ?? '',
        title: m.question ?? 'Unknown',
        url: `https://polymarket.com/event/${m.condition_id}`,
        probability: m.tokens?.[0]?.price ?? 0.5,
        volumeUsd: parseFloat(m.volume ?? '0') || 0,
        liquidityUsd: parseFloat(m.liquidity ?? '0') || 0,
        numTraders: m.num_traders ?? 0,
        category: m.category ?? 'crypto',
        endDate: m.end_date_iso ?? '',
        status: 'open',
        source: 'polymarket',
        timestamp: now,
      }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/markets?limit=1`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: PredictionMarket[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface PolymarketMarket {
  condition_id?: string;
  question_id?: string;
  question?: string;
  category?: string;
  active?: boolean;
  closed?: boolean;
  volume?: string;
  liquidity?: string;
  num_traders?: number;
  end_date_iso?: string;
  tokens?: Array<{ price?: number; token_id?: string; outcome?: string }>;
}
