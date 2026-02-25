/**
 * Bybit Funding Rate Adapter
 *
 * Bybit is a top-5 perpetual futures exchange:
 * - 400+ linear/inverse perpetuals
 * - Funding every 8 hours
 * - No API key required for public endpoints
 * - 120 req/min rate limit
 *
 * @module providers/adapters/funding-rate/bybit
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FundingRate } from './types';

const BASE = 'https://api.bybit.com';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};

export const bybitFundingAdapter: DataProvider<FundingRate[]> = {
  name: 'bybit',
  description: 'Bybit V5 API — funding rates for 400+ perpetual contracts',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['funding-rate', 'open-interest'],

  async fetch(params: FetchParams): Promise<FundingRate[]> {
    // Fetch tickers which include funding rate info
    const url = `${BASE}/v5/market/tickers?category=linear`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const json: BybitResponse = await response.json();

    if (json.retCode !== 0) {
      throw new Error(`Bybit API error: ${json.retMsg}`);
    }

    let tickers = json.result.list ?? [];

    // Filter USDT pairs only
    tickers = tickers.filter(t => t.symbol.endsWith('USDT'));

    // Filter by requested symbols
    if (params.symbols?.length) {
      const symbolSet = new Set(params.symbols.map(s => s.toUpperCase()));
      tickers = tickers.filter(t => symbolSet.has(t.symbol));
    }

    // Limit results
    const limit = params.limit ?? 100;
    tickers = tickers.slice(0, limit);

    return tickers.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/v5/market/time`, {
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

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitTicker[];
  };
}

interface BybitTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: string;
  openInterestValue: string;
  volume24h: string;
  turnover24h: string;
}

function normalize(raw: BybitTicker): FundingRate {
  const rate = parseFloat(raw.fundingRate) || 0;
  const baseAsset = raw.symbol.replace(/USDT$/, '');

  return {
    symbol: raw.symbol,
    baseAsset,
    exchange: 'bybit',
    fundingRate: rate,
    annualizedRate: rate * 3 * 365,
    nextFundingTime: raw.nextFundingTime
      ? new Date(parseInt(raw.nextFundingTime)).toISOString()
      : '',
    markPrice: parseFloat(raw.markPrice) || 0,
    indexPrice: parseFloat(raw.indexPrice) || 0,
    openInterestUsd: parseFloat(raw.openInterestValue) || 0,
    timestamp: new Date().toISOString(),
  };
}
