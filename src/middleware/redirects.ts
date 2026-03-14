/**
 * Redirects Handler
 *
 * Handles /docs → external docs site redirect and
 * /dashboard/dashboard → /dashboard dedup fix.
 *
 * @module middleware/redirects
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';

export const redirects: MiddlewareHandler = (ctx) => {
  const { pathname } = ctx;

  // Redirect /docs to external docs site
  const docsMatch = pathname.match(/^(?:\/[a-z]{2}(?:-[A-Z]{2})?)?\/docs(\/.*)?$/);
  if (docsMatch) {
    const sub = (docsMatch[1] || '').replace(/^\//, '');
    const dest = sub ? `https://docs.cryptocurrency.cv/${sub}` : 'https://docs.cryptocurrency.cv';
    return NextResponse.redirect(dest, { status: 301 });
  }

  // Fix double-dashboard paths (/dashboard/dashboard/… → /dashboard/…)
  const dblDash = pathname.match(/^(\/[a-z]{2}(?:-[A-Z]{2})?)?\/dashboard\/dashboard(\/.*)?$/);
  if (dblDash) {
    const url = ctx.request.nextUrl.clone();
    url.pathname = `${dblDash[1] || ''}/dashboard${dblDash[2] || ''}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  return ctx;
};
