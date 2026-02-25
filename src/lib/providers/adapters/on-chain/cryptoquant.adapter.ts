/**
 * CryptoQuant Adapter — Exchange Flows + On-chain Indicators
 *
 * CryptoQuant specializes in:
 * - Exchange reserve tracking (all exchanges)
 * - Inflow/outflow analysis
 * - Miner flows
 * - Stablecoin supply ratio
 * - Inter-entity flows
 * - Estimated leverage ratio
 *
 * Requires CRYPTOQUANT_API_KEY env var.
 * Free tier: limited endpoints.
 *
 * API: https://docs.cryptoquant.com/
 * env: CRYPTOQUANT_API_KEY
 *
 * @module providers/adapters/on-chain/cryptoquant
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OnChainMetric } from './types';

const CRYPTOQUANT_BASE = 'https://api.cryptoquant.com/v1';
const CRYPTOQUANT_API_KEY = process.env.CRYPTOQUANT_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: CRYPTOQUANT_API_KEY ? 30 : 0,
  windowMs: 60_000,
};

// Endpoints to fetch  
const ENDPOINTS = [
  { path: '/btc/exchange-flows/reserve', name: 'exchange_reserve', unit: 'BTC' },
  { path: '/btc/exchange-flows/inflow', name: 'exchange_inflow', unit: 'BTC' },
  { path: '/btc/exchange-flows/outflow', name: 'exchange_outflow', unit: 'BTC' },
  { path: '/btc/network-indicator/estimated-leverage-ratio', name: 'estimated_leverage_ratio', unit: 'ratio' },
  { path: '/btc/miner-flows/miner-to-exchange', name: 'miner_to_exchange', unit: 'BTC' },
  { path: '/btc/market-indicator/stablecoin-supply-ratio', name: 'stablecoin_supply_ratio', unit: 'ratio' },
];

export const cryptoquantAdapter: DataProvider<OnChainMetric[]> = {
  name: 'cryptoquant',
  description: 'CryptoQuant — Exchange flows, miner flows, leverage ratio, stablecoin supply ratio',
  priority: 2,
  weight: 0.45,
  rateLimit: RATE_LIMIT,
  capabilities: ['on-chain'],

  async fetch(params: FetchParams): Promise<OnChainMetric[]> {
    if (!CRYPTOQUANT_API_KEY) {
      throw new Error('CRYPTOQUANT_API_KEY not configured');
    }

    const now = new Date();

    // Determine asset-specific endpoints
    const asset = params.symbols?.[0]?.toUpperCase() || 'BTC';
    const endpoints = asset === 'BTC' ? ENDPOINTS : ENDPOINTS.map(e => ({
      ...e,
      path: e.path.replace('/btc/', `/${asset.toLowerCase()}/`),
      unit: e.unit === 'BTC' ? asset : e.unit,
    }));

    const results = await Promise.allSettled(
      endpoints.map(async (ep): Promise<OnChainMetric> => {
        const url = `${CRYPTOQUANT_BASE}${ep.path}?window=day&limit=1`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'free-crypto-news/2.0',
            Authorization: `Bearer ${CRYPTOQUANT_API_KEY}`,
          },
        });

        if (!res.ok) throw new Error(`CryptoQuant ${ep.name}: ${res.status}`);

        const json = await res.json();
        const latestEntry = json.result?.data?.[0];

        return {
          metricId: ep.name,
          name: ep.name.replace(/_/g, ' '),
          value: latestEntry?.value ?? latestEntry?.reserve ?? 0,
          asset,
          unit: ep.unit,
          resolution: '1d',
          change: 0,
          source: 'cryptoquant',
          timestamp: latestEntry?.datetime
            ? new Date(latestEntry.datetime).toISOString()
            : now.toISOString(),
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<OnChainMetric> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    if (!CRYPTOQUANT_API_KEY) return false;
    try {
      const res = await fetch(
        `${CRYPTOQUANT_BASE}/btc/exchange-flows/reserve?window=day&limit=1`,
        {
          headers: { Authorization: `Bearer ${CRYPTOQUANT_API_KEY}` },
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: OnChainMetric[]): OnChainMetric[] {
    return data;
  },
};

export default cryptoquantAdapter;
