import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as resilientFetch from '@/lib/resilient-fetch';

import { POST } from './route';

const ADMIN_KEY = 'test-admin-key';
const VALID_CID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

function post(body: unknown, headers: Record<string, string> = { authorization: `Bearer ${ADMIN_KEY}` }) {
  return POST(
    new NextRequest('https://cryptocurrency.cv/api/archive/ipfs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

describe('POST /api/archive/ipfs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_API_KEY', ADMIN_KEY);
    vi.stubEnv('PINATA_JWT', 'pinata-jwt');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects writes without an admin key and never calls the pinning service', async () => {
    const fetchSpy = vi.spyOn(resilientFetch, 'resilientFetchResponse');
    const res = await post({ action: 'pin', cid: VALID_CID }, {});
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a wrong admin key', async () => {
    const res = await post({ action: 'pin', cid: VALID_CID }, { authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
  });

  it('returns 503 when no admin key is configured', async () => {
    vi.stubEnv('ADMIN_API_KEY', '');
    vi.stubEnv('ADMIN_TOKEN', '');
    const res = await post({ action: 'pin', cid: VALID_CID });
    expect(res.status).toBe(503);
  });

  it('returns 400 for malformed JSON and non-object bodies', async () => {
    expect((await post('{not json')).status).toBe(400);
    expect((await post([1, 2])).status).toBe(400);
  });

  it('rejects a malformed cid', async () => {
    const fetchSpy = vi.spyOn(resilientFetch, 'resilientFetchResponse');
    const res = await post({ action: 'pin', cid: '../../etc' });
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a snapshot date that is not YYYY-MM-DD', async () => {
    const fetchSpy = vi.spyOn(resilientFetch, 'resilientFetchResponse');
    const res = await post({ action: 'snapshot', date: '../../secrets-x' });
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('pins a valid cid', async () => {
    vi.spyOn(resilientFetch, 'resilientFetchResponse').mockResolvedValue(new Response('{}', { status: 200 }));
    const res = await post({ action: 'pin', cid: VALID_CID });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, pinned: true, cid: VALID_CID });
  });

  it('does not echo the Pinata error body', async () => {
    vi.spyOn(resilientFetch, 'resilientFetchResponse').mockResolvedValue(
      new Response('internal: jwt for account 1234 expired', { status: 401 }),
    );
    const res = await post({ action: 'pin', cid: VALID_CID });
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('1234');
  });

  it('does not echo a thrown network error', async () => {
    vi.spyOn(resilientFetch, 'resilientFetchResponse').mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5'));
    const res = await post({ action: 'pin', cid: VALID_CID });
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('10.0.0.5');
  });
});
