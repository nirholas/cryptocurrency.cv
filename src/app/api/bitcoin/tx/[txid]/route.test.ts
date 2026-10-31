import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getTransaction = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bitcoin-onchain', () => ({ getTransaction }));

import { GET } from './route';

const TXID = 'a'.repeat(64);

function call(txid: string) {
  return GET(new NextRequest(`http://localhost/api/bitcoin/tx/${txid}`), { params: Promise.resolve({ txid }) });
}

describe('GET /api/bitcoin/tx/[txid]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['..', 'abc', `${'a'.repeat(64)}/../../address/x`, 'z'.repeat(64)])('rejects malformed txid %s', async (txid) => {
    const res = await call(txid);
    expect(res.status).toBe(400);
    expect(getTransaction).not.toHaveBeenCalled();
  });

  it('maps an upstream 404 to a 404', async () => {
    getTransaction.mockRejectedValueOnce(new Error('Mempool API error: 404'));
    const res = await call(TXID);
    expect(res.status).toBe(404);
  });

  it('returns a generic 502 without the upstream error text', async () => {
    getTransaction.mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:443 token=s3cret'));

    const res = await call(TXID);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Failed to fetch transaction' });
    expect(console.error).toHaveBeenCalled();
  });
});
