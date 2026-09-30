/**
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @copyright 2024-2026 nirholas
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * With no receiving wallet configured, no route may challenge for a payment:
 * the challenge would name the zero address, which nobody can collect and
 * which burns the funds of any client that honours it (issue #36).
 */
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.hoisted(() => {
  delete process.env.X402_PAYMENT_ADDRESS;
  delete process.env.X402_RECEIVE_ADDRESS;
  // IS_BUILD_TIME treats CI=true as a build and skips wrapping entirely.
  delete process.env.CI;
});

// The SDK must never be reached on these paths; mocking it both proves that and
// keeps its extensionless `next/server` import out of the node ESM resolver.
const sdk = vi.hoisted(() => ({ paymentProxy: vi.fn(), withX402: vi.fn() }));
vi.mock('@x402/next', () => sdk);

import { hybridAuthMiddleware, withX402 } from '../auth';
import { isX402Configured } from '../config';

const request = (path: string) => new NextRequest(`https://cryptocurrency.cv${path}`);

describe('payments with no receiving wallet', () => {
  it('reports x402 as not configured', () => {
    expect(isX402Configured()).toBe(false);
  });

  it('serves a priced data endpoint instead of issuing a 402', async () => {
    await expect(hybridAuthMiddleware(request('/api/v1/gas'), '/api/v1/gas')).resolves.toBeNull();
  });

  it('refuses a premium endpoint with 503 and never runs the handler', async () => {
    const handler = vi.fn();
    const route = withX402('/api/premium/ai/summary', handler);

    const response = await route(request('/api/premium/ai/summary'));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'PAYMENTS_NOT_CONFIGURED' });
    expect(handler).not.toHaveBeenCalled();
    expect(sdk.withX402).not.toHaveBeenCalled();
  });
});
