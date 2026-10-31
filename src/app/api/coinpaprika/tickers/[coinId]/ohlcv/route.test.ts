import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lib = vi.hoisted(() => ({ getOHLCVHistorical: vi.fn(), getOHLCVLatest: vi.fn() }));
vi.mock('@/lib/coinpaprika', () => lib);

import { GET } from './route';

function call(query = '', coinId = 'btc-bitcoin') {
  const req = new NextRequest(`http://localhost/api/coinpaprika/tickers/${coinId}/ohlcv${query}`);
  return GET(req, { params: Promise.resolve({ coinId }) });
}

describe('GET /api/coinpaprika/tickers/[coinId]/ohlcv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lib.getOHLCVHistorical.mockResolvedValue([]);
    lib.getOHLCVLatest.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    '?quote=eur',
    '?quote=usd%26interval%3D5m',
    '?start=yesterday',
    '?start=2024-01-01&end=2024-01-01T00:00:00Z%26x',
    '?start=2024-01-01&limit=abc',
    '?start=2024-01-01&limit=-5',
  ])('returns 400 for %s without calling upstream', async (query) => {
    const res = await call(query);
    expect(res.status).toBe(400);
    expect(lib.getOHLCVHistorical).not.toHaveBeenCalled();
    expect(lib.getOHLCVLatest).not.toHaveBeenCalled();
  });

  it('serves the latest candles when start is absent or empty', async () => {
    expect((await call('?start=&quote=BTC')).status).toBe(200);
    expect(lib.getOHLCVLatest).toHaveBeenCalledWith('btc-bitcoin', 'btc');
  });

  it('clamps limit to the upstream maximum', async () => {
    expect((await call('?start=2024-01-01&end=1735689600&limit=5000')).status).toBe(200);
    expect(lib.getOHLCVHistorical).toHaveBeenCalledWith('btc-bitcoin', '2024-01-01', '1735689600', 366, 'usd');
  });
});
