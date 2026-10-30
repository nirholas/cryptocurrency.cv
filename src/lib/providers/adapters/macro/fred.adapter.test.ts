import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { staleCache } from '@/lib/cache';
import { CircuitBreaker } from '@/lib/circuit-breaker';

import { dollarScore, fetchFredSeries, fredAdapter, fredCache, parseFredCsv } from './fred.adapter';

// Shape of GET https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=...
const csv = (series: string, rows: string[]) => [`observation_date,${series}`, ...rows].join('\n') + '\n';

describe('parseFredCsv', () => {
  it('returns observations newest first, skipping missing and malformed rows', () => {
    const text = csv('DGS10', [
      '2026-10-23,4.95',
      '2026-10-26,',
      '2026-10-27,.',
      '2026-10-28,5.05',
      'garbage',
      '2026-10-29,4.98',
    ]);

    expect(parseFredCsv(text)).toEqual([
      { date: '2026-10-29', value: '4.98' },
      { date: '2026-10-28', value: '5.05' },
      { date: '2026-10-23', value: '4.95' },
    ]);
  });

  it('limits the number of observations and handles CRLF and empty bodies', () => {
    const text = csv('DFF', ['2026-10-27,3.88', '2026-10-28,3.88', '2026-10-29,3.87']).replace(/\n/g, '\r\n');

    expect(parseFredCsv(text, 2)).toEqual([
      { date: '2026-10-29', value: '3.87' },
      { date: '2026-10-28', value: '3.88' },
    ]);
    expect(parseFredCsv('')).toEqual([]);
    expect(parseFredCsv('observation_date,DFF\n')).toEqual([]);
  });
});

describe('dollarScore', () => {
  const obs = (...values: number[]) => values.map((v, i) => ({ date: `2026-10-${String(29 - i).padStart(2, '0')}`, value: String(v) }));

  it('is neutral at the 90-day mean whatever the index level', () => {
    expect(dollarScore(obs(121.3, 121.3, 121.3))).toBe(50);
    expect(dollarScore(obs(98, 98))).toBe(50);
  });

  it('loses 10 points per percent above the mean and gains below it, clamped', () => {
    // newest 101, mean 100 -> 1% above
    expect(dollarScore(obs(101, 99, 100))).toBeCloseTo(40);
    expect(dollarScore(obs(99, 101, 100))).toBeCloseTo(60);
    expect(dollarScore(obs(150, 100))).toBe(0);
    expect(dollarScore(obs(50, 100))).toBe(100);
  });

  it('is neutral without history', () => {
    expect(dollarScore([])).toBe(50);
    expect(dollarScore(obs(121))).toBe(50);
  });
});

describe('fredAdapter without FRED_API_KEY', () => {
  const series: Record<string, string[]> = {
    DFF: ['2026-10-28,3.88', '2026-10-29,3.88'],
    DGS10: ['2026-10-28,5.05', '2026-10-29,4.98'],
    DGS2: ['2026-10-28,4.10', '2026-10-29,4.00'],
    DGS30: ['2026-10-28,5.40', '2026-10-29,5.35'],
    DTWEXBGS: ['2026-10-27,121.20', '2026-10-28,.'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fredCache.clear();
    staleCache.clear();
    CircuitBreaker.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads every series from the keyless CSV download', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const id = new URL(String(input)).searchParams.get('id') ?? '';
      return new Response(csv(id, series[id] ?? []), { status: 200 });
    });

    const data = await fredAdapter.fetch({});

    const urls = fetchSpy.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls.every((u) => u.origin + u.pathname === 'https://fred.stlouisfed.org/graph/fredgraph.csv')).toBe(true);
    expect(urls.some((u) => u.searchParams.has('api_key'))).toBe(false);

    const us10y = data.indicators.find((i) => i.id === 'US10Y');
    expect(us10y).toMatchObject({ value: 4.98, previousValue: 5.05, timestamp: '2026-10-29', source: 'fred' });
    expect(us10y?.change).toBeCloseTo(-0.07);
    expect(data.indicators.find((i) => i.id === 'DXY')).toMatchObject({ value: 121.2, previousValue: null });
    expect(data.indicators).toHaveLength(5);
    // 10Y - 2Y = 0.98 -> 50 + 19.6; one dollar observation -> neutral
    expect(data.riskAppetite.components.yieldSpread).toBeCloseTo(69.6);
    expect(data.riskAppetite.components.dxy).toBe(50);
    expect(data.riskAppetite.score).toBe(60);
  });

  it('keeps the series that answered when others fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const id = new URL(String(input)).searchParams.get('id') ?? '';
      if (id !== 'DFF') return new Response('Internal Server Error', { status: 500 });
      return new Response(csv(id, series[id]), { status: 200 });
    });

    const data = await fredAdapter.fetch({});

    expect(data.indicators.map((i) => i.id)).toEqual(['FED_RATE']);
    expect(data.riskAppetite).toMatchObject({ score: 50, label: 'neutral' });
  });

  it('fails when no series returns data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));

    await expect(fredAdapter.fetch({})).rejects.toThrow('No FRED data returned');
  });
});

describe('fetchFredSeries', () => {
  const body = csv('DGS10', ['2026-10-28,5.05', '2026-10-29,4.98']);

  beforeEach(() => {
    vi.clearAllMocks();
    fredCache.clear();
    staleCache.clear();
    CircuitBreaker.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries a request that fails in transit', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(body, { status: 200 }));

    const rows = await fetchFredSeries('DGS10', 30);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(rows[0]).toEqual({ date: '2026-10-29', value: '4.98' });
  });

  it('shares one upstream request per series and window', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(body, { status: 200 }));

    const [a, b] = await Promise.all([fetchFredSeries('DGS10', 30), fetchFredSeries('DGS10', 30)]);
    const c = await fetchFredSeries('DGS10', 30);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('serves the last good observations when FRED stops answering', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(body, { status: 200 }));
    const fresh = await fetchFredSeries('DGS10', 30);

    fredCache.clear();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('The operation was aborted due to timeout'));

    await expect(fetchFredSeries('DGS10', 30)).resolves.toEqual(fresh);
  });
});
