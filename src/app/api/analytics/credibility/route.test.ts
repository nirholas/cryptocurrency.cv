import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSourceCredibility = vi.hoisted(() => vi.fn());
vi.mock('@/lib/source-credibility', () => ({
  getSourceCredibility,
  getSourceScore: vi.fn(),
  getCredibilityStats: vi.fn(),
}));

import { GET } from './route';

describe('GET /api/analytics/credibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not echo the internal error in the 500 body', async () => {
    getSourceCredibility.mockRejectedValueOnce(new Error('redis://default:s3cret@10.0.0.7:6379 refused'));

    const res = await GET(new NextRequest('http://localhost/api/analytics/credibility'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to get credibility scores');
    expect(JSON.stringify(body)).not.toContain('s3cret');
  });
});
