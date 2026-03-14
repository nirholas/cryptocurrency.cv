/**
 * Internationalisation Handler
 *
 * For non-API routes: applies next-intl locale routing and
 * nonce-based CSP headers. Short-circuits with the intl response.
 *
 * @module middleware/intl
 */

import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { routing } from '../i18n/navigation';
import { buildCspHeader } from './security';

const intlMiddleware = createMiddleware(routing);

export const intl: MiddlewareHandler = (ctx) => {
  if (ctx.isApiRoute) return ctx;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCspHeader(nonce);

  const response = intlMiddleware(ctx.request);

  // Expose nonce to server components via headers()
  response.headers.set('x-middleware-request-x-nonce', nonce);
  // Let the Next.js renderer read the CSP to auto-add nonces to framework scripts
  response.headers.set('x-middleware-request-content-security-policy', csp);
  // Send the CSP to the browser
  response.headers.set('Content-Security-Policy', csp);

  // Prevent search engines from indexing the sources page (anti-scrape)
  const normalised = ctx.pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
  if (normalised === '/sources' || normalised.startsWith('/sources/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
};
