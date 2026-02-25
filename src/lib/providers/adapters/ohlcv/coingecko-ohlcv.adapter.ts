/**
 * CoinGecko OHLCV Adapter
 *
 * @module providers/adapters/ohlcv/coingecko-ohlcv
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OHLCVData } from './types';

const BASE = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 500 : 30,
  windowMs: 60_000,
};

export const coingeckoOhlcvAdapter: DataProvider<OHLCVData[]> = {
  name: 'coingecko-ohlcv',
  description: 'CoinGecko — OHLC candle data for 13,000+ coins',
  priority: 3,
  weight: 0.35,
  rateLimit: RATE_LIMIT,
  capabilities: ['ohlcv'],

  async fetch(params: FetchParams): Promise<OHLCVData[]> {
    const coinIds = params.coinIds ?? ['bitcoin'];
    const days = params.extra?.days ?? 30;
    const vsCurrency = params.vsCurrency ?? 'usd';

    const results = await Promise.allSettled(
      coinIds.map(async (coinId): Promise<OHLCVData> => {
        const url = `${BASE}/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`;
        const headers: Record<string, string> = {};
        if (API_KEY) headers['x-cg-demo-key'] = API_KEY;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`CoinGecko OHLC ${coinId}: ${res.status}`);

        const data: [number, number, number, number, number][] = await res.json();

        return {
          symbol: coinId,
          exchange: 'coingecko',
          interval: (days as number) <= 1 ? '30m' : (days as number) <= 30 ? '4h' : '4d',
          candles: data.map(([t, o, h, l, c]) => ({
            timestamp: t,
            open: o,
            high: h,
            low: l,
            close: c,
            volume: 0,
          })),
          lastUpdated: new Date().toISOString(),
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<OHLCVData> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/ping`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OHLCVData[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};
