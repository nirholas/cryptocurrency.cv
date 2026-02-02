/**
 * Input validation and sanitization utilities
 */

import { ValidationError } from './api-error';

// Max lengths for various inputs
export const MAX_LENGTHS = {
  query: 200,
  source: 50,
  topic: 100,
  url: 2000,
  coins: 500,
  webhook: 500,
} as const;

// Allowed characters patterns
const SAFE_TEXT_PATTERN = /^[\w\s\-.,!?@#$%&*()+=:;'"<>[\]{}|\\\/~`^]+$/;
const ALPHANUMERIC_PATTERN = /^[\w\-.,]+$/;
const URL_PATTERN = /^https?:\/\/[\w\-.]+(:\d+)?(\/[\w\-./?%&=]*)?$/;

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate and sanitize a search query
 */
export function sanitizeQuery(query: string | null): string | null {
  if (!query) return null;
  
  const sanitized = sanitizeString(query, MAX_LENGTHS.query);
  
  // Must have at least 1 character after sanitization
  if (sanitized.length < 1) return null;
  
  return sanitized;
}

/**
 * Validate a source parameter
 */
export function validateSource(source: string | null): string | null {
  if (!source) return null;
  
  const sanitized = source.toLowerCase().trim().slice(0, MAX_LENGTHS.source);
  
  // Only allow alphanumeric and basic punctuation
  if (!ALPHANUMERIC_PATTERN.test(sanitized)) return null;
  
  // Known valid sources
  const validSources = [
    'coindesk', 'theblock', 'decrypt', 'cointelegraph',
    'bitcoinmagazine', 'blockworks', 'defiant'
  ];
  
  if (!validSources.includes(sanitized)) return null;
  
  return sanitized;
}

/**
 * Validate a numeric parameter
 */
export function validateNumber(
  value: string | null,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (!value) return defaultValue;
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) return defaultValue;
  if (num < min) return min;
  if (num > max) return max;
  
  return num;
}

/**
 * Validate a URL
 */
export function validateUrl(url: string | null): string | null {
  if (!url) return null;
  
  const trimmed = url.trim().slice(0, MAX_LENGTHS.url);
  
  if (!URL_PATTERN.test(trimmed)) return null;
  
  try {
    const parsed = new URL(trimmed);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate coin symbols for portfolio
 */
export function validateCoins(coins: string | null): string[] {
  if (!coins) return [];
  
  return coins
    .split(',')
    .map(c => c.trim().toLowerCase().slice(0, 50))
    .filter(c => c.length > 0 && c.length <= 50)
    .filter(c => /^[\w\-]+$/.test(c) || c.startsWith('0x'))
    .slice(0, 10); // Max 10 coins
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function validateDate(date: string | null): string | null {
  if (!date) return null;
  
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(date)) return null;
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  
  // Don't allow future dates
  if (parsed > new Date()) return null;
  
  // Don't allow dates too far in the past (2 years)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (parsed < twoYearsAgo) return null;
  
  return date;
}

/**
 * Validate sentiment parameter
 */
export function validateSentiment(sentiment: string | null): 'bullish' | 'bearish' | 'neutral' | null {
  if (!sentiment) return null;
  
  const valid = ['bullish', 'bearish', 'neutral'];
  const lower = sentiment.toLowerCase().trim();
  
  if (!valid.includes(lower)) return null;
  
  return lower as 'bullish' | 'bearish' | 'neutral';
}

/**
 * Create a safe error response (don't leak internal details)
 */
export function safeErrorResponse(error: unknown): { error: string; code: string } {
  // Log the actual error server-side
  console.error('API Error:', error);
  
  // Return generic message to client
  return {
    error: 'An error occurred processing your request',
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Validate request headers for suspicious patterns
 */
export function validateHeaders(headers: Headers): boolean {
  // Check for excessively long headers
  const userAgent = headers.get('user-agent') || '';
  if (userAgent.length > 500) return false;
  
  // Check for suspicious patterns in user agent
  const suspiciousPatterns = [
    /[<>'"]/,  // HTML/SQL injection attempts
    /\x00/,     // Null bytes
    /javascript:/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) return false;
  }
  
  return true;
}

// ============================================
// Request Validation (for API routes)
// ============================================

// Size limits for requests
const MAX_URL_LENGTH = 2048;
const MAX_QUERY_STRING_LENGTH = 1024;
const MAX_BODY_SIZE = 102400; // 100KB

export interface RequestValidationResult {
  ok: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate request size limits
 */
export function validateRequestSize(url: string, search: string, contentLength?: string | null): RequestValidationResult {
  // Check URL length
  if (url.length > MAX_URL_LENGTH) {
    return { ok: false, error: 'URL too long', code: 'URL_TOO_LONG' };
  }

  // Check query string length
  if (search.length > MAX_QUERY_STRING_LENGTH) {
    return { ok: false, error: 'Query string too long', code: 'QUERY_TOO_LONG' };
  }

  // Check Content-Length header for body size
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > MAX_BODY_SIZE) {
      return { ok: false, error: 'Request body too large', code: 'BODY_TOO_LARGE' };
    }
  }

  return { ok: true };
}

/**
 * Check for suspicious patterns in request URL
 */
export function validateRequestPatterns(pathname: string, search: string): RequestValidationResult {
  const url = pathname + search;
  
  // Block null bytes
  if (url.includes('\0') || url.includes('%00')) {
    return { ok: false, error: 'Invalid characters in URL', code: 'INVALID_CHARS' };
  }

  // Block path traversal attempts
  if (url.includes('..') || url.includes('%2e%2e')) {
    return { ok: false, error: 'Path traversal not allowed', code: 'PATH_TRAVERSAL' };
  }

  // Block SQL injection patterns (basic)
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database)\b)/i;
  try {
    if (sqlPatterns.test(decodeURIComponent(url))) {
      return { ok: false, error: 'Suspicious pattern detected', code: 'SQL_INJECTION' };
    }
  } catch {
    // Malformed URL encoding
    return { ok: false, error: 'Invalid URL encoding', code: 'INVALID_ENCODING' };
  }

  // Block script injection in URL
  if (/<script|javascript:|data:/i.test(url)) {
    return { ok: false, error: 'Script injection not allowed', code: 'XSS_ATTEMPT' };
  }

  return { ok: true };
}

/**
 * Full API request validation - use this in API routes that need extra security
 * @example
 * const validation = validateApiRequest(request.url, request.nextUrl);
 * if (!validation.ok) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 });
 * }
 */
export function validateApiRequest(
  url: string, 
  nextUrl: { pathname: string; search: string },
  contentLength?: string | null
): RequestValidationResult {
  const sizeCheck = validateRequestSize(url, nextUrl.search, contentLength);
  if (!sizeCheck.ok) return sizeCheck;

  const patternCheck = validateRequestPatterns(nextUrl.pathname, nextUrl.search);
  if (!patternCheck.ok) return patternCheck;

  return { ok: true };
}

// ============================================
// Enhanced Validation Utilities (Agent 2)
// ============================================

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
 * Validate number in range (enhanced version)
 */
export function validateNumberRange(
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

