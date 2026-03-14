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
 * Bybit Open Interest Adapter
 *
 * Bybit V5 linear perpetuals — open interest data:
 * - 400+ perpetual contracts
 * - No API key required
 * - 120 req/min rate limit
 * - OI available per-symbol in the tickers endpoint
 *
 * @module providers/adapters/derivatives/bybit-oi
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OpenInterest, ExchangeOI } from './types';

const BASE = 'https://api.bybit.com/v5';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};

export const bybitOIAdapter: DataProvider<OpenInterest[]> = {
  name: 'bybit-oi',
  description: 'Bybit V5 API — open interest for 400+ linear perpetual contracts',
  priority: 3,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['open-interest'],

  async fetch(params: FetchParams): Promise<OpenInterest[]> {
    const url = `${BASE}/market/tickers?category=linear`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const json: BybitResponse = await response.json();

    if (json.retCode !== 0) {
      throw new Error(`Bybit API error: ${json.retMsg}`);
    }

    let tickers = (json.result.list ?? []).filter((t) => t.symbol.endsWith('USDT'));

    // Filter by requested symbols
    if (params.symbols?.length) {
      const symbolSet = new Set(
        params.symbols.map((s) => s.replace('USDT', '').replace('USD', '').toUpperCase()),
      );
      tickers = tickers.filter((t) => {
        const base = t.symbol.replace(/USDT$/, '');
        return symbolSet.has(base);
      });
    }

    const limit = params.limit ?? 50;

    const results: OpenInterest[] = tickers
      .filter((t) => parseFloat(t.openInterestValue) > 0)
      .map((t) => {
        const oiUsd = parseFloat(t.openInterestValue) || 0;
        const oiCoin = parseFloat(t.openInterest) || 0;
        const baseAsset = t.symbol.replace(/USDT$/, '');

        const exchanges: ExchangeOI[] = [
          {
            exchange: 'Bybit',
            openInterestUsd: oiUsd,
            openInterestCoin: oiCoin,
          },
        ];

        return {
          symbol: baseAsset,
          openInterestUsd: oiUsd,
          openInterestCoin: oiCoin,
          change24h: 0, // Bybit tickers don't include OI change
          exchanges,
          timestamp: new Date().toISOString(),
        };
      })
      .sort((a, b) => b.openInterestUsd - a.openInterestUsd)
      .slice(0, limit);

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/market/time`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OpenInterest[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(
      (item) => typeof item.symbol === 'string' && typeof item.openInterestUsd === 'number',
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
  openInterest: string;
  openInterestValue: string;
  lastPrice: string;
  markPrice: string;
  indexPrice: string;
  fundingRate: string;
  nextFundingTime: string;
  volume24h: string;
  turnover24h: string;
}
