/**
 * Yahoo Finance Adapter — Free fallback for macro/tradfi data
 *
 * Uses the unofficial v8 chart endpoint (no API key required) to fetch:
 * - ^DJI    → Dow Jones Industrial Average
 * - ^GSPC   → S&P 500
 * - ^IXIC   → NASDAQ Composite
 * - ^VIX    → CBOE Volatility Index
 * - DX-Y.NYB → US Dollar Index
 * - GC=F    → Gold Futures
 * - CL=F    → Crude Oil (WTI) Futures
 * - ^TNX    → 10-Year Treasury Yield
 *
 * Priority 3, weight 0.3 — free fallback when FRED / Alpha Vantage are
 * unavailable or their API keys are not configured.
 *
 * @see https://query1.finance.yahoo.com
 * @module providers/adapters/macro-data/yahoo-finance
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MacroOverview, MacroIndicator } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 100, windowMs: 60_000 };

/**
 * Yahoo Finance symbols and their human-readable labels.
 */
const SYMBOLS: Record<string, { name: string }> = {
  '^DJI':     { name: 'Dow Jones Industrial Average' },
  '^GSPC':    { name: 'S&P 500' },
  '^IXIC':    { name: 'NASDAQ Composite' },
  '^VIX':     { name: 'CBOE Volatility Index' },
  'DX-Y.NYB': { name: 'US Dollar Index' },
  'GC=F':     { name: 'Gold Futures' },
  'CL=F':     { name: 'Crude Oil (WTI) Futures' },
  '^TNX':     { name: '10-Year Treasury Yield' },
};

// =============================================================================
// HELPERS
// =============================================================================

interface YFChartResult {
  price: number;
  prevClose: number;
  high52w: number;
  low52w: number;
  timestamp: string;
}

/**
 * Fetch a single symbol's 5-day chart and extract the latest close,
 * previous close, and 52-week range.
 */
async function fetchSymbol(symbol: string): Promise<YFChartResult | null> {
  const url = `${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: {
        'User-Agent': 'free-crypto-news/1.0',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta ?? {};
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    // Latest valid close
    const validCloses = closes.filter((c: number | null) => c !== null && !Number.isNaN(c));
    if (validCloses.length === 0) return null;

    const price = validCloses[validCloses.length - 1];
    const prevClose =
      validCloses.length > 1
        ? validCloses[validCloses.length - 2]
        : meta.chartPreviousClose ?? price;

    return {
      price,
      prevClose,
      high52w: meta.fiftyTwoWeekHigh ?? price,
      low52w: meta.fiftyTwoWeekLow ?? price,
      timestamp: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1_000).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * Yahoo Finance data provider — no API key required, fetches all symbols
 * in parallel for maximum speed.
 */
export const yahooFinanceAdapter: DataProvider<MacroOverview> = {
  name: 'yahoo-finance',
  description:
    'Yahoo Finance — DJI, S&P 500, NASDAQ, VIX, DXY, Gold, Oil, 10Y Treasury (no key required)',
  priority: 3,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['macro-data'],

  async fetch(_params: FetchParams): Promise<MacroOverview> {
    const entries = Object.entries(SYMBOLS);

    // Parallel fetch — Yahoo tolerates moderate concurrency
    const results = await Promise.allSettled(
      entries.map(([sym]) => fetchSymbol(sym)),
    );

    const indicators: MacroIndicator[] = [];

    for (let i = 0; i < entries.length; i++) {
      const r = results[i];
      if (r.status !== 'fulfilled' || !r.value) continue;

      const [sym, meta] = entries[i];
      const { price, prevClose, high52w, low52w, timestamp } = r.value;

      const change24h = price - prevClose;
      const changePercent24h =
        prevClose !== 0 ? (change24h / Math.abs(prevClose)) * 100 : 0;

      indicators.push({
        name: meta.name,
        ticker: sym,
        value: price,
        change24h: Math.round(change24h * 100) / 100,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
        high52w,
        low52w,
        timestamp,
      });
    }

    if (indicators.length === 0) throw new Error('No Yahoo Finance data returned');

    return {
      indicators,
      correlations: [],
      fedWatch: null,
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(
        `${YF_BASE}/${encodeURIComponent('^GSPC')}?interval=1d&range=1d`,
        {
          signal: AbortSignal.timeout(5_000),
          headers: { 'User-Agent': 'free-crypto-news/1.0' },
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MacroOverview): boolean {
    return Array.isArray(data.indicators) && data.indicators.length > 0;
  },
};
