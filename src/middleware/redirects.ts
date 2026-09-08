/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Redirects Handler
 *
 * Handles /docs/api → /api-reference, /docs → external docs site redirect and
 * /dashboard/dashboard → /dashboard dedup fix.
 *
 * @module middleware/redirects
 */

import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';

export const redirects: MiddlewareHandler = (ctx) => {
  const { pathname } = ctx;

  // /docs/api is the on-site Swagger reference, now served at /api-reference.
  // Checked before the external /docs redirect so the catch-all cannot shadow it.
  if (/^(?:\/[a-z]{2}(?:-[A-Z]{2})?)?\/docs\/api\/?$/.test(pathname)) {
    const url = ctx.request.nextUrl.clone();
    url.pathname = '/api-reference';
    return NextResponse.redirect(url, { status: 301 });
  }

  // /docs is served by this app now. It used to 301 to docs.cryptocurrency.cv,
  // which stopped resolving, so every documentation link on the site led to a
  // DNS failure. The markdown under docs/ renders at /docs instead.

  // Fix double-dashboard paths (/dashboard/dashboard/… → /dashboard/…)
  const dblDash = pathname.match(/^(\/[a-z]{2}(?:-[A-Z]{2})?)?\/dashboard\/dashboard(\/.*)?$/);
  if (dblDash) {
    const url = ctx.request.nextUrl.clone();
    url.pathname = `${dblDash[1] || ''}/dashboard${dblDash[2] || ''}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  return ctx;
};
