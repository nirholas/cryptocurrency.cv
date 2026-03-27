/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for redirects middleware handler
 */

import { describe, it, expect } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { redirects } from '@/middleware/redirects';
import type { MiddlewareContext } from '@/middleware/types';

function createContext(pathname: string): MiddlewareContext {
  const url = new URL('http://localhost:3000' + pathname);
  return {
    request: new NextRequest(url),
    requestId: 'req_test_123',
    startTime: Date.now(),
    pathname,
    isApiRoute: pathname.startsWith('/api/'),
    isEmbedRoute: pathname.startsWith('/embed/') || pathname === '/embed',
    isSperaxOS: false,
    isTrustedOrigin: false,
    isApiClient: false,
    clientIp: '127.0.0.1',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
  };
}

describe('redirects handler', () => {
  it('should redirect /docs to external docs site', () => {
    const ctx = createContext('/docs');
    const result = redirects(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    const resp = result as NextResponse;
    expect(resp.status).toBe(301);
    expect(resp.headers.get('location')).toBe('https://docs.cryptocurrency.cv/');
  });

  it('should redirect /docs/api to external docs subpath', () => {
    const ctx = createContext('/docs/api');
    const result = redirects(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    const resp = result as NextResponse;
    expect(resp.status).toBe(301);
    expect(resp.headers.get('location')).toBe('https://docs.cryptocurrency.cv/api');
  });

  it('should redirect locale-prefixed /docs', () => {
    const ctx = createContext('/en/docs');
    const result = redirects(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(301);
  });

  it('should fix double-dashboard paths', () => {
    const ctx = createContext('/dashboard/dashboard/settings');
    const result = redirects(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    const resp = result as NextResponse;
    expect(resp.status).toBe(301);
    expect(resp.headers.get('location')).toContain('/dashboard/settings');
  });

  it('should pass through normal routes', () => {
    const ctx = createContext('/about');
    const result = redirects(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toBe(ctx);
  });

  it('should pass through API routes', () => {
    const ctx = createContext('/api/news');
    const result = redirects(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toBe(ctx);
  });
});
