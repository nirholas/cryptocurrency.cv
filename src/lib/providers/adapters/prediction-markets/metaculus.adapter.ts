/**
 * Metaculus Adapter
 *
 * Metaculus is a high-quality forecasting platform:
 * - Expert-calibrated predictions
 * - Public API, no key needed
 * - Covers crypto, AI, science, geopolitics
 *
 * @module providers/adapters/prediction-markets/metaculus
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { PredictionMarket } from './types';

const BASE = 'https://www.metaculus.com/api2';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };

export const metaculusAdapter: DataProvider<PredictionMarket[]> = {
  name: 'metaculus',
  description: 'Metaculus — expert forecasting platform',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['prediction-markets'],

  async fetch(params: FetchParams): Promise<PredictionMarket[]> {
    const limit = params.limit ?? 25;
    const search = (params.extra?.search as string) || 'crypto OR bitcoin OR ethereum';

    const res = await fetch(
      `${BASE}/questions/?search=${encodeURIComponent(search)}&status=open&limit=${limit}&order_by=-activity`,
    );
    if (!res.ok) throw new Error(`Metaculus API: ${res.status}`);

    const json = await res.json();
    const questions: MetaculusQuestion[] = json.results ?? [];
    const now = new Date().toISOString();

    return questions.map((q): PredictionMarket => ({
      id: String(q.id ?? ''),
      title: q.title ?? 'Unknown',
      url: q.url ?? `https://www.metaculus.com/questions/${q.id}`,
      probability: q.community_prediction?.full?.q2 ?? 0.5,
      volumeUsd: 0,
      liquidityUsd: 0,
      numTraders: q.number_of_predictions ?? 0,
      category: 'crypto',
      endDate: q.resolve_time ?? '',
      status: 'open',
      source: 'metaculus',
      timestamp: now,
    }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/questions/?limit=1`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: PredictionMarket[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface MetaculusQuestion {
  id?: number;
  title?: string;
  url?: string;
  resolve_time?: string;
  number_of_predictions?: number;
  community_prediction?: {
    full?: { q1?: number; q2?: number; q3?: number };
  };
}
