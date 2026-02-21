/**
 * Tests for lib/validation.ts
 * Covers input sanitization and request validation helpers
 */

import { describe, it, expect } from 'vitest';
import {
  MAX_LENGTHS,
  sanitizeString,
  sanitizeQuery,
  validateSource,
  validateNumber,
  validateUrl,
  validateCoins,
  validateDate,
  validateSentiment,
  validateRequestSize,
  validateRequestPatterns,
  validateRequired,
} from '@/lib/validation';

// ---------------------------------------------------------------------------
// MAX_LENGTHS
// ---------------------------------------------------------------------------

describe('MAX_LENGTHS', () => {
  it('query max is 200', () => {
    expect(MAX_LENGTHS.query).toBe(200);
  });

  it('source max is 50', () => {
    expect(MAX_LENGTHS.source).toBe(50);
  });

  it('url max is 2000', () => {
    expect(MAX_LENGTHS.url).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// sanitizeString
// ---------------------------------------------------------------------------

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeString(long).length).toBe(200);
  });

  it('respects custom max length', () => {
    const result = sanitizeString('abcdef', 3);
    expect(result.length).toBe(3);
  });

  it('removes null bytes', () => {
    expect(sanitizeString('hello\0world')).not.toContain('\0');
  });

  it('removes control characters', () => {
    expect(sanitizeString('hello\x01world')).not.toContain('\x01');
  });

  it('escapes HTML entities: &', () => {
    expect(sanitizeString('a & b')).toContain('&amp;');
  });

  it('escapes HTML entities: <', () => {
    expect(sanitizeString('<script>')).toContain('&lt;');
  });

  it('escapes HTML entities: >', () => {
    expect(sanitizeString('<script>')).toContain('&gt;');
  });

  it('escapes double quotes', () => {
    expect(sanitizeString('"hello"')).toContain('&quot;');
  });

  it('escapes single quotes', () => {
    expect(sanitizeString("it's")).toContain('&#x27;');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error — testing runtime edge case
    expect(sanitizeString(42)).toBe('');
    // @ts-expect-error
    expect(sanitizeString(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeQuery
// ---------------------------------------------------------------------------

describe('sanitizeQuery', () => {
  it('returns sanitized query', () => {
    const result = sanitizeQuery('bitcoin price');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns null for empty string', () => {
    expect(sanitizeQuery('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(sanitizeQuery(null)).toBeNull();
  });

  it('returns null when result is empty after sanitization', () => {
    expect(sanitizeQuery('\0\x01\x02')).toBeNull();
  });

  it('truncates to MAX_LENGTHS.query', () => {
    const long = 'a'.repeat(300);
    const result = sanitizeQuery(long);
    expect(result?.length).toBeLessThanOrEqual(MAX_LENGTHS.query);
  });
});

// ---------------------------------------------------------------------------
// validateSource
// ---------------------------------------------------------------------------

describe('validateSource', () => {
  it('returns normalized source for known sources', () => {
    expect(validateSource('coindesk')).toBe('coindesk');
    expect(validateSource('theblock')).toBe('theblock');
    expect(validateSource('decrypt')).toBe('decrypt');
  });

  it('is case-insensitive', () => {
    expect(validateSource('CoinDesk')).toBe('coindesk');
  });

  it('returns null for null input', () => {
    expect(validateSource(null)).toBeNull();
  });

  it('returns null for unknown source', () => {
    expect(validateSource('unknownsource')).toBeNull();
  });

  it('returns null for source with special characters', () => {
    expect(validateSource('coin<script>')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateNumber
// ---------------------------------------------------------------------------

describe('validateNumber', () => {
  it('returns parsed number within range', () => {
    expect(validateNumber('5', 1, 10, 3)).toBe(5);
  });

  it('returns the default for null input', () => {
    expect(validateNumber(null, 1, 100, 20)).toBe(20);
  });

  it('returns the default for non-numeric input', () => {
    expect(validateNumber('abc', 1, 100, 20)).toBe(20);
  });

  it('clamps to min when below range', () => {
    expect(validateNumber('0', 1, 100, 10)).toBe(1);
  });

  it('clamps to max when above range', () => {
    expect(validateNumber('999', 1, 100, 10)).toBe(100);
  });

  it('returns exact value at boundary', () => {
    expect(validateNumber('100', 1, 100, 10)).toBe(100);
    expect(validateNumber('1', 1, 100, 10)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// validateUrl
// ---------------------------------------------------------------------------

describe('validateUrl', () => {
  it('accepts valid http URL', () => {
    const result = validateUrl('http://example.com/path');
    expect(result).toBeTruthy();
  });

  it('accepts valid https URL', () => {
    const result = validateUrl('https://example.com/path?q=1');
    expect(result).toBeTruthy();
  });

  it('returns null for null input', () => {
    expect(validateUrl(null)).toBeNull();
  });

  it('returns null for non-http protocol', () => {
    expect(validateUrl('javascript:alert(1)')).toBeNull();
    expect(validateUrl('ftp://example.com')).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(validateUrl('not a url')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateCoins
// ---------------------------------------------------------------------------

describe('validateCoins', () => {
  it('parses comma-separated coin IDs', () => {
    const result = validateCoins('bitcoin,ethereum,solana');
    expect(result).toEqual(['bitcoin', 'ethereum', 'solana']);
  });

  it('lowercases inputs', () => {
    expect(validateCoins('BTC,ETH')).toEqual(['btc', 'eth']);
  });

  it('returns empty array for null', () => {
    expect(validateCoins(null)).toEqual([]);
  });

  it('limits to 10 coins', () => {
    const many = Array.from({ length: 15 }, (_, i) => `coin${i}`).join(',');
    expect(validateCoins(many).length).toBe(10);
  });

  it('filters out empty segments', () => {
    expect(validateCoins('bitcoin,,ethereum')).toEqual(['bitcoin', 'ethereum']);
  });

  it('accepts 0x addresses', () => {
    const result = validateCoins('0xabc123');
    expect(result).toContain('0xabc123');
  });
});

// ---------------------------------------------------------------------------
// validateDate
// ---------------------------------------------------------------------------

describe('validateDate', () => {
  it('accepts valid past date in YYYY-MM-DD format', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const str = pastDate.toISOString().slice(0, 10);
    expect(validateDate(str)).toBe(str);
  });

  it('returns null for null', () => {
    expect(validateDate(null)).toBeNull();
  });

  it('returns null for future date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(validateDate(future.toISOString().slice(0, 10))).toBeNull();
  });

  it('returns null for wrong format', () => {
    expect(validateDate('2024/01/01')).toBeNull();
    expect(validateDate('01-01-2024')).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(validateDate('2024-13-99')).toBeNull();
  });

  it('returns null for dates too far in the past (>2 years)', () => {
    expect(validateDate('2000-01-01')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateSentiment
// ---------------------------------------------------------------------------

describe('validateSentiment', () => {
  it('accepts "bullish"', () => {
    expect(validateSentiment('bullish')).toBe('bullish');
  });

  it('accepts "bearish"', () => {
    expect(validateSentiment('bearish')).toBe('bearish');
  });

  it('accepts "neutral"', () => {
    expect(validateSentiment('neutral')).toBe('neutral');
  });

  it('is case-insensitive', () => {
    expect(validateSentiment('BULLISH')).toBe('bullish');
    expect(validateSentiment('Bearish')).toBe('bearish');
  });

  it('returns null for null input', () => {
    expect(validateSentiment(null)).toBeNull();
  });

  it('returns null for invalid sentiment', () => {
    expect(validateSentiment('positive')).toBeNull();
    expect(validateSentiment('up')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateRequestSize
// ---------------------------------------------------------------------------

describe('validateRequestSize', () => {
  it('accepts normal request', () => {
    const result = validateRequestSize('https://example.com/api', '?q=bitcoin', null);
    expect(result.ok).toBe(true);
  });

  it('rejects URL exceeding 2048 chars', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    const result = validateRequestSize(longUrl, '', null);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('URL_TOO_LONG');
  });

  it('rejects query string exceeding 1024 chars', () => {
    const longQuery = '?' + 'q=a&'.repeat(300);
    const result = validateRequestSize('https://example.com/', longQuery, null);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('QUERY_TOO_LONG');
  });

  it('rejects body exceeding 100KB', () => {
    const result = validateRequestSize('https://example.com/', '', '200000');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('BODY_TOO_LARGE');
  });
});

// ---------------------------------------------------------------------------
// validateRequestPatterns
// ---------------------------------------------------------------------------

describe('validateRequestPatterns', () => {
  it('accepts a normal API path', () => {
    expect(validateRequestPatterns('/api/news', '?limit=10').ok).toBe(true);
  });

  it('rejects path traversal with ..', () => {
    const result = validateRequestPatterns('/api/../etc/passwd', '');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('PATH_TRAVERSAL');
  });

  it('rejects null bytes in URL', () => {
    const result = validateRequestPatterns('/api/news\0', '');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_CHARS');
  });

  it('rejects XSS attempts in URL', () => {
    const result = validateRequestPatterns('/api', '?q=<script>');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('XSS_ATTEMPT');
  });

  it('rejects javascript: in URL', () => {
    const result = validateRequestPatterns('/api', '?redirect=javascript:alert(1)');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('XSS_ATTEMPT');
  });

  it('rejects SQL injection patterns', () => {
    const result = validateRequestPatterns('/api', '?q=select+from+database');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('SQL_INJECTION');
  });
});

// ---------------------------------------------------------------------------
// validateRequired
// ---------------------------------------------------------------------------

describe('validateRequired', () => {
  it('returns valid for a non-empty string', () => {
    const result = validateRequired('hello', 'name');
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value).toBe('hello');
  });

  it('returns invalid for undefined', () => {
    const result = validateRequired(undefined, 'name');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.field).toBe('name');
      expect(result.error.expected).toBe('non-empty string');
    }
  });

  it('returns invalid for null', () => {
    const result = validateRequired(null, 'name');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for empty string', () => {
    const result = validateRequired('', 'name');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for non-string type', () => {
    const result = validateRequired(42, 'count');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.expected).toBe('string');
    }
  });
});
