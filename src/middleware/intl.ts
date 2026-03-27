/**
 * Internationalisation Handler
 *
 * For non-API routes: applies next-intl locale routing and
 * nonce-based CSP headers. Short-circuits with the intl response.
 *
 * @module middleware/intl
 */

import createMiddleware from 'next-intl/middleware';
import type { MiddlewareHandler } from './types';
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
