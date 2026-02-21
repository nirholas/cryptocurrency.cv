/**
 * Tests for lib/api-error.ts
 * Covers ERROR_CODES, createApiError, ApiError factory methods, withErrorHandler
 */

import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  ErrorSeverity,
  createApiError,
  ApiError,
  withErrorHandler,
  type ApiErrorResponse,
  type ValidationError,
} from '@/lib/api-error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function parseResponse(res: Response): Promise<ApiErrorResponse> {
  return res.json() as Promise<ApiErrorResponse>;
}

// ---------------------------------------------------------------------------
// ERROR_CODES catalog
// ---------------------------------------------------------------------------

describe('ERROR_CODES', () => {
  const expectedCodes = [
    'INVALID_REQUEST',
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'METHOD_NOT_ALLOWED',
    'RATE_LIMIT_EXCEEDED',
    'PAYMENT_REQUIRED',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
    'UPSTREAM_ERROR',
    'TIMEOUT',
    'NOT_IMPLEMENTED',
    'INVALID_API_KEY',
    'EXPIRED_API_KEY',
    'DUPLICATE_ENTRY',
    'REQUEST_TOO_LARGE',
  ];

  for (const code of expectedCodes) {
    it(`exports ${code}`, () => {
      expect(ERROR_CODES[code as keyof typeof ERROR_CODES]).toBe(code);
    });
  }
});

// ---------------------------------------------------------------------------
// ErrorSeverity enum
// ---------------------------------------------------------------------------

describe('ErrorSeverity', () => {
  it('has expected values', () => {
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// createApiError
// ---------------------------------------------------------------------------

describe('createApiError', () => {
  it('returns correct HTTP status for NOT_FOUND', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'Resource missing' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for INVALID_REQUEST', async () => {
    const res = createApiError({ code: 'INVALID_REQUEST', message: 'Bad input' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for UNAUTHORIZED', async () => {
    const res = createApiError({ code: 'UNAUTHORIZED', message: 'Not authorized' });
    expect(res.status).toBe(401);
  });

  it('returns 402 for PAYMENT_REQUIRED', async () => {
    const res = createApiError({ code: 'PAYMENT_REQUIRED', message: 'Upgrade required' });
    expect(res.status).toBe(402);
  });

  it('returns 403 for FORBIDDEN', async () => {
    const res = createApiError({ code: 'FORBIDDEN', message: 'No access' });
    expect(res.status).toBe(403);
  });

  it('returns 405 for METHOD_NOT_ALLOWED', async () => {
    const res = createApiError({ code: 'METHOD_NOT_ALLOWED', message: 'POST not allowed' });
    expect(res.status).toBe(405);
  });

  it('returns 429 for RATE_LIMIT_EXCEEDED', async () => {
    const res = createApiError({ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
    expect(res.status).toBe(429);
  });

  it('returns 500 for INTERNAL_ERROR', async () => {
    const res = createApiError({ code: 'INTERNAL_ERROR', message: 'Server error' });
    expect(res.status).toBe(500);
  });

  it('returns 502 for UPSTREAM_ERROR', async () => {
    const res = createApiError({ code: 'UPSTREAM_ERROR', message: 'Bad gateway' });
    expect(res.status).toBe(502);
  });

  it('returns 503 for SERVICE_UNAVAILABLE', async () => {
    const res = createApiError({ code: 'SERVICE_UNAVAILABLE', message: 'Down' });
    expect(res.status).toBe(503);
  });

  it('returns 504 for TIMEOUT', async () => {
    const res = createApiError({ code: 'TIMEOUT', message: 'Timed out' });
    expect(res.status).toBe(504);
  });

  it('includes error message in body', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'The item was not found' });
    const body = await parseResponse(res);
    expect(body.error).toBe('The item was not found');
  });

  it('includes correct code in body', async () => {
    const res = createApiError({ code: 'VALIDATION_FAILED', message: 'Bad data' });
    const body = await parseResponse(res);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('includes timestamp in ISO 8601 format', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'x' });
    const body = await parseResponse(res);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes requestId when provided', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'x', requestId: 'req-abc' });
    const body = await parseResponse(res);
    expect(body.requestId).toBe('req-abc');
  });

  it('includes path when provided', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'x', path: '/api/coins' });
    const body = await parseResponse(res);
    expect(body.path).toBe('/api/coins');
  });

  it('includes suggestion when provided', async () => {
    const res = createApiError({ code: 'UNAUTHORIZED', message: 'x', suggestion: 'Use API key' });
    const body = await parseResponse(res);
    expect(body.suggestion).toBe('Use API key');
  });

  it('includes docsUrl when provided', async () => {
    const res = createApiError({ code: 'UNAUTHORIZED', message: 'x', docsUrl: 'https://example.com/docs' });
    const body = await parseResponse(res);
    expect(body.docsUrl).toBe('https://example.com/docs');
  });

  it('includes retryAfter in body when provided', async () => {
    const res = createApiError({ code: 'RATE_LIMIT_EXCEEDED', message: 'x', retryAfter: 60 });
    const body = await parseResponse(res);
    expect(body.retryAfter).toBe(60);
  });

  it('includes Retry-After header for rate limit with retryAfter set', async () => {
    const res = createApiError({ code: 'RATE_LIMIT_EXCEEDED', message: 'x', retryAfter: 30 });
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('includes validationErrors when provided', async () => {
    const errors: ValidationError[] = [{ field: 'email', message: 'Invalid email', received: 'notanemail' }];
    const res = createApiError({ code: 'VALIDATION_FAILED', message: 'x', validationErrors: errors });
    const body = await parseResponse(res);
    expect(body.validationErrors).toHaveLength(1);
    expect(body.validationErrors![0].field).toBe('email');
  });

  it('has CORS header', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'x' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('has no-cache Cache-Control header', async () => {
    const res = createApiError({ code: 'NOT_FOUND', message: 'x' });
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('does NOT include details in non-development mode', async () => {
    // NODE_ENV is 'test' during vitest runs
    const res = createApiError({ code: 'INTERNAL_ERROR', message: 'x', details: { stack: 'Error at...' } });
    const body = await parseResponse(res);
    expect(body.details).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ApiError factory methods
// ---------------------------------------------------------------------------

describe('ApiError.badRequest', () => {
  it('returns status 400', () => {
    expect(ApiError.badRequest('Bad input').status).toBe(400);
  });

  it('serializes message', async () => {
    const body = await parseResponse(ApiError.badRequest('Field required'));
    expect(body.error).toBe('Field required');
    expect(body.code).toBe('INVALID_REQUEST');
  });
});

describe('ApiError.validation', () => {
  const errors: ValidationError[] = [{ field: 'slug', message: 'Must be lowercase' }];

  it('returns status 400', () => {
    expect(ApiError.validation('Validation failed', errors).status).toBe(400);
  });

  it('includes validationErrors', async () => {
    const body = await parseResponse(ApiError.validation('Validation failed', errors));
    expect(body.validationErrors).toHaveLength(1);
    expect(body.validationErrors![0].field).toBe('slug');
  });

  it('has VALIDATION_FAILED code', async () => {
    const body = await parseResponse(ApiError.validation('Bad', []));
    expect(body.code).toBe('VALIDATION_FAILED');
  });
});

describe('ApiError.unauthorized', () => {
  it('returns status 401', () => {
    expect(ApiError.unauthorized().status).toBe(401);
  });

  it('has suggestion and docsUrl in body', async () => {
    const body = await parseResponse(ApiError.unauthorized());
    expect(body.suggestion).toBeTruthy();
    expect(body.docsUrl).toBeTruthy();
  });
});

describe('ApiError.forbidden', () => {
  it('returns status 403', () => {
    expect(ApiError.forbidden('No access').status).toBe(403);
  });
});

describe('ApiError.notFound', () => {
  it('returns status 404', () => {
    expect(ApiError.notFound().status).toBe(404);
  });

  it('uses custom message when provided', async () => {
    const body = await parseResponse(ApiError.notFound('Article not found'));
    expect(body.error).toBe('Article not found');
  });
});

describe('ApiError.methodNotAllowed', () => {
  it('returns status 405', () => {
    expect(ApiError.methodNotAllowed('DELETE', ['GET', 'POST']).status).toBe(405);
  });

  it('includes method in error message', async () => {
    const body = await parseResponse(ApiError.methodNotAllowed('DELETE', ['GET']));
    expect(body.error).toContain('DELETE');
  });
});

describe('ApiError.rateLimit', () => {
  it('returns status 429', () => {
    expect(ApiError.rateLimit(60).status).toBe(429);
  });

  it('includes retryAfter in body', async () => {
    const body = await parseResponse(ApiError.rateLimit(60));
    expect(body.retryAfter).toBe(60);
  });

  it('includes Retry-After header', () => {
    const res = ApiError.rateLimit(120);
    expect(res.headers.get('Retry-After')).toBe('120');
  });
});

describe('ApiError.paymentRequired', () => {
  it('returns status 402', () => {
    expect(ApiError.paymentRequired('Upgrade plan').status).toBe(402);
  });
});

describe('ApiError.internal', () => {
  it('returns status 500', () => {
    expect(ApiError.internal().status).toBe(500);
  });

  it('uses generic message in production', async () => {
    const body = await parseResponse(ApiError.internal());
    expect(body.error).toBeTruthy();
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});

describe('ApiError.serviceUnavailable', () => {
  it('returns status 503 with default message', () => {
    expect(ApiError.serviceUnavailable().status).toBe(503);
  });

  it('accepts custom message', () => {
    expect(ApiError.serviceUnavailable('Maintenance').status).toBe(503);
  });
});

describe('ApiError.upstream', () => {
  it('returns status 502', () => {
    expect(ApiError.upstream('CoinGecko').status).toBe(502);
  });

  it('includes service name in error message', async () => {
    const body = await parseResponse(ApiError.upstream('CoinGecko'));
    expect(body.error).toContain('CoinGecko');
  });
});

describe('ApiError.timeout', () => {
  it('returns status 504', () => {
    expect(ApiError.timeout().status).toBe(504);
  });

  it('has TIMEOUT code', async () => {
    const body = await parseResponse(ApiError.timeout());
    expect(body.code).toBe('TIMEOUT');
  });
});

// ---------------------------------------------------------------------------
// withErrorHandler
// ---------------------------------------------------------------------------

describe('withErrorHandler', () => {
  it('passes through successful handler response', async () => {
    const { NextResponse } = await import('next/server');
    const handler = async () =>
      NextResponse.json({ ok: true }, { status: 200 });
    const wrapped = withErrorHandler(handler);
    const res = await wrapped();
    expect(res.status).toBe(200);
  });

  it('returns 500 when handler throws generic Error', async () => {
    const handler = async () => {
      throw new Error('Something went wrong');
    };
    const wrapped = withErrorHandler(handler);
    const res = await wrapped();
    expect(res.status).toBe(500);
    const body = await res.json() as ApiErrorResponse;
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('catches any thrown value and returns 500', async () => {
    const handler = async () => {
      throw 'string error'; // thrown non-Error value
    };
    const wrapped = withErrorHandler(handler);
    const res = await wrapped();
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
