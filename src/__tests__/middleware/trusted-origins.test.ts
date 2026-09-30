/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for trusted-origins middleware handler and utility functions
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import {
  isTrustedOrigin,
  trustedOriginHandler,
} from '@/middleware/trusted-origins';
import {
  FIRST_PARTY_COOKIE,
  INTERNAL_HEADER,
  firstPartyCookieRemaining,
  internalRequestToken,
  issueFirstPartyCookie,
} from '@/middleware/first-party';
import type { MiddlewareContext } from '@/middleware/types';

function createContext(
  headers: Record<string, string> = {},
  overrides: Partial<MiddlewareContext> = {},
): MiddlewareContext {
  const pathname = overrides.pathname || '/api/test';
  const url = new URL('http://localhost:3000' + pathname);
  const request = new NextRequest(url, {
    headers: new Headers(headers),
  });
  return {
    request,
    requestId: 'req_test_123',
    startTime: Date.now(),
    pathname,
    isApiRoute: pathname.startsWith('/api/'),
    isEmbedRoute: false,
    isSperaxOS: false,
    speraxosKeyId: null,
    isTrustedOrigin: false,
    isApiClient: false,
    clientIp: '127.0.0.1',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
    ...overrides,
  };
}

// =============================================================================
// isTrustedOrigin utility
// =============================================================================

describe('isTrustedOrigin', () => {
  it('should trust exact Sperax origins', () => {
    expect(isTrustedOrigin('https://chat.sperax.io')).toBe(true);
  });

  it('should trust Sperax wildcard subdomains', () => {
    expect(isTrustedOrigin('https://app.sperax.io')).toBe(true);
    expect(isTrustedOrigin('https://sub.sperax.chat')).toBe(true);
  });

  it('should trust apex wildcard domains', () => {
    expect(isTrustedOrigin('https://sperax.io')).toBe(true);
    expect(isTrustedOrigin('https://sperax.chat')).toBe(true);
  });

  it('should reject untrusted origins', () => {
    expect(isTrustedOrigin('https://evil.com')).toBe(false);
    expect(isTrustedOrigin('https://notsperax.io')).toBe(false);
  });

  it('should reject empty origins', () => {
    expect(isTrustedOrigin('')).toBe(false);
  });

  it('should handle malformed URLs gracefully', () => {
    expect(isTrustedOrigin('not-a-url')).toBe(false);
  });
});

// =============================================================================
// trustedOriginHandler composable handler
// =============================================================================

describe('trustedOriginHandler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should skip non-API routes', async () => {
    const ctx = createContext({}, { isApiRoute: false, pathname: '/about' });
    const result = await trustedOriginHandler(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
  });

  it('should set isTrustedOrigin for trusted browser origins', async () => {
    const ctx = createContext({ origin: 'https://chat.sperax.io' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;

    expect(result.isTrustedOrigin).toBe(true);
    expect(result.headers['X-SperaxOS']).toBe('1');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://chat.sperax.io');
  });

  it('should not set trust flags for untrusted origins', async () => {
    const ctx = createContext({ origin: 'https://evil.com' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;

    expect(result.isSperaxOS).toBe(false);
    expect(result.isTrustedOrigin).toBe(false);
    expect(result.headers['X-SperaxOS']).toBeUndefined();
  });

  it('should set priority headers when isSperaxOS is already true (set by HMAC handler)', async () => {
    // Simulates the HMAC handler having already authenticated
    const ctx = createContext({}, { isSperaxOS: true, speraxosKeyId: 'test-key' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;

    expect(result.isSperaxOS).toBe(true);
    expect(result.headers['X-Priority']).toBe('speraxos');
    expect(result.headers['X-SperaxOS']).toBe('1');
  });

  it('should not set isTrustedOrigin when isSperaxOS is true', async () => {
    // SperaxOS HMAC auth takes precedence over origin trust
    const ctx = createContext(
      { origin: 'https://chat.sperax.io' },
      { isSperaxOS: true, speraxosKeyId: 'test-key' },
    );
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;

    expect(result.isSperaxOS).toBe(true);
    // isTrustedOrigin is false when isSperaxOS — they're mutually exclusive
    expect(result.isTrustedOrigin).toBe(false);
  });
});

// =============================================================================
// First-party trust: headers alone are not enough
// =============================================================================

/** A real cookie value, obtained the way a browser would: from a page response. */
async function pageCookie(): Promise<string> {
  const response = NextResponse.next();
  await issueFirstPartyCookie(new NextRequest('http://localhost:3000/en'), response);
  const value = response.cookies.get(FIRST_PARTY_COOKIE)?.value;
  if (!value) throw new Error('no first-party cookie issued');
  return value;
}

describe('first-party trust', () => {
  it('does not trust a spoofed Sec-Fetch-Site header without the signed cookie', async () => {
    const ctx = createContext({ 'sec-fetch-site': 'same-origin' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(false);
  });

  it('does not trust a spoofed same-site Referer without the signed cookie', async () => {
    const ctx = createContext({ referer: 'http://localhost:3000/en/markets' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(false);
  });

  it('trusts a same-origin browser request that carries the page cookie, in a per-IP bucket', async () => {
    const cookie = await pageCookie();
    const ctx = createContext({
      'sec-fetch-site': 'same-origin',
      cookie: `${FIRST_PARTY_COOKIE}=${cookie}`,
    });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(true);
    expect(result.trustedBucket).toBe('first-party:127.0.0.1');
  });

  it('rejects a forged or tampered cookie', async () => {
    const cookie = await pageCookie();
    const [, exp, sig] = cookie.split('.');
    for (const forged of [`v1.${Number(exp) + 60}.${sig}`, `v1.${exp}.${sig.slice(0, -2)}xx`, 'v1.9999999999.abc']) {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { cookie: `${FIRST_PARTY_COOKIE}=${forged}` },
      });
      expect(await firstPartyCookieRemaining(request), forged).toBe(0);
    }
  });

  it('does not grant first-party trust to a cross-site request that carries the cookie', async () => {
    const cookie = await pageCookie();
    const ctx = createContext({
      origin: 'https://evil.com',
      'sec-fetch-site': 'cross-site',
      cookie: `${FIRST_PARTY_COOKIE}=${cookie}`,
    });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(false);
  });

  it('trusts server-to-server calls signed with the internal token', async () => {
    const ctx = createContext({ [INTERNAL_HEADER]: await internalRequestToken() });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(true);
    expect(result.trustedBucket).toBe('internal');
  });

  it('rejects a guessed internal token', async () => {
    const ctx = createContext({ [INTERNAL_HEADER]: 'guess' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.isTrustedOrigin).toBe(false);
  });

  it('meters each partner origin in its own bucket', async () => {
    const ctx = createContext({ origin: 'https://chat.sperax.io' });
    const result = (await trustedOriginHandler(ctx)) as MiddlewareContext;
    expect(result.trustedBucket).toBe('partner:chat.sperax.io');
  });
});
