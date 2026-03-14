/**
 * CORS Handler
 *
 * Handles CORS preflight (OPTIONS) for API routes.
 *
 * @module middleware/cors
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { SECURITY_HEADERS } from './security';
import { isTrustedOrigin } from './trusted-origins';

export const cors: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  // CORS preflight — respond immediately, skip all downstream checks
  if (ctx.request.method === 'OPTIONS') {
    const origin = ctx.request.headers.get('origin') ?? '';
    const preflightHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-speraxos-token, x-api-key',
      'Access-Control-Max-Age': '86400',
      ...SECURITY_HEADERS,
    };
    if (origin && isTrustedOrigin(origin)) {
      preflightHeaders['Access-Control-Allow-Origin'] = origin;
      preflightHeaders['Vary'] = 'Origin';
    } else {
      preflightHeaders['Access-Control-Allow-Origin'] = '*';
    }
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  return ctx;
};
