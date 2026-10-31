import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

function post(url: string) {
  return new NextRequest('http://localhost/api/news/extract', {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/news/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['http://[::ffff:a9fe:a9fe]/latest/meta-data/', 'http://0x7f000001/', 'http://100.64.0.1/'])(
    'refuses %s without fetching it',
    async (url) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const res = await POST(post(url));

      expect(res.status).toBe(400);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('refuses a public page that redirects to the metadata server', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/computeMetadata/v1/' } }),
      );

    const res = await POST(post('http://93.184.216.34/article'));

    expect(res.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
