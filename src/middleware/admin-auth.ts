/**
 * Admin Auth Handler
 *
 * Bearer-token guard for admin routes. Also handles CORS restriction
 * on sensitive routes (admin, internal, key-management).
 *
 * @module middleware/admin-auth
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { isTrustedOrigin } from './trusted-origins';

export const adminAuth: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const { pathname } = ctx;

  // Admin auth — constant-time comparison to prevent timing attacks
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    const adminToken = ctx.request.headers.get('Authorization')?.replace('Bearer ', '');
    const expected = process.env.ADMIN_TOKEN;
    let adminAuthed = false;
    if (expected && adminToken) {
      const enc = new TextEncoder();
      const a = enc.encode(adminToken);
      const b = enc.encode(expected);
      if (a.byteLength === b.byteLength) {
        let diff = 0;
        for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
        adminAuthed = diff === 0;
      }
    }
    if (!adminAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'ADMIN_AUTH_REQUIRED', requestId: ctx.requestId },
        { status: 401, headers: ctx.headers },
      );
    }
  }

  // CORS restriction on sensitive routes — only trusted origins allowed
  const isSensitiveRoute =
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/internal') ||
    pathname.startsWith('/api/keys/');

  if (isSensitiveRoute) {
    const origin = ctx.request.headers.get('origin') ?? '';
    if (origin && !isTrustedOrigin(origin)) {
      ctx.headers['Access-Control-Allow-Origin'] = 'null';
    } else if (origin) {
      ctx.headers['Access-Control-Allow-Origin'] = origin;
      ctx.headers['Vary'] = 'Origin';
    }
  }

  return ctx;
};
