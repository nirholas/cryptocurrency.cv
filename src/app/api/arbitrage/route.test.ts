import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

function testWebhook(webhook_url: unknown) {
  return new NextRequest('http://localhost/api/arbitrage', {
    method: 'POST',
    body: JSON.stringify({ action: 'test', webhook_url }),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/arbitrage action=test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses a private webhook_url without sending anything', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await POST(testWebhook('http://169.254.169.254/latest/meta-data/'));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'webhook_url must be a public http(s) URL' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not follow a webhook redirect into private address space', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: 'http://10.0.0.5:8080/admin' } }));

    const res = await POST(testWebhook('https://93.184.216.34/hook'));

    expect(res.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('reports a non-2xx webhook response as unsuccessful without echoing errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 500 }));

    const res = await POST(testWebhook('https://93.184.216.34/hook'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: false, message: 'Webhook responded with HTTP 500' });
  });

  it('rejects a non-string webhook_url', async () => {
    const res = await POST(testWebhook({ href: 'http://10.0.0.1' }));
    expect(res.status).toBe(400);
  });
});
