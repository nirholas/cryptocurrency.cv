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
 * OKX Open Interest Adapter
 *
 * OKX V5 public API — open interest data:
 * - 500+ perpetual swap contracts
 * - No API key required
 * - 20 req/2s rate limit
 * - OI returned per instrument (SWAP + FUTURES)
 *
 * @module providers/adapters/derivatives/okx-oi
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OpenInterest, ExchangeOI } from './types';

const BASE = 'https://www.okx.com/api/v5';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export const okxOIAdapter: DataProvider<OpenInterest[]> = {
  name: 'okx-oi',
  description: 'OKX V5 API — open interest for 500+ perpetual swap contracts',
  priority: 4,
  weight: 0.2,
  rateLimit: RATE_LIMIT,
  capabilities: ['open-interest'],

  async fetch(params: FetchParams): Promise<OpenInterest[]> {
    // Fetch both SWAP and ticker data in parallel
    const [oiRes, tickerRes] = await Promise.all([
      fetch(`${BASE}/public/open-interest?instType=SWAP`),
      fetch(`${BASE}/market/tickers?instType=SWAP`),
    ]);

    if (!oiRes.ok) {
      throw new Error(`OKX OI API error: ${oiRes.status}`);
    }

    const oiJson: OkxResponse<OkxOIData> = await oiRes.json();
    const oiData = oiJson.data ?? [];

    // Build price map from tickers for USD conversion
    const priceMap = new Map<string, number>();
    if (tickerRes.ok) {
      const tickerJson: OkxResponse<OkxTickerData> = await tickerRes.json();
      for (const t of tickerJson.data ?? []) {
        priceMap.set(t.instId, parseFloat(t.last) || 0);
      }
    }

    // Aggregate by base asset (OKX returns per-instId)
    const aggregated = new Map<string, OpenInterest>();

    for (const item of oiData) {
      if (!item.instId.endsWith('-USDT-SWAP')) continue;

      const baseAsset = item.instId.split('-')[0];
      const oiCoin = parseFloat(item.oi) || 0;
      const price = priceMap.get(item.instId) || 0;
      const oiUsd = parseFloat(item.oiCcy) || oiCoin * price;

      const existing = aggregated.get(baseAsset);
      if (existing) {
        existing.openInterestUsd += oiUsd;
        existing.openInterestCoin += oiCoin;
        existing.exchanges[0].openInterestUsd += oiUsd;
        existing.exchanges[0].openInterestCoin += oiCoin;
      } else {
        aggregated.set(baseAsset, {
          symbol: baseAsset,
          openInterestUsd: oiUsd,
          openInterestCoin: oiCoin,
          change24h: 0,
          exchanges: [
            {
              exchange: 'OKX',
              openInterestUsd: oiUsd,
              openInterestCoin: oiCoin,
            },
          ] as ExchangeOI[],
          timestamp: item.ts ? new Date(parseInt(item.ts)).toISOString() : new Date().toISOString(),
        });
      }
    }

    let results = Array.from(aggregated.values());

    // Filter by requested symbols
    if (params.symbols?.length) {
      const symbolSet = new Set(
        params.symbols.map((s) => s.replace('USDT', '').replace('USD', '').toUpperCase()),
      );
      results = results.filter((r) => symbolSet.has(r.symbol));
    }

    const limit = params.limit ?? 50;
    return results.sort((a, b) => b.openInterestUsd - a.openInterestUsd).slice(0, limit);
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

interface OkxResponse<T> {
  code: string;
  msg: string;
  data: T[];
}

interface OkxOIData {
  instId: string;
  instType: string;
  oi: string;
  oiCcy: string;
  ts: string;
}

interface OkxTickerData {
  instId: string;
  last: string;
}
