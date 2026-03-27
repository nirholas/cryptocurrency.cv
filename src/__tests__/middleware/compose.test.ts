/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for the compose() middleware utility
 */

import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { compose } from '@/middleware/compose';
import type { MiddlewareContext, MiddlewareHandler } from '@/middleware/types';

function createContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
  const url = new URL('http://localhost:3000/api/test');
  return {
    request: new NextRequest(url),
    requestId: 'req_test_123',
    startTime: Date.now(),
    pathname: '/api/test',
    isApiRoute: true,
    isEmbedRoute: false,
    isSperaxOS: false,
    isTrustedOrigin: false,
    isApiClient: false,
    clientIp: '127.0.0.1',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
    ...overrides,
  };
}

describe('compose', () => {
  it('should run handlers sequentially and return final context', async () => {
    const order: number[] = [];
    const h1: MiddlewareHandler = (ctx) => {
      order.push(1);
      return ctx;
    };
    const h2: MiddlewareHandler = (ctx) => {
      order.push(2);
      return ctx;
    };
    const h3: MiddlewareHandler = (ctx) => {
      order.push(3);
      return ctx;
    };

    const pipeline = compose(h1, h2, h3);
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect(order).toEqual([1, 2, 3]);
    expect(result).toBe(ctx);
  });

  it('should short-circuit when a handler returns a NextResponse', async () => {
    const order: number[] = [];
    const h1: MiddlewareHandler = (ctx) => {
      order.push(1);
      return ctx;
    };
    const h2: MiddlewareHandler = () => {
      order.push(2);
      return new NextResponse('Blocked', { status: 403 });
    };
    const h3: MiddlewareHandler = (ctx) => {
      order.push(3);
      return ctx;
    };

    const pipeline = compose(h1, h2, h3);
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect(order).toEqual([1, 2]);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it('should pass enriched context through the chain', async () => {
    const h1: MiddlewareHandler = (ctx) => {
      ctx.headers['X-Test'] = 'hello';
      return ctx;
    };
    const h2: MiddlewareHandler = (ctx) => {
      ctx.headers['X-Test2'] = ctx.headers['X-Test'] + '-world';
      return ctx;
    };

    const pipeline = compose(h1, h2);
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).headers['X-Test']).toBe('hello');
    expect((result as MiddlewareContext).headers['X-Test2']).toBe('hello-world');
  });

  it('should handle async handlers', async () => {
    const h1: MiddlewareHandler = async (ctx) => {
      await new Promise((r) => setTimeout(r, 1));
      ctx.isSperaxOS = true;
      return ctx;
    };
    const h2: MiddlewareHandler = (ctx) => {
      expect(ctx.isSperaxOS).toBe(true);
      return ctx;
    };

    const pipeline = compose(h1, h2);
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });

  it('should handle an empty pipeline', async () => {
    const pipeline = compose();
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect(result).toBe(ctx);
  });

  it('should short-circuit on first handler if it returns NextResponse', async () => {
    const h1: MiddlewareHandler = () => NextResponse.redirect('https://example.com');
    const h2: MiddlewareHandler = (ctx) => {
      ctx.headers['X-Should-Not-Run'] = '1';
      return ctx;
    };

    const pipeline = compose(h1, h2);
    const ctx = createContext();
    const result = await pipeline(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect(ctx.headers['X-Should-Not-Run']).toBeUndefined();
  });
});
