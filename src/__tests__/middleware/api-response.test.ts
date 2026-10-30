/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for api-response middleware handler
 */

import { describe, it, expect } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { apiResponse } from '@/middleware/api-response';
import type { MiddlewareContext } from '@/middleware/types';

function createContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
  const pathname = overrides.pathname || '/api/test';
  const url = new URL('http://localhost:3000' + pathname);
  return {
    request: new NextRequest(url),
    requestId: 'req_test_123',
    startTime: Date.now() - 10, // Simulate 10ms elapsed
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

describe('apiResponse handler', () => {
  it('should skip non-API routes', () => {
    const ctx = createContext({ isApiRoute: false, pathname: '/about' });
    const result = apiResponse(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toBe(ctx);
  });

  it('should return a NextResponse for API routes', () => {
    const ctx = createContext();
    const result = apiResponse(ctx);
    expect(result).toBeInstanceOf(NextResponse);
  });

  it('should set X-Response-Time header', () => {
    const ctx = createContext();
    const result = apiResponse(ctx) as NextResponse;
    expect(result.headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
  });

  // Next.js joins a middleware Cache-Control with the route's own value
  // ("public, s-maxage=60, …,no-store"), so caching policy belongs to routes.
  it('should leave Cache-Control to the route handler', () => {
    for (const apiKeyTier of [null, 'free', 'enterprise'] as const) {
      const ctx = createContext({ apiKeyTier, apiKeyId: apiKeyTier ? 'key_123' : null });
      const result = apiResponse(ctx) as NextResponse;
      expect(result.headers.has('Cache-Control')).toBe(false);
    }
  });

  it('should set Vary: Accept header', () => {
    const ctx = createContext();
    const result = apiResponse(ctx) as NextResponse;
    expect(result.headers.get('Vary')).toContain('Accept');
  });

  it('should forward context headers to response', () => {
    const ctx = createContext({ headers: { 'X-Custom': 'value' } });
    const result = apiResponse(ctx) as NextResponse;
    expect(result.headers.get('X-Custom')).toBe('value');
  });

  it('should set X-Priority for enterprise tier', () => {
    const ctx = createContext({ apiKeyTier: 'enterprise', apiKeyId: 'key_ent_123' });
    const result = apiResponse(ctx) as NextResponse;
    expect(result.headers.get('X-Priority')).toBe('enterprise');
  });
});
