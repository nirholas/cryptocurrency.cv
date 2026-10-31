import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

import { GET } from './route';

function request(query = '') {
  return new NextRequest(`http://localhost/api/stablecoins/chains${query}`);
}

describe('GET /api/stablecoins/chains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a generic 502 without echoing the upstream error', async () => {
    vi.spyOn(stablecoinFlowsChain, 'fetch').mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2'),
    );

    const res = await GET(request());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ status: 'error', message: 'Internal server error' });
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    expect(console.error).toHaveBeenCalledWith('stablecoins/chains route error:', expect.any(Error));
  });
});
