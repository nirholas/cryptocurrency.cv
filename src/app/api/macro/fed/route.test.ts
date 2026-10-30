import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

// fredgraph.csv rows per series, oldest first
const SERIES: Record<string, string[]> = {
  DFF: ['2026-10-28,3.88', '2026-10-29,3.87'],
  FEDFUNDS: ['2026-08-01,4.08', '2026-09-01,3.88'],
  DGS2: ['2026-10-28,4.60', '2026-10-29,4.61'],
  DGS10: ['2026-10-28,4.95', '2026-10-29,4.98'],
  DGS30: ['2026-10-29,5.32'],
  WALCL: ['2026-10-22,6587000', '2026-10-29,6580000'],
};

function respond(input: string | URL | Request) {
  const id = new URL(String(input)).searchParams.get('id')!;
  const rows = SERIES[id];
  if (!rows) return Promise.resolve(new Response('', { status: 500 }));
  return Promise.resolve(new Response([`observation_date,${id}`, ...rows].join('\n'), { status: 200 }));
}

describe('GET /api/macro/fed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns every Fed series FRED serves and skips the ones it does not', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(respond);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    // DGS5 fails upstream
    expect(body.data.map((d: { series: string }) => d.series)).toEqual([
      'DFF',
      'FEDFUNDS',
      'DGS2',
      'DGS10',
      'DGS30',
      'WALCL',
    ]);
    expect(body.count).toBe(6);
    expect(body.data[0]).toMatchObject({ value: 3.87, previousValue: 3.88, date: '2026-10-29', unit: '%' });
    expect(body.data[0].change).toBeCloseTo(-0.01);
    expect(body.data[4]).toMatchObject({ value: 5.32, previousValue: null, change: null });
    expect(body.data[5]).toMatchObject({ value: 6580000, unit: 'millions USD' });
  });

  it('computes the 2s10s spread from the 2Y and 10Y yields', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(respond);

    const body = await (await GET()).json();

    expect(body.yieldCurve).toEqual({ spread2s10s: 0.37, inverted: false });
  });

  it('reports no spread when either yield is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      new URL(String(input)).searchParams.get('id') === 'DGS2'
        ? Promise.resolve(new Response('', { status: 500 }))
        : respond(input as string),
    );

    const body = await (await GET()).json();

    expect(body.yieldCurve).toEqual({ spread2s10s: null, inverted: null });
  });

  it('returns 502 when no series is available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));

    const res = await GET();

    expect(res.status).toBe(502);
    expect((await res.json()).data).toBeUndefined();
  });
});
