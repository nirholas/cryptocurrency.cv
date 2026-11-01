import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as anomaly from '@/lib/advanced-anomaly';

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/anomalies?${query}`);
}

describe('GET /api/anomalies?action=history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an unparseable since date instead of silently returning nothing', async () => {
    const history = vi.spyOn(anomaly, 'getAnomalyHistory');

    const res = await GET(request('action=history&since=garbage'));

    expect(res.status).toBe(400);
    expect(history).not.toHaveBeenCalled();
  });

  it('passes a valid since date through as epoch milliseconds', async () => {
    const history = vi.spyOn(anomaly, 'getAnomalyHistory').mockReturnValue([]);

    const res = await GET(request('action=history&since=2026-01-15T00:00:00Z'));

    expect(res.status).toBe(200);
    expect(history).toHaveBeenCalledWith(expect.objectContaining({ since: Date.UTC(2026, 0, 15) }));
  });
});
