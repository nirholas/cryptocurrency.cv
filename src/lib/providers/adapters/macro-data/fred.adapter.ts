/**
 * FRED Adapter — Federal Reserve Economic Data
 *
 * Free API (500 req/day with key) providing core macro series:
 * - DFF — Federal Funds Effective Rate
 * - DGS10 — 10-Year Treasury Constant Maturity Rate
 * - DGS2 — 2-Year Treasury Constant Maturity Rate
 * - CPIAUCSL — Consumer Price Index (All Urban Consumers)
 * - DTWEXBGS — Trade-Weighted US Dollar Index (Broad)
 *
 * Priority 1, weight 0.4 — most authoritative source for rates & yields.
 *
 * @see https://fred.stlouisfed.org/docs/api/fred/
 * @module providers/adapters/macro-data/fred
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MacroOverview, MacroIndicator } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const FRED_BASE = 'https://api.stlouisfed.org/fred';
const FRED_API_KEY = process.env.FRED_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 120, windowMs: 60_000 };

/**
 * FRED series IDs mapped to human-readable names.
 * Each entry fetches the latest 2 observations so we can compute change.
 */
const SERIES_MAP: Record<string, { name: string; unit: string }> = {
  DFF:      { name: 'Federal Funds Rate', unit: '%' },
  DGS10:    { name: '10-Year Treasury Yield', unit: '%' },
  DGS2:     { name: '2-Year Treasury Yield', unit: '%' },
  CPIAUCSL: { name: 'Consumer Price Index', unit: 'index' },
  DTWEXBGS: { name: 'US Dollar Index (Broad)', unit: 'index' },
};

// =============================================================================
// HELPERS
// =============================================================================

interface FredObservation {
  date: string;
  value: string;
}

/**
 * Fetch the latest observations for a single FRED series.
 * Returns up to 2 non-missing observations (current + previous).
 */
async function fetchSeries(seriesId: string): Promise<FredObservation[]> {
  if (!FRED_API_KEY) throw new Error('FRED_API_KEY not configured');

  const url =
    `${FRED_BASE}/series/observations?series_id=${seriesId}` +
    `&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`FRED ${seriesId} HTTP ${res.status}`);

  const json = (await res.json()) as { observations?: FredObservation[] };
  return (json.observations ?? []).filter((o) => o.value !== '.');
}

/**
 * Fetch 52-week range for a series (last ~260 trading days).
 * Falls back to current value if the request fails.
 */
async function fetch52wRange(seriesId: string): Promise<{ high: number; low: number } | null> {
  if (!FRED_API_KEY) return null;

  const start = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const url =
    `${FRED_BASE}/series/observations?series_id=${seriesId}` +
    `&api_key=${FRED_API_KEY}&file_type=json&observation_start=${start}&sort_order=desc&limit=260`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const json = (await res.json()) as { observations?: FredObservation[] };
    const values = (json.observations ?? [])
      .map((o) => parseFloat(o.value))
      .filter((v) => !Number.isNaN(v));

    if (values.length === 0) return null;
    return { high: Math.max(...values), low: Math.min(...values) };
  } catch {
    return null;
  }
}

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * FRED data provider — fetches multiple series in parallel and normalises
 * them into {@link MacroOverview}.
 */
export const fredAdapter: DataProvider<MacroOverview> = {
  name: 'fred',
  description: 'Federal Reserve Economic Data — fed funds rate, treasury yields, CPI, dollar index',
  priority: 1,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['macro-data'],

  async fetch(_params: FetchParams): Promise<MacroOverview> {
    if (!FRED_API_KEY) throw new Error('FRED_API_KEY not configured');

    const seriesIds = Object.keys(SERIES_MAP);

    // Fetch latest observations and 52-week ranges in parallel
    const [obsResults, rangeResults] = await Promise.all([
      Promise.allSettled(seriesIds.map(fetchSeries)),
      Promise.allSettled(seriesIds.map(fetch52wRange)),
    ]);

    const indicators: MacroIndicator[] = [];

    for (let i = 0; i < seriesIds.length; i++) {
      const obsResult = obsResults[i];
      if (obsResult.status !== 'fulfilled' || obsResult.value.length === 0) continue;

      const obs = obsResult.value;
      const current = parseFloat(obs[0].value);
      if (Number.isNaN(current)) continue;

      const previous = obs.length > 1 ? parseFloat(obs[1].value) : null;
      const meta = SERIES_MAP[seriesIds[i]];

      const change24h = previous !== null ? current - previous : 0;
      const changePercent24h =
        previous !== null && previous !== 0
          ? ((current - previous) / Math.abs(previous)) * 100
          : 0;

      // 52-week range (default to current value if unavailable)
      const rangeResult = rangeResults[i];
      const range =
        rangeResult.status === 'fulfilled' && rangeResult.value
          ? rangeResult.value
          : { high: current, low: current };

      indicators.push({
        name: meta.name,
        ticker: seriesIds[i],
        value: current,
        change24h: Math.round(change24h * 1_000_000) / 1_000_000,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
        high52w: range.high,
        low52w: range.low,
        timestamp: obs[0].date,
      });
    }

    if (indicators.length === 0) throw new Error('No FRED data returned');

    return {
      indicators,
      correlations: [], // populated downstream by chain orchestration
      fedWatch: null,   // FRED doesn't provide FedWatch directly
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    if (!FRED_API_KEY) return false;
    try {
      const res = await fetch(
        `${FRED_BASE}/series/observations?series_id=DFF&api_key=${FRED_API_KEY}&file_type=json&limit=1`,
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
