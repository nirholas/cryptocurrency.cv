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
 * dYdX Open Interest Adapter
 *
 * dYdX v3 decentralized perpetual exchange — open interest:
 * - 30+ perpetual markets
 * - No API key required
 * - OI available in the markets endpoint
 *
 * @module providers/adapters/derivatives/dydx-oi
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OpenInterest, ExchangeOI } from './types';

const BASE = 'https://api.dydx.exchange/v3';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 10_000,
};

export const dydxOIAdapter: DataProvider<OpenInterest[]> = {
  name: 'dydx-oi',
  description: 'dYdX v3 — open interest from decentralized perpetual exchange',
  priority: 5,
  weight: 0.1,
  rateLimit: RATE_LIMIT,
  capabilities: ['open-interest'],

  async fetch(params: FetchParams): Promise<OpenInterest[]> {
    const res = await fetch(`${BASE}/markets`);
    if (!res.ok) throw new Error(`dYdX API error: ${res.status}`);

    const json = await res.json();
    const markets: Record<string, DydxMarket> = json.markets ?? {};

    let entries = Object.values(markets).filter(
      (m) => m.type === 'PERPETUAL' && m.status === 'ONLINE' && parseFloat(m.openInterest) > 0,
    );

    // Filter by requested symbols
    if (params.symbols?.length) {
      const symbolSet = new Set(
        params.symbols.map((s) =>
          s.replace('USDT', '').replace('USD', '').replace(/-USD$/, '').toUpperCase(),
        ),
      );
      entries = entries.filter((m) => {
        const base = m.market.replace(/-USD$/, '');
        return symbolSet.has(base);
      });
    }

    const limit = params.limit ?? 50;

    const results: OpenInterest[] = entries.map((m) => {
      const oiCoin = parseFloat(m.openInterest) || 0;
      const price = parseFloat(m.oraclePrice) || 0;
      const oiUsd = oiCoin * price;
      const baseAsset = m.market.replace(/-USD$/, '');

      const exchanges: ExchangeOI[] = [
        {
          exchange: 'dYdX',
          openInterestUsd: oiUsd,
          openInterestCoin: oiCoin,
        },
      ];

      return {
        symbol: baseAsset,
        openInterestUsd: oiUsd,
        openInterestCoin: oiCoin,
        change24h: 0,
        exchanges,
        timestamp: new Date().toISOString(),
      };
    });

    return results.sort((a, b) => b.openInterestUsd - a.openInterestUsd).slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/markets`, {
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

interface DydxMarket {
  market: string;
  type: string;
  status: string;
  baseAsset: string;
  openInterest: string;
  oraclePrice: string;
  indexPrice: string;
}
