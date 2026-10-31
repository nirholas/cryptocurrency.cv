import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { registry } from '@/lib/providers/registry';

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/stablecoins?${query}`);
}

const flows = Array.from({ length: 60 }, (_, i) => ({ rank: i + 1, name: `Coin ${i}`, symbol: `C${i}` }));

describe('GET /api/stablecoins limit', () => {
  let fetchSpy: MockInstance<typeof registry.fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi
      .spyOn(registry, 'fetch')
      .mockResolvedValue({ data: flows } as unknown as Awaited<ReturnType<typeof registry.fetch>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['limit=abc', 50],
    ['limit=-5', 1],
    ['limit=0', 1],
    ['limit=999999', 500],
    ['', 50],
    ['limit=10', 10],
  ])('%s requests limit %i', async (query, expected) => {
    const res = await GET(request(query));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith('stablecoin-flows', { limit: expected });
  });
});
