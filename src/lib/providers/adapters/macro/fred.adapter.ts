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
 * FRED Adapter — Federal Reserve Economic Data
 *
 * Free API (500 req/day with key) providing:
 * - Federal Funds Rate (DFF)
 * - 10-Year Treasury Yield (DGS10)
 * - 2-Year Treasury Yield (DGS2)
 * - 30-Year Treasury Yield (DGS30)
 * - Consumer Price Index (CPIAUCSL)
 * - M2 Money Supply (M2SL)
 * - US Dollar Index (DTWEXBGS — broad trade-weighted)
 *
 * Without FRED_API_KEY the same series are read from the public, keyless
 * fredgraph.csv download that backs the charts on fred.stlouisfed.org.
 *
 * @see https://fred.stlouisfed.org/docs/api/fred/
 * @module providers/adapters/macro/fred
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MacroData, MacroIndicator } from './types';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_CSV_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv';
const FRED_API_KEY = process.env.FRED_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 120, windowMs: 60_000 };

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Dollar component: 50 at the index's own 90-day mean, 10 points lower per
 * percent above it. DTWEXBGS is the broad trade-weighted index (Jan 2006 = 100),
 * not ICE DXY, so it has no fixed neutral level.
 */
export function dollarScore(observations: FredObservation[]): number {
  if (observations.length < 2) return 50;
  const values = observations.map((o) => parseFloat(o.value));
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return clampScore(50 - ((values[0] - mean) / mean) * 100 * 10);
}

/** FRED series IDs mapped to our indicator IDs */
const SERIES_MAP: Record<string, { id: string; name: string; unit: string }> = {
  DFF:      { id: 'FED_RATE', name: 'Federal Funds Rate', unit: '%' },
  DGS10:    { id: 'US10Y',   name: '10-Year Treasury Yield', unit: '%' },
  DGS2:     { id: 'US2Y',    name: '2-Year Treasury Yield', unit: '%' },
  DGS30:    { id: 'US30Y',   name: '30-Year Treasury Yield', unit: '%' },
  DTWEXBGS: { id: 'DXY',     name: 'US Dollar Index (Broad)', unit: 'index' },
};

interface FredObservation {
  date: string;
  value: string;
}

/** Missing observations are "." in the JSON API and "." or empty in the CSV */
function isMissing(value: string): boolean {
  return value === '' || value === '.';
}

/**
 * Parse a fredgraph.csv download ("observation_date,<SERIES>" header, one
 * "YYYY-MM-DD,value" row per observation, oldest first) into observations,
 * newest first, without missing values.
 */
export function parseFredCsv(text: string, limit = Infinity): FredObservation[] {
  const rows: FredObservation[] = [];
  for (const line of text.trim().split(/\r?\n/).slice(1)) {
    const [date, value = ''] = line.split(',');
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isMissing(trimmed) || !Number.isFinite(Number(trimmed))) continue;
    rows.push({ date, value: trimmed });
  }
  return rows.reverse().slice(0, limit);
}

/** Observations from the last 90 days, newest first */
async function fetchSeries(seriesId: string): Promise<FredObservation[]> {
  const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  if (!FRED_API_KEY) {
    const res = await fetch(`${FRED_CSV_BASE}?id=${seriesId}&cosd=${start}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`FRED CSV ${seriesId} HTTP ${res.status}`);
    return parseFredCsv(await res.text());
  }

  const url =
    `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_API_KEY}` +
    `&file_type=json&sort_order=desc&limit=100&observation_start=${start}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`FRED ${seriesId} HTTP ${res.status}`);
  const json = await res.json();
  return (json.observations ?? []).filter((o: FredObservation) => !isMissing(o.value));
}

export const fredAdapter: DataProvider<MacroData> = {
  name: 'fred',
  description: 'Federal Reserve Economic Data — rates, yields, dollar index',
  priority: 1,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['macro-data'],

  async fetch(_params: FetchParams): Promise<MacroData> {
    const seriesIds = Object.keys(SERIES_MAP);
    const results = await Promise.allSettled(seriesIds.map(fetchSeries));

    const indicators: MacroIndicator[] = [];
    const observations: Record<string, FredObservation[]> = {};

    for (let i = 0; i < seriesIds.length; i++) {
      const r = results[i];
      if (r.status !== 'fulfilled' || r.value.length === 0) continue;

      const obs = r.value;
      observations[seriesIds[i]] = obs;
      const current = parseFloat(obs[0].value);
      const previous = obs.length > 1 ? parseFloat(obs[1].value) : null;
      const meta = SERIES_MAP[seriesIds[i]];

      indicators.push({
        id: meta.id as MacroIndicator['id'],
        name: meta.name,
        value: current,
        previousValue: previous,
        change: previous !== null ? current - previous : null,
        changePercent: previous !== null && previous !== 0
          ? ((current - previous) / Math.abs(previous)) * 100
          : null,
        unit: meta.unit,
        source: 'fred',
        timestamp: obs[0].date,
      });
    }

    if (indicators.length === 0) throw new Error('No FRED data returned');

    // Strong dollar = risk-off, yield curve inversion = risk-off; a missing input scores neutral
    const us10y = indicators.find(i => i.id === 'US10Y')?.value;
    const us2y = indicators.find(i => i.id === 'US2Y')?.value;
    const dxyScore = dollarScore(observations.DTWEXBGS ?? []);
    const spreadScore = us10y !== undefined && us2y !== undefined
      ? clampScore(50 + (us10y - us2y) * 20)
      : 50;

    const riskScore = Math.round((dxyScore + spreadScore) / 2);

    return {
      indicators,
      riskAppetite: {
        score: riskScore,
        label: riskScore < 35 ? 'risk-off' : riskScore > 65 ? 'risk-on' : 'neutral',
        components: { vix: 50, dxy: dxyScore, yieldSpread: spreadScore, equityMomentum: 50 },
      },
      source: 'fred',
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const url = FRED_API_KEY
        ? `${FRED_BASE}?series_id=DFF&api_key=${FRED_API_KEY}&file_type=json&limit=1`
        : `${FRED_CSV_BASE}?id=DFF&cosd=${new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  },

  validate(data: MacroData): boolean {
    return Array.isArray(data.indicators) && data.indicators.length > 0;
  },
};
