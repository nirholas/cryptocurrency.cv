/**
 * Tests for lib/sanitize.ts
 * Covers sanitizeString, sanitizeMarkdown, sanitizeUrl, sanitizeEmail,
 * sanitizeSearchQuery, sanitizeCoinId, sanitizeWalletAddress, sanitizeObject,
 * sanitizeQueryParams, and the Zod schema exports.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeMarkdown,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeSearchQuery,
  sanitizeCoinId,
  sanitizeWalletAddress,
  sanitizeObject,
  sanitizeQueryParams,
  sanitizedString,
  sanitizedEmail,
  sanitizedCoinId,
  sanitizedWalletAddress,
} from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// sanitizeString
// ---------------------------------------------------------------------------

describe('sanitizeString', () => {
  it('returns the input unchanged for safe text', () => {
    expect(sanitizeString('Hello, Bitcoin!')).toBe('Hello, Bitcoin!');
  });

  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>evil')).not.toContain('<script>');
  });

  it('strips angle brackets in XSS payloads', () => {
    const result = sanitizeString('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('removes null bytes', () => {
    expect(sanitizeString('hel\0lo')).not.toContain('\0');
  });

  it('respects maxLength and truncates', () => {
    const long = 'a'.repeat(20);
    expect(sanitizeString(long, 10).length).toBeLessThanOrEqual(10);
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error — testing runtime safety
    expect(sanitizeString(null)).toBe('');
    // @ts-expect-error
    expect(sanitizeString(undefined)).toBe('');
    // @ts-expect-error
    expect(sanitizeString(42)).toBe('');
  });

  it('preserves normal punctuation', () => {
    const text = 'BTC/USD hits $100,000 — a milestone!';
    expect(sanitizeString(text)).toContain('BTC');
  });
});

// ---------------------------------------------------------------------------
// sanitizeMarkdown
// ---------------------------------------------------------------------------

describe('sanitizeMarkdown', () => {
  it('strips dangerous tags like <script>', () => {
    const result = sanitizeMarkdown('<script>alert(1)</script>text');
    expect(result).not.toContain('<script>');
    expect(result).toContain('text');
  });

  it('preserves allowed tags like <strong>, <em>, <a>', () => {
    const input = '<strong>bold</strong> and <em>italic</em>';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('strips javascript: href from anchor tags', () => {
    const result = sanitizeMarkdown('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('allows https href', () => {
    const result = sanitizeMarkdown('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('removes null bytes', () => {
    expect(sanitizeMarkdown('test\0')).not.toContain('\0');
  });

  it('respects maxLength', () => {
    const long = 'x'.repeat(100);
    expect(sanitizeMarkdown(long, 10).length).toBeLessThanOrEqual(10);
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeMarkdown(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl
// ---------------------------------------------------------------------------

describe('sanitizeUrl', () => {
  it('returns null for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeUrl(null)).toBeNull();
  });

  it('blocks javascript: scheme', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('blocks JAVASCRIPT: (case-insensitive)', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBeNull();
  });

  it('blocks data: scheme', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('blocks vbscript: scheme', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
  });

  it('blocks ftp: scheme', () => {
    expect(sanitizeUrl('ftp://example.com/file')).toBeNull();
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://cointelegraph.com/news/bitcoin')).toBe(
      'https://cointelegraph.com/news/bitcoin'
    );
  });

  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('allows relative paths starting with /', () => {
    expect(sanitizeUrl('/api/news?limit=10')).toBe('/api/news?limit=10');
  });

  it('returns null for malformed URLs not starting with /', () => {
    expect(sanitizeUrl('not-a-url')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeEmail
// ---------------------------------------------------------------------------

describe('sanitizeEmail', () => {
  it('returns null for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeEmail(42)).toBeNull();
  });

  it('returns null for invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('missing@')).toBeNull();
    expect(sanitizeEmail('@domain.com')).toBeNull();
  });

  it('returns lowercase email for valid input', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('accepts email with subdomains', () => {
    expect(sanitizeEmail('dev@api.crypto.io')).toBe('dev@api.crypto.io');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  test@test.com  ')).toBe('test@test.com');
  });

  it('returns null for email with spaces', () => {
    expect(sanitizeEmail('foo bar@test.com')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeSearchQuery
// ---------------------------------------------------------------------------

describe('sanitizeSearchQuery', () => {
  it('returns empty string for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeSearchQuery(null)).toBe('');
  });

  it('preserves normal search terms', () => {
    expect(sanitizeSearchQuery('bitcoin price')).toContain('bitcoin');
  });

  it('removes single quotes (SQL injection)', () => {
    expect(sanitizeSearchQuery("' OR 1=1 --")).not.toContain("'");
  });

  it('removes double quotes', () => {
    expect(sanitizeSearchQuery('"drop table users"')).not.toContain('"');
  });

  it('removes semicolons', () => {
    expect(sanitizeSearchQuery('foo; DROP TABLE')).not.toContain(';');
  });

  it('strips control characters', () => {
    expect(sanitizeSearchQuery('test\x01\x02query')).not.toMatch(/[\x00-\x1F]/);
  });

  it('strips script tags', () => {
    const result = sanitizeSearchQuery('<script>evil</script>bitcoin');
    expect(result).not.toContain('<script>');
  });

  it('respects maxLength', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeSearchQuery(long).length).toBeLessThanOrEqual(500);
  });

  it('trims whitespace', () => {
    expect(sanitizeSearchQuery('  ETH  ').trim()).toBe('ETH');
  });
});

// ---------------------------------------------------------------------------
// sanitizeCoinId
// ---------------------------------------------------------------------------

describe('sanitizeCoinId', () => {
  it('returns null for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeCoinId(123)).toBeNull();
  });

  it('allows valid coin IDs', () => {
    expect(sanitizeCoinId('bitcoin')).toBe('bitcoin');
    expect(sanitizeCoinId('usd-coin')).toBe('usd-coin');
    expect(sanitizeCoinId('eth2-0')).toBe('eth2-0');
  });

  it('lowercases the input', () => {
    expect(sanitizeCoinId('Bitcoin')).toBe('bitcoin');
  });

  it('rejects IDs with special characters', () => {
    expect(sanitizeCoinId('bit<coin>')).toBeNull();
    expect(sanitizeCoinId('btc coin')).toBeNull();
    expect(sanitizeCoinId('btc_usdt')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(sanitizeCoinId('')).toBeNull();
  });

  it('rejects IDs longer than 50 chars', () => {
    expect(sanitizeCoinId('a'.repeat(51))).toBeNull();
  });

  it('accepts 50-char ID', () => {
    expect(sanitizeCoinId('a'.repeat(50))).toBe('a'.repeat(50));
  });
});

// ---------------------------------------------------------------------------
// sanitizeWalletAddress
// ---------------------------------------------------------------------------

describe('sanitizeWalletAddress', () => {
  const VALID_ETH = '0xAbCdEf1234567890abcdef1234567890abcdef12';

  it('returns null for non-string input', () => {
    // @ts-expect-error
    expect(sanitizeWalletAddress(null)).toBeNull();
  });

  it('accepts a valid Ethereum address', () => {
    expect(sanitizeWalletAddress(VALID_ETH)).toBe(VALID_ETH.toLowerCase());
  });

  it('lowercases the address', () => {
    expect(sanitizeWalletAddress(VALID_ETH)).toMatch(/^0x[a-f0-9]{40}$/);
  });

  it('rejects address without 0x prefix', () => {
    expect(sanitizeWalletAddress('AbCdEf1234567890abcdef1234567890abcdef12')).toBeNull();
  });

  it('rejects address that is too short', () => {
    expect(sanitizeWalletAddress('0xabc')).toBeNull();
  });

  it('rejects address with non-hex characters', () => {
    expect(sanitizeWalletAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeObject
// ---------------------------------------------------------------------------

describe('sanitizeObject', () => {
  it('sanitizes string values recursively', () => {
    const obj = { title: '<script>alert(1)</script>Title', count: 5 };
    const result = sanitizeObject(obj);
    expect(result.title).not.toContain('<script>');
    expect(result.count).toBe(5);
  });

  it('sanitizes nested objects', () => {
    const obj = { nested: { evil: '<img onerror="x">' } };
    const result = sanitizeObject(obj);
    expect(result.nested.evil).not.toContain('<img');
  });

  it('sanitizes strings inside arrays', () => {
    const obj = { tags: ['<b>Bitcoin</b>', 'ETH'] };
    const result = sanitizeObject(obj);
    expect(result.tags[0]).not.toContain('<b>');
  });

  it('preserves non-string primitives', () => {
    const obj = { num: 42, bool: true, nil: null };
    const result = sanitizeObject(obj);
    expect(result.num).toBe(42);
    expect(result.bool).toBe(true);
    expect(result.nil).toBeNull();
  });

  it('uses markdown sanitization with allowMarkdown: true', () => {
    const obj = { body: '<strong>bold</strong> text' };
    const result = sanitizeObject(obj, { allowMarkdown: true });
    expect(result.body).toContain('<strong>');
  });
});

// ---------------------------------------------------------------------------
// sanitizeQueryParams
// ---------------------------------------------------------------------------

describe('sanitizeQueryParams', () => {
  it('sanitizes param values', () => {
    const params = new URLSearchParams({ q: '<script>evil</script>btc' });
    const result = sanitizeQueryParams(params);
    expect(result.q).not.toContain('<script>');
  });

  it('sanitizes param keys', () => {
    const params = new URLSearchParams({ '<key>': 'value' });
    const result = sanitizeQueryParams(params);
    const keys = Object.keys(result);
    expect(keys.some(k => k.includes('<'))).toBe(false);
  });

  it('handles multiple params', () => {
    const params = new URLSearchParams({ limit: '10', page: '2', q: 'bitcoin' });
    const result = sanitizeQueryParams(params);
    expect(result.limit).toBe('10');
    expect(result.page).toBe('2');
    expect(result.q).toBe('bitcoin');
  });
});

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

describe('Zod sanitization schemas', () => {
  it('sanitizedString transforms to sanitized value', () => {
    const schema = sanitizedString(100);
    expect(schema.parse('<b>text</b>')).not.toContain('<b>');
  });

  it('sanitizedEmail rejects invalid email', () => {
    expect(() => sanitizedEmail.parse('not-email')).toThrow();
  });

  it('sanitizedEmail accepts valid email', () => {
    expect(sanitizedEmail.parse('user@example.com')).toBe('user@example.com');
  });

  it('sanitizedCoinId rejects invalid coin ID', () => {
    expect(() => sanitizedCoinId.parse('bit coin!')).toThrow();
  });

  it('sanitizedCoinId accepts valid coin ID', () => {
    expect(sanitizedCoinId.parse('Bitcoin')).toBe('bitcoin');
  });

  it('sanitizedWalletAddress rejects invalid address', () => {
    expect(() => sanitizedWalletAddress.parse('0xshort')).toThrow();
  });

  it('sanitizedWalletAddress accepts valid address', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    expect(sanitizedWalletAddress.parse(addr)).toBe(addr);
  });
});
