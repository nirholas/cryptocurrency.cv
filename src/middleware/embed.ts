/**
 * Embed Route Handler
 *
 * Embed routes skip intl and allow cross-origin iframing.
 *
 * @module middleware/embed
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';

export const embed: MiddlewareHandler = (ctx) => {
  if (!ctx.isEmbedRoute) return ctx;

  const response = NextResponse.next();
  response.headers.delete('X-Frame-Options');
  response.headers.set('Content-Security-Policy', 'frame-ancestors *');
  return response;
};
