import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

function post(body: string, ip: string) {
  return new NextRequest('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  });
}

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await POST(post('{"email":', '203.0.113.10'));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'Invalid JSON' });
  });

  it('returns 400, not 500, for a null body', async () => {
    const res = await POST(post('null', '203.0.113.11'));

    expect(res.status).toBe(400);
  });
});
