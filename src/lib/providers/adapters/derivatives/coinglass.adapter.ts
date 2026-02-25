/**
 * CoinGlass Adapter — Aggregated derivatives data
 *
 * CoinGlass aggregates derivatives data from all major exchanges:
 * - Open interest across 10+ exchanges
 * - Liquidation data (real-time)
 * - Funding rate heatmaps
 * - Long/short ratios
 *
 * Requires COINGLASS_API_KEY env var.
 *
 * @module providers/adapters/derivatives/coinglass
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OpenInterest, ExchangeOI } from './types';

const BASE = 'https://open-api-v3.coinglass.com/api';

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

export const coinglassAdapter: DataProvider<OpenInterest[]> = {
  name: 'coinglass',
  description: 'CoinGlass — Aggregated open interest & liquidation data from 10+ exchanges',
  priority: 2,
  weight: 0.35,
  rateLimit: RATE_LIMIT,
  capabilities: ['open-interest', 'liquidations', 'funding-rate'],

  async fetch(params: FetchParams): Promise<OpenInterest[]> {
    if (!COINGLASS_API_KEY) {
      throw new Error('CoinGlass API key not configured (COINGLASS_API_KEY)');
    }

    const headers = { coinglassSecret: COINGLASS_API_KEY };
    const symbol = params.symbols?.[0]?.replace('USDT', '').replace('USD', '') ?? 'BTC';

    // Fetch aggregated OI
    const response = await fetch(
      `${BASE}/futures/openInterest/chart?symbol=${symbol}&interval=0`,
      { headers },
    );

    if (response.status === 429) {
      throw new Error('CoinGlass rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`CoinGlass API error: ${response.status}`);
    }

    const json = await response.json();
    const data = json?.data;

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // CoinGlass returns time series — get latest point
    const latest = data[data.length - 1];

    if (!latest) return [];

    // Build exchange breakdown from the data
    const exchanges: ExchangeOI[] = [];
    if (latest.exchangeList && Array.isArray(latest.exchangeList)) {
      for (const ex of latest.exchangeList) {
        exchanges.push({
          exchange: ex.exchangeName ?? 'unknown',
          openInterestUsd: ex.openInterest ?? 0,
          openInterestCoin: 0,
        });
      }
    }

    return [{
      symbol: symbol.toUpperCase(),
      openInterestUsd: latest.openInterest ?? 0,
      openInterestCoin: latest.openInterestCoin ?? 0,
      change24h: latest.h24Change ?? 0,
      exchanges,
      timestamp: new Date(latest.t ?? Date.now()).toISOString(),
    }];
  },

  async healthCheck(): Promise<boolean> {
    if (!COINGLASS_API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/futures/openInterest/chart?symbol=BTC&interval=0`, {
        headers: { coinglassSecret: COINGLASS_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OpenInterest[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.symbol === 'string' &&
      typeof item.openInterestUsd === 'number' &&
      item.openInterestUsd > 0,
    );
  },
};
