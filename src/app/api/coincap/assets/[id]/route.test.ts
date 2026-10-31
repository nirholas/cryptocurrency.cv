import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAsset = vi.hoisted(() => vi.fn());
vi.mock('@/lib/coincap', () => ({ getAsset, getAssetMarkets: vi.fn(), normalizeAsset: vi.fn() }));

import { GET } from './route';

function call(id: string) {
  return GET(new NextRequest(`http://localhost/api/coincap/assets/${id}`), { params: Promise.resolve({ id }) });
}

describe('GET /api/coincap/assets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['..', '.hidden', 'bitcoin/../markets', 'a'.repeat(101)])('rejects malformed id %s', async (id) => {
    const res = await call(id);
    expect(res.status).toBe(400);
    expect(getAsset).not.toHaveBeenCalled();
  });

  it('returns a generic 502 without the upstream error text', async () => {
    getAsset.mockRejectedValueOnce(new Error('HTTP 500 from https://api.coincap.io/v2/assets/bitcoin?apiKey=s3cret'));

    const res = await call('bitcoin');
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Failed to fetch CoinCap asset' });
  });
});
