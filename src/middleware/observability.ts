/**
 * Observability Handler
 *
 * Sets request ID, client IP, security headers, and detects
 * API client type for API routes.
 *
 * @module middleware/observability
 */

import type { MiddlewareContext, MiddlewareHandler } from './types';
import { SECURITY_HEADERS } from './security';
import { getClientIp } from './config';
import { isApiClient } from './bot-detection';

export const observability: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  ctx.clientIp = getClientIp(ctx.request);
  ctx.isApiClient = isApiClient(ctx.request);
  ctx.isAlibabaGateway = !!ctx.request.headers.get('x-ca-key');

  ctx.headers['X-Request-ID'] = ctx.requestId;
  ctx.headers['X-RateLimit-Policy'] = 'fair-use';
  Object.assign(ctx.headers, SECURITY_HEADERS);

  return ctx;
};
