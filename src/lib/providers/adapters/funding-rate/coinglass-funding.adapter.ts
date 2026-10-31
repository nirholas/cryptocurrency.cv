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
 * CoinGlass Funding Rate Adapter
 *
 * CoinGlass aggregates funding rates from ALL major exchanges:
 * - Binance, Bybit, OKX, Bitget, Gate, dYdX, Hyperliquid, etc.
 * - Single API call gets rates across all venues
 * - Free tier: 10 requests/minute
 *
 * Requires COINGLASS_API_KEY env var.
 * Signup: https://www.coinglass.com/pricing
 *
 * @module providers/adapters/funding-rate/coinglass-funding
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FundingRate } from './types';

const BASE = 'https://open-api-v3.coinglass.com/api/futures';
const API_KEY = process.env.COINGLASS_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 10 : 0,
  windowMs: 60_000,
};

export const coinglassFundingAdapter: DataProvider<FundingRate[]> = {
  name: 'coinglass-funding',
  description: 'CoinGlass — aggregated funding rates from all major exchanges',
  priority: 6,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['funding-rate'],

  async fetch(params: FetchParams): Promise<FundingRate[]> {
    if (!API_KEY) throw new Error('COINGLASS_API_KEY not configured');

    const symbol = params.symbols?.[0]?.toUpperCase() || 'BTC';
    const res = await fetch(`${BASE}/funding-rates-history?symbol=${encodeURIComponent(symbol)}&limit=100`, {
      headers: { 'CG-API-KEY': API_KEY, Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`CoinGlass API error: ${res.status}`);

    const json = await res.json();
    const data: CGFundingRate[] = json.data ?? [];

    return data.slice(0, params.limit ?? 100).map((raw) => ({
      symbol: `${symbol}USDT`,
      baseAsset: symbol,
      exchange: raw.exchangeName?.toLowerCase() ?? 'unknown',
      fundingRate: raw.rate ?? 0,
      annualizedRate: (raw.rate ?? 0) * 3 * 365,
      nextFundingTime: new Date(Date.now() + 8 * 3600_000).toISOString(),
      markPrice: raw.price ?? 0,
      indexPrice: raw.price ?? 0,
      openInterestUsd: raw.openInterest ?? 0,
      timestamp: raw.createTime
        ? new Date(raw.createTime).toISOString()
        : new Date().toISOString(),
    }));
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/funding-rates-history?symbol=BTC&limit=1`, {
        headers: { 'CG-API-KEY': API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: FundingRate[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface CGFundingRate {
  exchangeName: string;
  symbol: string;
  rate: number;
  price: number;
  openInterest: number;
  createTime: number;
}
