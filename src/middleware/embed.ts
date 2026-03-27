/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Embed Route Handler
 *
 * Embed routes skip intl and allow cross-origin iframing.
 *
 * @module middleware/embed
 */

import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';

export const embed: MiddlewareHandler = (ctx) => {
  if (!ctx.isEmbedRoute) return ctx;

  const response = NextResponse.next();
  response.headers.delete('X-Frame-Options');
  response.headers.set('Content-Security-Policy', 'frame-ancestors *');
  return response;
};
