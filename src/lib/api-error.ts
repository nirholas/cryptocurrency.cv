/**
 * API Error Handling System
 * 
 * Provides:
 * - Standardized error response format
 * - Error codes catalog
 * - Type-safe error creation
 * - Error severity levels
 */

import { NextResponse } from 'next/server';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',           // Validation errors, bad input
  MEDIUM = 'medium',     // Not found, unauthorized
  HIGH = 'high',         // Server errors, upstream failures
  CRITICAL = 'critical', // Database down, critical service failure
}

/**
 * Standard API error codes
 */
export const ERROR_CODES = {
  // Client Errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  
  // Business Logic Errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INVALID_API_KEY: 'INVALID_API_KEY',
  EXPIRED_API_KEY: 'EXPIRED_API_KEY',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // External Service Errors
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  error: string;                    // Human-readable error message
  code: ErrorCode;                  // Machine-readable error code
  message?: string;                 // Additional details
  details?: unknown;                // Technical details (dev mode only)
  timestamp: string;                // ISO 8601 timestamp
  requestId?: string;               // Request ID (from middleware)
  path?: string;                    // Request path
  
  // Optional fields based on error type
  retryAfter?: number;              // Seconds to wait (for rate limits)
  validationErrors?: ValidationError[]; // For validation failures
  suggestion?: string;              // Helpful suggestion to fix
  docsUrl?: string;                 // Link to documentation
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  received?: unknown;
  expected?: string;
}

/**
 * Error creation options
 */
export interface ApiErrorOptions {
  code: ErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
  path?: string;
  severity?: ErrorSeverity;
  retryAfter?: number;
  validationErrors?: ValidationError[];
  suggestion?: string;
  docsUrl?: string;
}

/**
 * HTTP status codes for error codes
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  // 400 errors
  INVALID_REQUEST: 400,
  INVALID_JSON: 400,
  MISSING_PARAMETER: 400,
  INVALID_PARAMETER: 400,
  VALIDATION_FAILED: 400,
  DUPLICATE_ENTRY: 400,
  
  // 401 errors
  UNAUTHORIZED: 401,
  INVALID_API_KEY: 401,
  EXPIRED_API_KEY: 401,
  
  // 402 errors
  PAYMENT_REQUIRED: 402,
  INVALID_PAYMENT: 402,
  INSUFFICIENT_CREDITS: 402,
  
  // 403 errors
  FORBIDDEN: 403,
  
  // 404 errors
  NOT_FOUND: 404,
  
  // 405 errors
  METHOD_NOT_ALLOWED: 405,
  
  // 413 errors
  REQUEST_TOO_LARGE: 413,
  
  // 429 errors
  RATE_LIMIT_EXCEEDED: 429,
  
  // 500 errors
  INTERNAL_ERROR: 500,
  UPSTREAM_ERROR: 502,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 504,
  DATABASE_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  AI_SERVICE_ERROR: 500,
  CACHE_ERROR: 500,
  STORAGE_ERROR: 500,
};

/**
 * Create standardized API error response
 */
export function createApiError(options: ApiErrorOptions): NextResponse<ApiErrorResponse> {
  const {
    code,
    message,
    details,
    requestId,
    path,
    severity = ErrorSeverity.MEDIUM,
    retryAfter,
    validationErrors,
    suggestion,
    docsUrl,
  } = options;

  const status = ERROR_STATUS_MAP[code] || 500;
  
  const errorResponse: ApiErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
    ...(path && { path }),
    ...(retryAfter && { retryAfter }),
    ...(validationErrors && { validationErrors }),
    ...(suggestion && { suggestion }),
    ...(docsUrl && { docsUrl }),
  };

  // Only include technical details in development
  if (process.env.NODE_ENV === 'development' && details) {
    errorResponse.details = details;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  // Add retry-after header for rate limits
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  // Add request ID if available
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return NextResponse.json(errorResponse, { status, headers });
}

/**
 * Quick error creators for common cases
 */
export const ApiError = {
  badRequest: (message: string, details?: unknown) =>
    createApiError({
      code: 'INVALID_REQUEST',
      message,
      details,
      severity: ErrorSeverity.LOW,
    }),

  validation: (message: string, validationErrors: ValidationError[]) =>
    createApiError({
      code: 'VALIDATION_FAILED',
      message,
      validationErrors,
      severity: ErrorSeverity.LOW,
      suggestion: 'Check the validationErrors array for specific field issues',
    }),

  unauthorized: (message = 'Authentication required') =>
    createApiError({
      code: 'UNAUTHORIZED',
      message,
      severity: ErrorSeverity.MEDIUM,
      suggestion: 'Provide a valid API key or x402 payment',
      docsUrl: '/docs/authentication',
    }),

  forbidden: (message = 'Access forbidden') =>
    createApiError({
      code: 'FORBIDDEN',
      message,
      severity: ErrorSeverity.MEDIUM,
    }),

  notFound: (message = 'Resource not found') =>
    createApiError({
      code: 'NOT_FOUND',
      message,
      severity: ErrorSeverity.LOW,
    }),

  methodNotAllowed: (method: string, allowed: string[]) =>
    createApiError({
      code: 'METHOD_NOT_ALLOWED',
      message: `Method ${method} not allowed. Use ${allowed.join(', ')}`,
      severity: ErrorSeverity.LOW,
    }),

  rateLimit: (retryAfter: number) =>
    createApiError({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      severity: ErrorSeverity.MEDIUM,
      retryAfter,
      suggestion: 'Upgrade your plan for higher limits at /pricing',
    }),

  paymentRequired: (message = 'Payment required for this endpoint') =>
    createApiError({
      code: 'PAYMENT_REQUIRED',
      message,
      severity: ErrorSeverity.MEDIUM,
      docsUrl: '/docs/x402',
    }),

  internal: (message = 'Internal server error', details?: unknown) =>
    createApiError({
      code: 'INTERNAL_ERROR',
      message,
      details,
      severity: ErrorSeverity.HIGH,
    }),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    createApiError({
      code: 'SERVICE_UNAVAILABLE',
      message,
      severity: ErrorSeverity.HIGH,
      retryAfter: 60,
    }),

  upstream: (service: string, details?: unknown) =>
    createApiError({
      code: 'UPSTREAM_ERROR',
      message: `Upstream service error: ${service}`,
      details,
      severity: ErrorSeverity.HIGH,
    }),

  timeout: (message = 'Request timeout') =>
    createApiError({
      code: 'TIMEOUT',
      message,
      severity: ErrorSeverity.HIGH,
      retryAfter: 5,
    }),
};

/**
 * Wrap async handler with error catching
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Unhandled error in route:', error);
      
      return ApiError.internal(
        'An unexpected error occurred',
        error instanceof Error ? error.message : String(error)
      );
    }
  }) as T;
}
