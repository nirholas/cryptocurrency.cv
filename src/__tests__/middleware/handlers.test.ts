/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for embed, cors, request-validation, and observability handlers
 */

import { describe, it, expect } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { embed } from '@/middleware/embed';
import { cors } from '@/middleware/cors';
import { requestValidation } from '@/middleware/request-validation';
import { observability } from '@/middleware/observability';
import type { MiddlewareContext } from '@/middleware/types';

function createContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
  const pathname = overrides.pathname || '/api/test';
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
    clientIp: 'unknown',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
    ...overrides,
  };
}

// =============================================================================
// embed handler
// =============================================================================

describe('embed handler', () => {
  it('should short-circuit for embed routes with permissive headers', () => {
    const ctx = createContext({ pathname: '/embed/widget', isEmbedRoute: true });
    const result = embed(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    const resp = result as NextResponse;
    expect(resp.headers.get('Content-Security-Policy')).toBe('frame-ancestors *');
  });

  it('should pass through for non-embed routes', () => {
    const ctx = createContext({ pathname: '/api/test', isEmbedRoute: false });
    const result = embed(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toBe(ctx);
  });
});

// =============================================================================
// cors handler
// =============================================================================

describe('cors handler', () => {
  it('should return 204 for OPTIONS preflight on API routes', () => {
    const url = new URL('http://localhost:3000/api/test');
    const request = new NextRequest(url, { method: 'OPTIONS' });
    const ctx = createContext({ request, isApiRoute: true });
    const result = cors(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(204);
  });

  it('should include CORS headers in preflight response', () => {
    const url = new URL('http://localhost:3000/api/test');
    const request = new NextRequest(url, { method: 'OPTIONS' });
    const ctx = createContext({ request, isApiRoute: true });
    const result = cors(ctx) as NextResponse;

    expect(result.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(result.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should pass through GET requests', () => {
    const ctx = createContext({ isApiRoute: true });
    const result = cors(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('should skip non-API routes', () => {
    const url = new URL('http://localhost:3000/about');
    const request = new NextRequest(url, { method: 'OPTIONS' });
    const ctx = createContext({ request, isApiRoute: false, pathname: '/about' });
    const result = cors(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
  });
});

// =============================================================================
// requestValidation handler
// =============================================================================

describe('requestValidation handler', () => {
  it('should block suspicious probes on API routes', () => {
    // Use javascript: protocol which survives URL encoding (unlike <script> tags)
    const url = new URL('http://localhost:3000/api/test?url=javascript:alert(1)');
    const request = new NextRequest(url);
    const ctx = createContext({ request, isApiRoute: true, pathname: '/api/test' });
    const result = requestValidation(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(400);
  });

  it('should pass clean API requests', () => {
    const ctx = createContext({ isApiRoute: true });
    const result = requestValidation(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('should skip non-API routes', () => {
    const url = new URL('http://localhost:3000/page?q=<script>');
    const request = new NextRequest(url);
    const ctx = createContext({ request, isApiRoute: false, pathname: '/page' });
    const result = requestValidation(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
  });
});

// =============================================================================
// observability handler
// =============================================================================

describe('observability handler', () => {
  it('should set request ID and security headers for API routes', () => {
    const ctx = createContext({ isApiRoute: true });
    const result = observability(ctx) as MiddlewareContext;

    expect(result.headers['X-Request-ID']).toBe('req_test_123');
    expect(result.headers['X-RateLimit-Policy']).toBe('fair-use');
    expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(result.headers['Strict-Transport-Security']).toBeDefined();
  });

  it('should skip non-API routes', () => {
    const ctx = createContext({ isApiRoute: false, pathname: '/about' });
    const result = observability(ctx) as MiddlewareContext;

    expect(result.headers['X-Request-ID']).toBeUndefined();
  });

});
