/**
 * Middleware Composition Utility
 *
 * Chains middleware handlers sequentially. Each handler either enriches
 * the context and passes it forward, or short-circuits by returning a
 * NextResponse directly (e.g., 403, 429).
 *
 * @module middleware/compose
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';

export function compose(...handlers: MiddlewareHandler[]): MiddlewareHandler {
  return async (ctx: MiddlewareContext) => {
    for (const handler of handlers) {
      const result = await handler(ctx);
      if (result instanceof NextResponse) return result;
      ctx = result;
    }
    return ctx;
  };
}
