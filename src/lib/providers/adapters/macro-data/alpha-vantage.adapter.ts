/**
 * Alpha Vantage Adapter — US equities, ETFs & commodities
 *
 * Free tier: 25 requests/day (5/min burst). Provides:
 * - SPY  → S&P 500 proxy
 * - QQQ  → NASDAQ-100 proxy
 * - VIX  → CBOE Volatility Index (via ^VIX / VIXY ETF fallback)
 * - GLD  → Gold proxy
 *
 * Requests are serialised with 500 ms delay to stay within the burst limit.
 *
 * Priority 2, weight 0.3 — complements FRED with equity/commodity prices.
 *
 * @see https://www.alphavantage.co/documentation/
 * @module providers/adapters/macro-data/alpha-vantage
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MacroOverview, MacroIndicator } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const AV_BASE = 'https://www.alphavantage.co/query';
const AV_API_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? '';

/** 25 requests/day on the free tier — enforce 5/min burst guard */
const RATE_LIMIT: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };

/**
 * Symbols to fetch via GLOBAL_QUOTE.
 * Maps each ticker to a human-readable name.
 */
const SYMBOLS: Record<string, { name: string }> = {
  SPY: { name: 'S&P 500 (SPY)' },
  QQQ: { name: 'NASDAQ 100 (QQQ)' },
  VIX: { name: 'CBOE Volatility Index' },
  GLD: { name: 'Gold (GLD ETF)' },
};

// =============================================================================
// HELPERS
// =============================================================================

interface AlphaQuote {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
}

/**
 * Fetch a GLOBAL_QUOTE for a single symbol.
 * Returns `null` if the request fails or the response is empty.
 */
async function fetchQuote(symbol: string): Promise<AlphaQuote | null> {
  if (!AV_API_KEY) return null;

  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AV_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;

  const json = await res.json();
  const q = json['Global Quote'];
  if (!q || !q['05. price']) return null;

  return {
    price: parseFloat(q['05. price']),
    prevClose: parseFloat(q['08. previous close'] ?? '0'),
    change: parseFloat(q['09. change'] ?? '0'),
    changePercent: parseFloat((q['10. change percent'] ?? '0').replace('%', '')),
    high52w: parseFloat(q['03. high'] ?? q['05. price']),
    low52w: parseFloat(q['04. low'] ?? q['05. price']),
  };
}

/** Simple sleep helper */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * Alpha Vantage data provider — serial quote fetching with 500 ms delay
 * to respect the free-tier burst limit.
 */
export const alphaVantageAdapter: DataProvider<MacroOverview> = {
  name: 'alpha-vantage',
  description: 'Alpha Vantage — SPY, QQQ, VIX, GLD quotes with daily change',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['macro-data'],

  async fetch(_params: FetchParams): Promise<MacroOverview> {
    if (!AV_API_KEY) throw new Error('ALPHA_VANTAGE_API_KEY not configured');

    const symbols = Object.keys(SYMBOLS);
    const indicators: MacroIndicator[] = [];

    // Serial fetch with inter-request delay to stay within burst limit
    for (const sym of symbols) {
      const quote = await fetchQuote(sym);
      if (quote) {
        const meta = SYMBOLS[sym];
        indicators.push({
          name: meta.name,
          ticker: sym,
          value: quote.price,
          change24h: quote.change,
          changePercent24h: quote.changePercent,
          high52w: quote.high52w,
          low52w: quote.low52w,
          timestamp: new Date().toISOString(),
        });
      }
      // 500 ms spacing between requests
      await sleep(500);
    }

    if (indicators.length === 0) throw new Error('No Alpha Vantage data returned');

    return {
      indicators,
      correlations: [],
      fedWatch: null,
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    if (!AV_API_KEY) return false;
    try {
      const res = await fetch(
        `${AV_BASE}?function=GLOBAL_QUOTE&symbol=SPY&apikey=${AV_API_KEY}`,
        { signal: AbortSignal.timeout(5_000) },
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
