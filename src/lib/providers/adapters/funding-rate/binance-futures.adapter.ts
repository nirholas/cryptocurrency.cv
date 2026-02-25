/**
 * Binance Futures Funding Rate Adapter
 *
 * Binance Futures is the highest-volume perpetual futures exchange:
 * - 300+ perpetual contracts
 * - Funding every 8 hours (00:00, 08:00, 16:00 UTC)
 * - No API key required for public endpoints
 * - 2400 req/min rate limit
 *
 * @module providers/adapters/funding-rate/binance-futures
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FundingRate } from './types';

const BASE = 'https://fapi.binance.com';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 200,
  windowMs: 60_000,
};

export const binanceFundingAdapter: DataProvider<FundingRate[]> = {
  name: 'binance-futures',
  description: 'Binance USDⓈ-M Futures — funding rates, OI for 300+ perpetuals',
  priority: 1,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['funding-rate', 'open-interest'],

  async fetch(params: FetchParams): Promise<FundingRate[]> {
    // Fetch funding rates and premium index in parallel
    const [fundingRes, premiumRes] = await Promise.all([
      fetch(`${BASE}/fapi/v1/fundingRate?limit=1000`),
      fetch(`${BASE}/fapi/v1/premiumIndex`),
    ]);

    if (!fundingRes.ok || !premiumRes.ok) {
      throw new Error(`Binance Futures API error: funding=${fundingRes.status}, premium=${premiumRes.status}`);
    }

    const premiumData: BinancePremiumIndex[] = await premiumRes.json();

    // Filter by requested symbols if specified
    let filtered = premiumData;
    if (params.symbols?.length) {
      const symbolSet = new Set(params.symbols.map(s => s.toUpperCase()));
      filtered = premiumData.filter(p => symbolSet.has(p.symbol));
    }

    // Limit results
    const limit = params.limit ?? 100;
    filtered = filtered.slice(0, limit);

    return filtered.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/fapi/v1/ping`, {
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

interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

function normalize(raw: BinancePremiumIndex): FundingRate {
  const rate = parseFloat(raw.lastFundingRate) || 0;
  const baseAsset = raw.symbol.replace(/USDT$|BUSD$|USD$/, '');

  return {
    symbol: raw.symbol,
    baseAsset,
    exchange: 'binance',
    fundingRate: rate,
    annualizedRate: rate * 3 * 365, // 3 fundings/day * 365 days
    nextFundingTime: new Date(raw.nextFundingTime).toISOString(),
    markPrice: parseFloat(raw.markPrice) || 0,
    indexPrice: parseFloat(raw.indexPrice) || 0,
    openInterestUsd: 0, // Requires separate endpoint
    timestamp: new Date(raw.time).toISOString(),
  };
}
