import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ host: 'localhost' })) }));

import { db } from '@/lib/database';

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/regulatory?${query}`);
}

describe('GET /api/regulatory?action=events', () => {
  let getSpy: MockInstance<typeof db.get>;

  beforeEach(() => {
    vi.clearAllMocks();
    getSpy = vi.spyOn(db, 'get').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['days=abc&limit=lots&offset=x', 7, 50, 0],
    ['days=-3&limit=0&offset=-4', 1, 1, 0],
    ['days=999&limit=5000&offset=99999', 30, 100, 10000],
    ['days=14&limit=20&offset=40', 14, 20, 40],
  ])('normalises %s', async (query, days, limit, offset) => {
    const res = await GET(request(`action=events&${query}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalledWith(`regulatory:events:all:all:${days}`);
    expect(body.data.pagination).toMatchObject({ limit, offset });
  });
});
