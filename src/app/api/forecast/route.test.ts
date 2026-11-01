import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as predictive from '@/lib/predictive-intelligence';

import { GET } from './route';

const INTERNAL = 'connect ECONNREFUSED 10.0.0.7:5432 password=secret-key';

describe('GET /api/forecast errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a generic 500 without the internal error message', async () => {
    vi.spyOn(predictive, 'generateForecast').mockRejectedValueOnce(new Error(INTERNAL));

    const res = await GET(new NextRequest('http://localhost/api/forecast?asset=btc&horizon=1d'));
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).not.toContain('secret-key');
    expect(text).not.toContain('ECONNREFUSED');
    expect(JSON.parse(text).error).toBe('Forecast generation failed');
    expect(console.error).toHaveBeenCalledWith('[forecast] generation failed:', expect.any(Error));
  });

  it('still explains an invalid horizon with a 400', async () => {
    const res = await GET(new NextRequest('http://localhost/api/forecast?asset=btc&horizon=5y'));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid horizon');
  });
});
