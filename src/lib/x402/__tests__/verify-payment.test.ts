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
import { decodePaymentHeader, verifyPayment } from '../verify-payment';

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
      vi.fn(async () =>
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
      vi.fn(async () =>
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
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    const result = await verifyPayment(encode({ scheme: 'exact' }), requirements);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ code: 'UNVERIFIED' });
  });

  it('quotes the price to the facilitator in USDC base units', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ isValid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    await verifyPayment(encode({ scheme: 'exact' }), { ...requirements, priceUsd: 29 });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body.paymentRequirements.maxAmountRequired).toBe('29000000');
    expect(body.paymentRequirements.scheme).toBe('exact');
  });
});
