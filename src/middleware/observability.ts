/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Observability Handler
 *
 * Sets request ID, client IP, security headers, and detects
 * API client type for API routes.
 *
 * @module middleware/observability
 */

import type { MiddlewareHandler } from './types';
import { SECURITY_HEADERS } from './security';
import { getClientIp } from './config';
import { isApiClient } from './bot-detection';

export const observability: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  ctx.clientIp = getClientIp(ctx.request);
  ctx.isApiClient = isApiClient(ctx.request);
  ctx.headers['X-Request-ID'] = ctx.requestId;
  ctx.headers['X-RateLimit-Policy'] = 'fair-use';
  Object.assign(ctx.headers, SECURITY_HEADERS);

  return ctx;
};
