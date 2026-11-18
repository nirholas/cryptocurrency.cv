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

  it.each(['{"url":', 'null'])('returns 400 for body %s without fetching', async (body) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await POST(
      new NextRequest('http://localhost/api/news/extract', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

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

  it('strips nested script fragments and decodes &amp; only once', async () => {
    const filler = 'Bitcoin rallied as spot ETF inflows reached a new weekly record. '.repeat(3);
    const html = `<html><body><article><p>${filler}</p>`
      + '<p><scr<script>x</script>ipt>alert(1)</script>Rates &amp;lt;b&amp;gt; up</p></article></body></html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }),
    );

    const res = await POST(post('http://93.184.216.34/article'));
    const body = await res.json();

    expect(res.status).toBe(200);
    // Removed elements are replaced with a space, so the fragments around the
    // inner <script> can't rejoin into a new tag. What's left of the broken
    // markup comes through as inert text, never as a tag.
    expect(body.content).not.toMatch(/<\s*\/?\s*scr/i);
    expect(body.content).not.toContain('<');
    expect(body.content).toContain('Rates &lt;b&gt; up');
  });
});
