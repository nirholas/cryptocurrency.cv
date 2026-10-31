import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { registry } from '@/lib/providers/registry';

vi.mock('@/lib/x402', () => ({ hybridAuthMiddleware: vi.fn(async () => null) }));

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/v1/fear-greed?${query}`);
}

const index = {
  value: 50,
  valueClassification: 'Neutral',
  timestamp: Date.now(),
  history: [],
};

describe('GET /api/v1/fear-greed days', () => {
  let fetchSpy: MockInstance<typeof registry.fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi
      .spyOn(registry, 'fetch')
      .mockResolvedValue({ data: index } as unknown as Awaited<ReturnType<typeof registry.fetch>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['days=abc', 30],
    ['days=-3', 1],
    ['days=0', 1],
    ['days=5000', 365],
    ['', 30],
    ['days=7', 7],
  ])('%s requests limit %i', async (query, expected) => {
    await GET(request(query));

    expect(fetchSpy).toHaveBeenCalledWith('fear-greed', { limit: expected });
  });
});
