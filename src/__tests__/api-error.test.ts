/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ERROR_CODES,
  ErrorSeverity,
  createApiError,
  ApiError,
  withErrorHandler,
} from '@/lib/api-error';
import type { ErrorCode, ApiErrorResponse, ValidationError } from '@/lib/api-error';

describe('ERROR_CODES', () => {
  it('should contain all expected client error codes', () => {
    expect(ERROR_CODES.INVALID_REQUEST).toBe('INVALID_REQUEST');
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should contain all expected server error codes', () => {
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
    expect(ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
  });

  it('should contain business logic error codes', () => {
    expect(ERROR_CODES.INSUFFICIENT_CREDITS).toBe('INSUFFICIENT_CREDITS');
    expect(ERROR_CODES.INVALID_API_KEY).toBe('INVALID_API_KEY');
    expect(ERROR_CODES.EXPIRED_API_KEY).toBe('EXPIRED_API_KEY');
  });
});

describe('ErrorSeverity', () => {
  it('should have all severity levels', () => {
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });
});

describe('createApiError', () => {
  it('should return a NextResponse with correct status', async () => {
    const response = createApiError({ code: 'NOT_FOUND', message: 'Not found' });
    expect(response.status).toBe(404);
  });

  it('should include error message in body', async () => {
    const response = createApiError({ code: 'INVALID_REQUEST', message: 'Bad input' });
    const body: ApiErrorResponse = await response.json();
    expect(body.error).toBe('Bad input');
    expect(body.code).toBe('INVALID_REQUEST');
  });

  it('should include timestamp', async () => {
    const response = createApiError({ code: 'INTERNAL_ERROR', message: 'Oops' });
    const body: ApiErrorResponse = await response.json();
    expect(body.timestamp).toBeTruthy();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('should include requestId when provided', async () => {
    const response = createApiError({
      code: 'INTERNAL_ERROR',
      message: 'Error',
      requestId: 'req-123',
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.requestId).toBe('req-123');
    expect(response.headers.get('X-Request-ID')).toBe('req-123');
  });

  it('should include path when provided', async () => {
    const response = createApiError({
      code: 'NOT_FOUND',
      message: 'Missing',
      path: '/api/news',
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.path).toBe('/api/news');
  });

  it('should include retryAfter for rate limits', async () => {
    const response = createApiError({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      retryAfter: 30,
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.retryAfter).toBe(30);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should include validationErrors', async () => {
    const valErrors: ValidationError[] = [{ field: 'email', message: 'Invalid email' }];
    const response = createApiError({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      validationErrors: valErrors,
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.validationErrors).toEqual(valErrors);
  });

  it('should include suggestion and docsUrl', async () => {
    const response = createApiError({
      code: 'UNAUTHORIZED',
      message: 'Auth required',
      suggestion: 'Use API key',
      docsUrl: '/docs/auth',
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.suggestion).toBe('Use API key');
    expect(body.docsUrl).toBe('/docs/auth');
  });

  it('should exclude details in production', async () => {
    const origEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    const response = createApiError({
      code: 'INTERNAL_ERROR',
      message: 'Error',
      details: { stack: 'secret' },
    });
    const body: ApiErrorResponse = await response.json();
    expect(body.details).toBeUndefined();
    (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
  });

  it('should map status codes correctly', async () => {
    const cases: Array<{ code: ErrorCode; expected: number }> = [
      { code: 'INVALID_REQUEST', expected: 400 },
      { code: 'UNAUTHORIZED', expected: 401 },
      { code: 'FORBIDDEN', expected: 403 },
      { code: 'NOT_FOUND', expected: 404 },
      { code: 'METHOD_NOT_ALLOWED', expected: 405 },
      { code: 'RATE_LIMIT_EXCEEDED', expected: 429 },
      { code: 'INTERNAL_ERROR', expected: 500 },
      { code: 'SERVICE_UNAVAILABLE', expected: 503 },
      { code: 'TIMEOUT', expected: 504 },
      { code: 'UPSTREAM_ERROR', expected: 502 },
      { code: 'PAYMENT_REQUIRED', expected: 402 },
    ];
    for (const { code, expected } of cases) {
      const resp = createApiError({ code, message: 'test' });
      expect(resp.status).toBe(expected);
    }
  });

  it('should set CORS and Cache-Control headers', () => {
    const response = createApiError({ code: 'INTERNAL_ERROR', message: 'Error' });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});

describe('ApiError quick creators', () => {
  it('badRequest should return 400', () => {
    const response = ApiError.badRequest('Bad');
    expect(response.status).toBe(400);
  });

  it('validation should include validationErrors', async () => {
    const response = ApiError.validation('Invalid', [{ field: 'name', message: 'required' }]);
    const body = await response.json();
    expect(body.validationErrors).toHaveLength(1);
    expect(response.status).toBe(400);
  });

  it('unauthorized should return 401', () => {
    const response = ApiError.unauthorized();
    expect(response.status).toBe(401);
  });

  it('unauthorized should accept custom message', async () => {
    const response = ApiError.unauthorized('Token expired');
    const body = await response.json();
    expect(body.error).toBe('Token expired');
  });

  it('forbidden should return 403', () => {
    expect(ApiError.forbidden().status).toBe(403);
  });

  it('notFound should return 404', () => {
    expect(ApiError.notFound().status).toBe(404);
  });

  it('methodNotAllowed should return 405 with method info', async () => {
    const response = ApiError.methodNotAllowed('DELETE', ['GET', 'POST']);
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error).toContain('DELETE');
    expect(body.error).toContain('GET');
  });

  it('rateLimit should return 429 with retryAfter', async () => {
    const response = ApiError.rateLimit(60);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('paymentRequired should return 402', () => {
    expect(ApiError.paymentRequired().status).toBe(402);
  });

  it('internal should return 500', () => {
    expect(ApiError.internal().status).toBe(500);
  });

  it('serviceUnavailable should return 503 with retryAfter', () => {
    const response = ApiError.serviceUnavailable();
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('upstream should return 502 with service name', async () => {
    const response = ApiError.upstream('CoinGecko');
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toContain('CoinGecko');
  });

  it('timeout should return 504', () => {
    const response = ApiError.timeout();
    expect(response.status).toBe(504);
  });

  describe('from', () => {
    it('should convert Error to standard format', () => {
      const result = ApiError.from(new Error('Something broke'));
      expect(result.message).toBe('Something broke');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should convert string to standard format', () => {
      const result = ApiError.from('string error');
      expect(result.message).toBe('string error');
      expect(result.code).toBe('INTERNAL_ERROR');
    });

    it('should convert unknown type', () => {
      const result = ApiError.from(42);
      expect(result.message).toBe('42');
    });
  });
});

describe('withErrorHandler', () => {
  it('should return handler result on success', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = withErrorHandler(handler);
    const result = await wrapped();
    expect(result).toBeDefined();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should catch errors and return 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('boom'));
    const wrapped = withErrorHandler(handler);
    const result = await wrapped();
    expect(result.status).toBe(500);
  });

  it('should pass arguments through to handler', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = withErrorHandler(handler);
    await wrapped('arg1', 'arg2');
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle non-Error throws', async () => {
    const handler = vi.fn().mockRejectedValue('string throw');
    const wrapped = withErrorHandler(handler);
    const result = await wrapped();
    expect(result.status).toBe(500);
  });
});
