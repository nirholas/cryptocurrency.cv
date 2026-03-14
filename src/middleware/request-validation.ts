/**
 * Request Validation Handler
 *
 * Rejects requests with suspicious payloads (injection attempts).
 * Only active for API routes.
 *
 * @module middleware/request-validation
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { isSuspiciousRequest } from './security';

export const requestValidation: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const suspiciousLocation = isSuspiciousRequest(ctx.request);
  if (suspiciousLocation) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        code: 'SUSPICIOUS_INPUT',
        message: 'Request contains potentially malicious content',
        requestId: ctx.requestId,
      },
      { status: 400, headers: ctx.headers },
    );
  }

  return ctx;
};
