# 🤖 AGENT 2: Error Handling & Response Standardization

**Mission**: Create error handling utilities and standardize HIGH-PRIORITY API routes (v1, premium, news, market). Agent 3 will handle remaining routes.

**Priority**: HIGH - Works in parallel with Agent 1

**Estimated Time**: 2-3 hours

**Dependencies**: None (can start immediately, works on different files than Agent 1)

**Coordination**: Agent 3 continues route updates for remaining ~90 files

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Standardize error response format across ALL API routes
2. ✅ Create structured logging system with log levels
3. ✅ Implement consistent validation utilities
4. ✅ Add error codes catalog for all error types
5. ✅ Update all existing routes to use new standards

### Success Criteria
- [ ] Error utilities created and tested
- [ ] Structured logger working
- [ ] High-priority routes updated (~90 files):
  - [ ] All `/api/v1/*` routes
  - [ ] All `/api/premium/*` routes  
  - [ ] All `/api/news*` routes
  - [ ] All `/api/market/*` routes
  - [ ] All `/api/breaking`, `/api/sources`, `/api/trending`
- [ ] Error responses include request IDs (from Agent 1)
- [ ] Agent 3 ready to take over remaining routes

---

## 📁 FILES TO CREATE

### 1. `/src/lib/api-error.ts` (NEW)
**Purpose**: Standardized error handling system

```typescript
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
```

### 2. `/src/lib/logger.ts` (NEW)
**Purpose**: Structured logging system

```typescript
/**
 * Structured Logging System
 * 
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output
 * - Request context tracking
 * - Performance timing
 */

import { NextRequest } from 'next/server';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  meta?: Record<string, unknown>;
}

/**
 * Format log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Logger class
 */
class Logger {
  private context: LogContext = {};

  /**
   * Set context for subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get context from NextRequest
   */
  setRequestContext(request: NextRequest): void {
    this.setContext({
      requestId: request.headers.get('x-request-id') || undefined,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        context: this.context,
        meta,
      };
      console.debug(formatLogEntry(entry));
    }
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };
    console.log(formatLogEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };
    console.warn(formatLogEntry(entry));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      } else {
        entry.error = {
          message: String(error),
        };
      }
    }

    console.error(formatLogEntry(entry));
  }

  /**
   * Log request with timing
   */
  request(
    method: string,
    path: string,
    status: number,
    duration: number,
    meta?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level: status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO,
      message: `${method} ${path} ${status}`,
      timestamp: new Date().toISOString(),
      context: this.context,
      duration,
      meta: {
        ...meta,
        method,
        path,
        status,
      },
    };
    console.log(formatLogEntry(entry));
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Export singleton logger
export const logger = new Logger();

/**
 * Create logger for specific request
 */
export function createRequestLogger(request: NextRequest): Logger {
  const requestLogger = new Logger();
  requestLogger.setRequestContext(request);
  return requestLogger;
}

/**
 * Measure execution time
 */
export function measureTime<T>(
  fn: () => T | Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  const execute = async () => {
    const result = await fn();
    const duration = Date.now() - start;
    
    logger.debug(`${label} completed`, { duration });
    
    return { result, duration };
  };

  return execute();
}
```

### 3. `/src/lib/validation.ts` (UPDATE & ENHANCE)
**Purpose**: Enhanced validation utilities with better error messages

```typescript
/**
 * Enhanced Validation Utilities
 * 
 * Provides type-safe validation with clear error messages
 */

import { ValidationError } from './api-error';

/**
 * Validate required string parameter
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null || value === '') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} is required`,
        received: value,
        expected: 'non-empty string',
      },
    };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string`,
        received: typeof value,
        expected: 'string',
      },
    };
  }

  return { valid: true, value };
}

/**
 * Validate number in range
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): { valid: true; value: number } | { valid: false; error: ValidationError } {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        received: value,
        expected: 'number',
      },
    };
  }

  if (options.integer && !Number.isInteger(num)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an integer`,
        received: num,
        expected: 'integer',
      },
    };
  }

  if (options.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be >= ${options.min}`,
        received: num,
        expected: `>= ${options.min}`,
      },
    };
  }

  if (options.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be <= ${options.max}`,
        received: num,
        expected: `<= ${options.max}`,
      },
    };
  }

  return { valid: true, value: num };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): { valid: true; value: T } | { valid: false; error: ValidationError } {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string`,
        received: typeof value,
        expected: 'string',
      },
    };
  }

  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        received: value,
        expected: allowedValues.join(' | '),
      },
    };
  }

  return { valid: true, value: value as T };
}

/**
 * Validate array
 */
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator?: (item: unknown, index: number) => { valid: true } | { valid: false; error: ValidationError }
): { valid: true; value: T[] } | { valid: false; error: ValidationError } {
  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array`,
        received: typeof value,
        expected: 'array',
      },
    };
  }

  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i], i);
      if (!result.valid) {
        return {
          valid: false,
          error: {
            ...result.error,
            field: `${fieldName}[${i}].${result.error.field}`,
          },
        };
      }
    }
  }

  return { valid: true, value: value as T[] };
}

/**
 * Validate email
 */
export function validateEmail(
  value: unknown,
  fieldName: string
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string`,
        received: typeof value,
        expected: 'string',
      },
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        received: value,
        expected: 'email@example.com',
      },
    };
  }

  return { valid: true, value };
}

/**
 * Collect all validation errors
 */
export function collectValidationErrors(
  validators: Array<{ valid: boolean; error?: ValidationError }>
): ValidationError[] {
  return validators
    .filter((v): v is { valid: false; error: ValidationError } => !v.valid)
    .map(v => v.error);
}
```

---

## 📝 FILES TO UPDATE

### 4. Update ALL API routes to use new error system

**Pattern to find and replace:**

**OLD:**
```typescript
return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
```

**NEW:**
```typescript
return ApiError.internal('Something went wrong', error);
```

**Files to update** (use search & replace):
- All files in `/src/app/api/**/*.ts` (180+ files)

**Example conversions:**

```typescript
// OLD: Various patterns
return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
return errorResponse('Not found', 'Resource not found', 404);
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// NEW: Standardized
return ApiError.badRequest('Invalid category');
return ApiError.notFound('Resource not found');
return ApiError.unauthorized();
```

### 5. Update `/src/lib/api-utils.ts` (DEPRECATE old functions)

Add deprecation notices:
```typescript
/**
 * @deprecated Use ApiError from '@/lib/api-error' instead
 */
export function errorResponse(...) { ... }
```

---

## ✅ TESTING CHECKLIST

### Unit Tests
```typescript
// Create: src/__tests__/api-error.test.ts

describe('ApiError', () => {
  it('should create bad request error', () => {
    const error = ApiError.badRequest('Invalid input');
    expect(error.status).toBe(400);
  });
  
  it('should include request ID if provided', () => {
    const error = createApiError({
      code: 'INTERNAL_ERROR',
      message: 'Test',
      requestId: 'req_123',
    });
    // Assert request ID in response
  });
  
  it('should hide details in production', () => {
    process.env.NODE_ENV = 'production';
    const error = ApiError.internal('Error', { secret: 'data' });
    // Assert details not in response
  });
});
```

### Integration Tests
```typescript
// Test that all routes return consistent errors

describe('Error Consistency', () => {
  it('should return consistent 404 format', async () => {
    const response = await fetch('/api/v1/coin/nonexistent');
    const json = await response.json();
    
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('code');
    expect(json).toHaveProperty('timestamp');
  });
});
```

---

## 🚨 MIGRATION STRATEGY

### Phase 1: Create new utilities (30 min)
1. Create `/src/lib/api-error.ts`
2. Create `/src/lib/logger.ts`
3. Update `/src/lib/validation.ts`

### Phase 2: Update HIGH-PRIORITY routes (1.5 hours)
Update in priority order:
1. `/api/v1/*` - Paid endpoints (~12 files)
2. `/api/premium/*` - Premium endpoints (~15 files)
3. `/api/news/*` - Highest traffic (~5 files)
4. `/api/market/*` - Market data (~20 files)
5. `/api/breaking`, `/api/sources`, `/api/trending` (~10 files)

**Total: ~60-70 high-priority route files**

### Phase 3: Test & verify (30 min)
6. Run test suite for updated routes
7. Verify error consistency
8. Check logs format
9. Document patterns for Agent 3

**Note**: Agent 3 will handle remaining ~90 route files

---

## 📊 CONVERSION CHECKLIST

**Your scope: High-priority routes only (~60-70 files)**
- `/api/v1/**/*.ts`
- `/api/premium/**/*.ts`
- `/api/news/**/*.ts`
- `/api/market/**/*.ts`
- `/api/breaking/route.ts`, `/api/sources/route.ts`, `/api/trending/route.ts`

For EACH route file, update:
- [ ] Replace `console.error` with `logger.error`
- [ ] Replace `console.log` with `logger.info`
- [ ] Replace error responses with `ApiError.*`
- [ ] Add validation using new utilities
- [ ] Add try/catch with proper error codes
- [ ] Remove old `errorResponse()` calls

**Leave for Agent 3:**
- `/api/admin/**/*.ts`
- `/api/ai/**/*.ts`
- `/api/analytics/**/*.ts`
- `/api/webhooks/**/*.ts`
- All other `/api/*` routes (~90 remaining files)

**Example before/after:**

**BEFORE:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

**AFTER:**
```typescript
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Fetching data');
    const data = await fetchData();
    
    logger.request(
      request.method,
      request.nextUrl.pathname,
      200,
      Date.now() - startTime
    );
    
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Failed to fetch data', error);
    return ApiError.internal('Failed to fetch data', error);
  }
}
```

---

## 🎯 SUCCESS METRICS

After completion:
- [ ] Error utilities created and working
- [ ] ~60-70 high-priority routes updated
- [ ] All v1/premium routes use `ApiError` for errors
- [ ] All v1/premium routes use `logger` for logging
- [ ] All errors have error codes and timestamps
- [ ] All errors include request IDs (from Agent 1)
- [ ] Logs are structured JSON
- [ ] Pattern documented for Agent 3 to follow

---

## 🚀 DELIVERABLES

1. ✅ New `/src/lib/api-error.ts` with standardized error system
2. ✅ New `/src/lib/logger.ts` with structured logging
3. ✅ Enhanced `/src/lib/validation.ts` with better validators
4. ✅ Updated ~60-70 high-priority route files:
   - All v1 routes
   - All premium routes
   - News/market/trending routes
5. ✅ Tests for error system
6. ✅ Migration pattern guide for Agent 3
7. ✅ Error codes reference document

---

## 💬 COORDINATION WITH OTHER AGENTS

**Agent 1** provides:
- Request IDs (use in error responses)
- Security utilities (use in validation)

**You provide to others:**
- Pattern guide - Agent 3 follows to update remaining routes
- `ApiError` - All agents use for errors
- `logger` - All agents use for logging
- Validation utilities - All agents use for validation

---

## 🚀 READY TO START?

**Agent 2, begin with Phase 1 (create utilities), then systematically update all routes. Report progress every hour. Good luck! 🎯**
