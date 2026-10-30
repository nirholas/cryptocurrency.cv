import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { staleCache } from '@/lib/cache';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { fredCache } from '@/lib/providers/adapters/macro/fred.adapter';

import { GET } from './route';

// Shape of GET https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS&cosd=... (oldest first)
const CSV = [
  'observation_date,DTWEXBGS',
  '2026-10-19,120.00',
  '2026-10-20,',
  '2026-10-21,121.00',
  '2026-10-22,122.00',
  '2026-10-23,121.32',
].join('\n');

function csvResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { 'content-type': 'text/csv' } });
}

describe('GET /api/macro/dxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fredCache.clear();
    staleCache.clear();
    CircuitBreaker.resetAll();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the broad dollar index for the requested window', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(csvResponse(CSV));

    const res = await GET(new Request('https://cryptocurrency.cv/api/macro/dxy?days=60'));
    const body = await res.json();

    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(url.searchParams.get('id')).toBe('DTWEXBGS');
    const windowDays = (Date.now() - Date.parse(url.searchParams.get('cosd')!)) / 86_400_000;
    expect(Math.floor(windowDays)).toBe(60);

    expect(res.status).toBe(200);
    expect(body.count).toBe(4);
    expect(body.data.historical[0]).toEqual({ date: '2026-10-23', value: 121.32 });
    expect(body.data.current.value).toBe(121.32);
    expect(body.data.current.date).toBe('2026-10-23');
    expect(body.data.current.change24h).toBeCloseTo(-0.68);
    expect(body.data.current.changePercent24h).toBeCloseTo((-0.68 / 122) * 100);
    expect(body.data.context.periodChangePercent).toBeCloseTo(1.1);
    expect(body.data.context.description).toContain('Broad');
  });

  it('judges dollar strength against the window average, not a fixed level', async () => {
    // Latest is ~2% above the mean: well above any average-relative neutral band
    const csv = ['observation_date,DTWEXBGS', '2026-10-21,118.0', '2026-10-22,118.0', '2026-10-23,122.0'].join('\n');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(csvResponse(csv));

    const body = await (await GET(new Request('https://cryptocurrency.cv/api/macro/dxy'))).json();

    expect(body.data.context.strongDollar).toBe('Headwind for crypto (dollar above its 30-day average)');
  });

  it('clamps an invalid window to the default', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(csvResponse(CSV));

    await GET(new Request('https://cryptocurrency.cv/api/macro/dxy?days=abc'));

    const cosd = new URL(String(fetchSpy.mock.calls[0][0])).searchParams.get('cosd')!;
    expect(Math.floor((Date.now() - Date.parse(cosd)) / 86_400_000)).toBe(30);
  });

  it('returns 502 instead of a zero value when FRED has no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(csvResponse('observation_date,DTWEXBGS\n'));

    const res = await GET(new Request('https://cryptocurrency.cv/api/macro/dxy'));

    expect(res.status).toBe(502);
    expect((await res.json()).data).toBeUndefined();
  });

  it('returns 502 when FRED is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(csvResponse('', 503));

    expect((await GET(new Request('https://cryptocurrency.cv/api/macro/dxy'))).status).toBe(502);
  });
});
