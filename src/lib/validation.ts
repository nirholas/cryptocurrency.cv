/**
 * Input validation and sanitization utilities
 */

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
