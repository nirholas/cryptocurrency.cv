/**
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @copyright 2024-2026 nirholas
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * The 402 response must advertise the network it actually settles on
 * (CURRENT_NETWORK), not a hardcoded Base list.
 */
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.X402_NETWORK = 'eip155:42161';
  process.env.X402_PAYMENT_ADDRESS = '0x1111111111111111111111111111111111111111';
  delete process.env.CI;
});

const sdk = vi.hoisted(() => ({ paymentProxy: vi.fn(), withX402: vi.fn() }));
vi.mock('@x402/next', () => sdk);
// auth.ts imports api-keys, which reads the KV client at import time; no KV call is made here.
vi.mock('@vercel/kv', () => ({ kv: {} }));

import { create402Response } from '../auth';

describe('create402Response network advertisement', () => {
  it('advertises the configured settlement network in headers and body', async () => {
    const res = create402Response('/api/v1/gas', '$0.001');
    expect(res.status).toBe(402);
    expect(res.headers.get('X-Network')).toBe('eip155:42161');
    expect(res.headers.get('X-Accepts-Networks')).toBe('eip155:42161');

    const body = await res.json();
    const x402Option = body.error?.paymentOptions?.find?.((o: { type: string }) => o.type === 'x402')
      ?? JSON.stringify(body);
    expect(JSON.stringify(x402Option)).toContain('Arbitrum One');
    expect(JSON.stringify(body)).not.toContain('Base Mainnet');
  });
});
