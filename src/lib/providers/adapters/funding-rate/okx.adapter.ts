/**
 * OKX Funding Rate Adapter
 *
 * OKX is a top-3 derivatives exchange globally:
 * - 500+ perpetual swaps
 * - Funding every 8 hours
 * - No API key for public endpoints
 * - 20 req/2s rate limit
 *
 * @module providers/adapters/funding-rate/okx
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FundingRate } from './types';

const BASE = 'https://www.okx.com/api/v5';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export const okxFundingAdapter: DataProvider<FundingRate[]> = {
  name: 'okx',
  description: 'OKX V5 API — funding rates for 500+ perpetual swap contracts',
  priority: 3,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['funding-rate', 'open-interest'],

  async fetch(params: FetchParams): Promise<FundingRate[]> {
    // OKX requires fetching one instrument at a time for funding rates,
    // but tickers come in bulk
    const url = `${BASE}/public/funding-rate`;

    // If specific symbols requested, batch them
    if (params.symbols?.length) {
      const results = await Promise.allSettled(
        params.symbols.map(async (sym) => {
          const instId = `${sym.toUpperCase().replace('USDT', '')}-USDT-SWAP`;
          const res = await fetch(`${url}?instId=${instId}`);
          if (!res.ok) throw new Error(`OKX ${instId}: ${res.status}`);
          const json: OkxResponse = await res.json();
          return json.data?.[0];
        }),
      );

      return results
        .filter((r): r is PromiseFulfilledResult<OkxFundingData> =>
          r.status === 'fulfilled' && r.value != null,
        )
        .map(r => normalize(r.value));
    }

    // Default: fetch top perpetual tickers, then get funding for each
    const tickerRes = await fetch(`${BASE}/market/tickers?instType=SWAP`);
    if (!tickerRes.ok) {
      throw new Error(`OKX tickers API error: ${tickerRes.status}`);
    }

    const tickerJson: OkxResponse<OkxTickerData> = await tickerRes.json();
    const tickers = (tickerJson.data ?? [])
      .filter(t => t.instId.endsWith('-USDT-SWAP'))
      .slice(0, params.limit ?? 50);

    // Batch funding rate requests (with concurrency limit)
    const batchSize = 10;
    const allRates: FundingRate[] = [];

    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (t) => {
          const res = await fetch(`${url}?instId=${t.instId}`);
          if (!res.ok) return null;
          const json: OkxResponse = await res.json();
          const data = json.data?.[0];
          if (!data) return null;
          return {
            ...data,
            _markPrice: t.last,
            _openInterestUsd: parseFloat(t.last) * parseFloat(t.volCcy24h || '0'),
          };
        }),
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          allRates.push(normalize(r.value));
        }
      }
    }

    return allRates;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/public/time`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: FundingRate[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.fundingRate === 'number' &&
      typeof item.symbol === 'string',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface OkxResponse<T = OkxFundingData> {
  code: string;
  msg: string;
  data: T[];
}

interface OkxFundingData {
  instId: string;
  instType: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
  _markPrice?: string;
  _openInterestUsd?: number;
}

interface OkxTickerData {
  instId: string;
  last: string;
  volCcy24h: string;
}

function normalize(raw: OkxFundingData): FundingRate {
  const rate = parseFloat(raw.fundingRate) || 0;
  // OKX instId format: "BTC-USDT-SWAP" → extract base
  const parts = raw.instId.split('-');
  const baseAsset = parts[0] ?? '';

  return {
    symbol: `${baseAsset}USDT`,
    baseAsset,
    exchange: 'okx',
    fundingRate: rate,
    annualizedRate: rate * 3 * 365,
    nextFundingTime: raw.nextFundingTime
      ? new Date(parseInt(raw.nextFundingTime)).toISOString()
      : '',
    markPrice: parseFloat(raw._markPrice ?? '0'),
    indexPrice: 0,
    openInterestUsd: raw._openInterestUsd ?? 0,
    timestamp: raw.fundingTime
      ? new Date(parseInt(raw.fundingTime)).toISOString()
      : new Date().toISOString(),
  };
}
