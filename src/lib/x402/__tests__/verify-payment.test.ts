/**
 * Payment verification tests.
 *
 * Issue #43: /api/keys/upgrade is exempt from the global x402 gate, and it
 * treated the mere presence of an `x-402-payment` header as proof of payment,
 * so `x-402-payment: x` bought an enterprise key for nothing. These tests pin
 * the two properties that close it: a payload that is not a real x402 payment
 * never verifies, and verification fails closed when the facilitator cannot
 * confirm it.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { collectPayment, decodePaymentHeader, verifyPayment } from '../verify-payment';

const requirements = { priceUsd: 29, description: 'Pro tier upgrade for 1 month(s)' };

function encode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodePaymentHeader', () => {
  it('rejects the placeholder strings the bypass relied on', () => {
    for (const value of ['x', 'paid', 'true', '1', 'yes', 'receipt']) {
      expect(decodePaymentHeader(value)).toBeNull();
    }
  });

  it('rejects an absent or blank header', () => {
    expect(decodePaymentHeader(null)).toBeNull();
    expect(decodePaymentHeader('')).toBeNull();
    expect(decodePaymentHeader('   ')).toBeNull();
  });

  it('decodes a base64-encoded payload', () => {
    const payload = { x402Version: 1, scheme: 'exact', payload: { signature: '0xabc' } };
    expect(decodePaymentHeader(encode(payload))).toEqual(payload);
  });

  it('accepts raw JSON, which some clients send instead of base64', () => {
    expect(decodePaymentHeader('{"scheme":"exact"}')).toEqual({ scheme: 'exact' });
  });

  it('rejects base64 that decodes to something other than an object', () => {
    expect(decodePaymentHeader(Buffer.from('"a string"').toString('base64'))).toBeNull();
    expect(decodePaymentHeader(Buffer.from('[1,2]').toString('base64'))).toBeNull();
  });
});

describe('verifyPayment', () => {
  it('rejects a placeholder header without ever calling the facilitator', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await verifyPayment('x', requirements);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ code: 'MALFORMED' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts a payment the facilitator confirms', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ isValid: true, payer: '0xpayer', transaction: '0xtx' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    const result = await verifyPayment(encode({ scheme: 'exact' }), requirements);

    expect(result).toEqual({ valid: true, payer: '0xpayer', transaction: '0xtx' });
  });

  it('rejects a payment the facilitator says is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ isValid: false, invalidReason: 'insufficient_funds' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    const result = await verifyPayment(encode({ scheme: 'exact' }), requirements);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ code: 'UNVERIFIED', reason: 'insufficient_funds' });
  });

  it('fails closed when the facilitator is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    const result = await verifyPayment(encode({ scheme: 'exact' }), requirements);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('fails closed on a facilitator error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );

    const result = await verifyPayment(encode({ scheme: 'exact' }), requirements);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ code: 'UNVERIFIED' });
  });

  it('quotes the price to the facilitator in USDC base units', async () => {
    let sentBody = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ isValid: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    await verifyPayment(encode({ scheme: 'exact' }), { ...requirements, priceUsd: 29 });

    const body = JSON.parse(sentBody);
    expect(body.paymentRequirements.maxAmountRequired).toBe('29000000');
    expect(body.paymentRequirements.scheme).toBe('exact');
  });
});

describe('collectPayment', () => {
  const WALLET = '0x4027FdaC1a5216e264A00a5928b8366aE59cE888';
  const sale = { ...requirements, payTo: WALLET, resource: '/api/upgrade' };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  /** Routes /verify and /settle to separate canned responses and records the calls. */
  function facilitator(verify: () => Response, settle: () => Response | Promise<Response>) {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const path = new URL(url).pathname.split('/').pop() as string;
        calls.push(path);
        return path === 'verify' ? verify() : settle();
      }),
    );
    return calls;
  }

  it('refuses to sell when no receiving wallet is configured, without calling the facilitator', async () => {
    const calls = facilitator(
      () => json({ isValid: true }),
      () => json({ success: true, transaction: '0xtx' }),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), {
      ...sale,
      payTo: '0x0000000000000000000000000000000000000000',
    });

    expect(result).toMatchObject({ valid: false, code: 'NOT_CONFIGURED' });
    expect(calls).toEqual([]);
  });

  it('grants only after the facilitator settles and returns a transaction', async () => {
    const calls = facilitator(
      () => json({ isValid: true, payer: '0xpayer' }),
      () => json({ success: true, transaction: '0xsettled', payer: '0xpayer' }),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result).toEqual({ valid: true, payer: '0xpayer', transaction: '0xsettled' });
    expect(calls).toEqual(['verify', 'settle']);
  });

  it('does not settle a payment that fails verification', async () => {
    const calls = facilitator(
      () => json({ isValid: false, invalidReason: 'invalid_signature' }),
      () => json({ success: true, transaction: '0xtx' }),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result).toMatchObject({ valid: false, code: 'UNVERIFIED', reason: 'invalid_signature' });
    expect(calls).toEqual(['verify']);
  });

  it('rejects a verified payment the facilitator refuses to settle (e.g. a replayed nonce)', async () => {
    facilitator(
      () => json({ isValid: true }),
      () => json({ success: false, errorReason: 'nonce_already_used' }, 402),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result).toMatchObject({
      valid: false,
      code: 'UNVERIFIED',
      reason: 'nonce_already_used',
    });
  });

  it('treats a reported success with no transaction as unpaid', async () => {
    facilitator(
      () => json({ isValid: true }),
      () => json({ success: true }),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result.valid).toBe(false);
  });

  it('reports a chain or facilitator failure as retryable, not as a bad payment', async () => {
    facilitator(
      () => json({ isValid: true }),
      () => json({ success: false, error: 'rpc timeout' }, 502),
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result).toMatchObject({ valid: false, code: 'UNAVAILABLE' });
  });

  it('fails closed when settlement cannot be reached', async () => {
    facilitator(
      () => json({ isValid: true }),
      () => {
        throw new Error('ECONNRESET');
      },
    );

    const result = await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(result).toMatchObject({ valid: false, code: 'UNAVAILABLE' });
  });

  it('settles against the same recipient, amount and resource it verified', async () => {
    const bodies: Record<string, { paymentRequirements: Record<string, string> }> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const path = new URL(url).pathname.split('/').pop() as string;
        bodies[path] = JSON.parse(init.body as string);
        return path === 'verify'
          ? json({ isValid: true })
          : json({ success: true, transaction: '0xtx' });
      }),
    );

    await collectPayment(encode({ scheme: 'exact' }), sale);

    expect(bodies.settle.paymentRequirements).toEqual(bodies.verify.paymentRequirements);
    expect(bodies.settle.paymentRequirements).toMatchObject({
      payTo: WALLET,
      maxAmountRequired: '29000000',
      resource: 'https://cryptocurrency.cv/api/upgrade',
    });
  });
});
