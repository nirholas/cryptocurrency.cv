import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { ARCHIVE_BASE_URL } from '@/lib/archive-source';
import { clearArchiveV2MonthCache } from '@/lib/archive-v2';

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/archive?${query}`);
}

describe('GET /api/archive', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearArchiveV2MonthCache();
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('POSTGRES_URL', '');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    'index=true&type=../meta/stats',
    'index=true&type=by-nothing',
    'market=../articles/2026-09',
    'market=2026-13',
  ])('rejects %s without fetching the archive', async (query) => {
    const res = await GET(request(query));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches a valid market month', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(''));

    const res = await GET(request('market=2026-09'));

    expect(res.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(`${ARCHIVE_BASE_URL}/market/2026-09.jsonl`);
  });

  it('falls back to defaults when limit and offset are not numbers', async () => {
    fetchSpy.mockResolvedValue(new Response(''));

    const res = await GET(request('start_date=2026-09-01&limit=lots&offset=nope'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination).toMatchObject({ limit: 50, offset: 0 });
  });
});
