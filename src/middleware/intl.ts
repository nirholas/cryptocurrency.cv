/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Internationalisation Handler
 *
 * For non-API routes: applies next-intl locale routing and
 * nonce-based CSP headers. Short-circuits with the intl response.
 *
 * @module middleware/intl
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';
import { routing } from '../i18n/navigation';
import { buildCspHeader } from './security';

const intlMiddleware = createMiddleware(routing);

/**
 * Pages that live outside the `[locale]` segment and must not be locale-routed.
 *
 * next-intl rewrites every non-API path into `/<locale>/<path>`. For a route
 * that has no `[locale]` counterpart that rewrite lands on a path no page
 * matches, which is why `/api-reference` answered 404 while its file sat right
 * there in `src/app` — and why `/docs/api`, which 301s here, was a dead link.
 */
const NON_LOCALE_ROUTES = [/^\/api-reference\/?$/];

export const intl: MiddlewareHandler = (ctx) => {
  if (ctx.isApiRoute) return ctx;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // `x-forwarded-proto` is what the load balancer sets; fall back to the
  // request URL's own protocol for direct connections.
  const forwardedProto = ctx.request.headers.get('x-forwarded-proto');
  const secureOrigin = forwardedProto
    ? forwardedProto.split(',')[0].trim() === 'https'
    : ctx.request.nextUrl.protocol === 'https:';
  const csp = buildCspHeader(nonce, secureOrigin);

  if (NON_LOCALE_ROUTES.some((r) => r.test(ctx.pathname))) {
    const passthrough = NextResponse.next();
    passthrough.headers.set('x-middleware-request-x-nonce', nonce);
    passthrough.headers.set('Content-Security-Policy', csp);
    return passthrough;
  }

  const response = intlMiddleware(ctx.request);

  // Expose nonce to server components via headers()
  response.headers.set('x-middleware-request-x-nonce', nonce);
  // Send the CSP to the browser.
  // NOTE: Do NOT set x-middleware-request-content-security-policy — Next.js 16
  // strips SHA-256 hashes from it and overwrites the Content-Security-Policy
  // response header with the hash-stripped version, breaking the inline
  // bootstrap script allowlist.
  response.headers.set('Content-Security-Policy', csp);

  // Prevent search engines from indexing the sources page (anti-scrape)
  const normalised = ctx.pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
  if (normalised === '/sources' || normalised.startsWith('/sources/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
};
