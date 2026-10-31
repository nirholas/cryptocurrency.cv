import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { derivativesChain } from '@/lib/providers/chains/derivatives';

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/derivatives/aggregated/open-interest?${query}`);
}

describe('GET /api/derivatives/aggregated/open-interest', () => {
  let chainSpy: MockInstance<typeof derivativesChain.fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    chainSpy = vi.spyOn(derivativesChain, 'fetch');
    vi.spyOn(globalThis, 'fetch');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    'symbol=BTC%26limit%3D9999',
    'symbol=..%2Fadmin',
    'symbol=BTC%3Fx%3D1',
    'symbol=BTC%23',
    'symbol=-BTC',
    `symbol=${'A'.repeat(31)}`,
  ])('rejects %s without calling any provider', async (query) => {
    const res = await GET(request(query));

    expect(res.status).toBe(400);
    expect(chainSpy).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('passes a valid symbol to the provider chain', async () => {
    chainSpy.mockRejectedValueOnce(new Error('upstream down'));

    await GET(request('symbol=BTCUSDT'));

    expect(chainSpy).toHaveBeenCalledWith({ symbols: ['BTCUSDT'] });
  });
});
