import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeMarkdown,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeSearchQuery,
  sanitizeCoinId,
  sanitizeWalletAddress,
  sanitizeApiKey,
  sanitizeObject,
  sanitizeQueryParams,
  sanitizedString,
  sanitizedUrl,
  sanitizedEmail,
  sanitizedCoinId,
  sanitizedWalletAddress,
} from '@/lib/sanitize';

describe('sanitizeString', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).not.toContain('<script>');
    expect(sanitizeString('<b>bold</b>')).not.toContain('<b>');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  it('should truncate to maxLength', () => {
    const long = 'a'.repeat(200);
    const result = sanitizeString(long, 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeString(null as unknown as string)).toBe('');
    expect(sanitizeString(undefined as unknown as string)).toBe('');
    expect(sanitizeString(123 as unknown as string)).toBe('');
  });

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('should escape special HTML entities', () => {
    const result = sanitizeString('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('should handle event handler injection', () => {
    const result = sanitizeString('<div onmouseover="alert(1)">test</div>');
    expect(result).not.toContain('onmouseover');
  });
});

describe('sanitizeMarkdown', () => {
  it('should allow safe HTML tags', () => {
    const result = sanitizeMarkdown('<strong>bold</strong> and <em>italic</em>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('should strip dangerous tags', () => {
    const result = sanitizeMarkdown('<script>alert(1)</script><p>safe</p>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>safe</p>');
  });

  it('should allow safe anchor tags', () => {
    const result = sanitizeMarkdown('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('should strip dangerous attributes from anchors', () => {
    const result = sanitizeMarkdown('<a href="javascript:alert(1)">xss</a>');
    expect(result).not.toContain('javascript:');
  });

  it('should remove null bytes', () => {
    expect(sanitizeMarkdown('hello\0')).toBe('hello');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeMarkdown(42 as unknown as string)).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('should allow valid https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('should allow valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should block javascript: scheme', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('should block data: scheme', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('should block vbscript: scheme', () => {
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBeNull();
  });

  it('should block ftp: protocol', () => {
    expect(sanitizeUrl('ftp://example.com/file')).toBeNull();
  });

  it('should allow relative paths', () => {
    expect(sanitizeUrl('/api/news')).toBe('/api/news');
  });

  it('should return null for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeUrl(null as unknown as string)).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/');
  });
});

describe('sanitizeEmail', () => {
  it('should accept valid emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
  });

  it('should lowercase emails', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('should reject invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('@missing-local.com')).toBeNull();
    expect(sanitizeEmail('missing@')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeEmail(42 as unknown as string)).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });
});

describe('sanitizeSearchQuery', () => {
  it('should return cleaned query', () => {
    expect(sanitizeSearchQuery('bitcoin price')).toBe('bitcoin price');
  });

  it('should remove SQL injection characters', () => {
    const result = sanitizeSearchQuery("'; DROP TABLE users; --");
    expect(result).not.toContain("'");
    expect(result).not.toContain(';');
    expect(result).not.toContain('"');
  });

  it('should strip script tags', () => {
    const result = sanitizeSearchQuery('<script>alert(1)</script>bitcoin');
    expect(result).not.toContain('<script>');
  });

  it('should remove null bytes and control characters', () => {
    const result = sanitizeSearchQuery('hello\0\x01world');
    expect(result).not.toContain('\0');
  });

  it('should truncate to maxLength', () => {
    const long = 'a'.repeat(1000);
    const result = sanitizeSearchQuery(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeSearchQuery(null as unknown as string)).toBe('');
  });
});

describe('sanitizeCoinId', () => {
  it('should accept valid coin IDs', () => {
    expect(sanitizeCoinId('bitcoin')).toBe('bitcoin');
    expect(sanitizeCoinId('shiba-inu')).toBe('shiba-inu');
  });

  it('should lowercase coin IDs', () => {
    expect(sanitizeCoinId('Bitcoin')).toBe('bitcoin');
  });

  it('should reject coin IDs with invalid characters', () => {
    expect(sanitizeCoinId('bit coin')).toBeNull();
    expect(sanitizeCoinId('btc$')).toBeNull();
    expect(sanitizeCoinId('<script>')).toBeNull();
  });

  it('should reject empty coin IDs', () => {
    expect(sanitizeCoinId('')).toBeNull();
  });

  it('should reject coin IDs over 50 chars', () => {
    expect(sanitizeCoinId('a'.repeat(51))).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeCoinId(123 as unknown as string)).toBeNull();
  });
});

describe('sanitizeWalletAddress', () => {
  it('should accept valid Ethereum addresses', () => {
    const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68';
    expect(sanitizeWalletAddress(addr)).toBe(addr.toLowerCase());
  });

  it('should reject addresses without 0x prefix', () => {
    expect(sanitizeWalletAddress('742d35Cc6634C0532925a3b844Bc9e7595f2bD68')).toBeNull();
  });

  it('should reject addresses with wrong length', () => {
    expect(sanitizeWalletAddress('0x742d35Cc')).toBeNull();
  });

  it('should reject addresses with invalid characters', () => {
    expect(sanitizeWalletAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeWalletAddress(42 as unknown as string)).toBeNull();
  });
});

describe('sanitizeApiKey', () => {
  it('should accept valid API keys', () => {
    expect(sanitizeApiKey('cda_pro_abc123def456ghi789')).toBe('cda_pro_abc123def456ghi789');
  });

  it('should reject keys that are too short', () => {
    expect(sanitizeApiKey('short')).toBeNull();
  });

  it('should reject keys with invalid characters', () => {
    expect(sanitizeApiKey('key with spaces and !@#$')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeApiKey(null as unknown as string)).toBeNull();
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string values in objects', () => {
    const result = sanitizeObject({ name: '<b>bold</b>' });
    expect(result.name).not.toContain('<b>');
  });

  it('should leave non-string values unchanged', () => {
    const result = sanitizeObject({ count: 42, active: true });
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });

  it('should recursively sanitize nested objects', () => {
    const result = sanitizeObject({
      inner: { html: '<script>xss</script>' },
    });
    expect((result.inner as { html: string }).html).not.toContain('<script>');
  });

  it('should sanitize strings in arrays', () => {
    const result = sanitizeObject({ tags: ['<b>tag</b>', 'clean'] });
    expect((result.tags as string[])[0]).not.toContain('<b>');
  });

  it('should use markdown sanitization when allowMarkdown is true', () => {
    const result = sanitizeObject(
      { content: '<strong>bold</strong><script>xss</script>' },
      { allowMarkdown: true },
    );
    expect(result.content).toContain('<strong>');
    expect(result.content).not.toContain('<script>');
  });
});

describe('sanitizeQueryParams', () => {
  it('should sanitize both keys and values', () => {
    const params = new URLSearchParams();
    params.set('q', '<script>alert(1)</script>bitcoin');
    const result = sanitizeQueryParams(params);
    expect(result['q']).not.toContain('<script>');
    expect(result['q']).toContain('bitcoin');
  });

  it('should handle empty params', () => {
    const result = sanitizeQueryParams(new URLSearchParams());
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('Zod sanitized schemas', () => {
  it('sanitizedString should strip HTML', () => {
    const schema = sanitizedString();
    const result = schema.parse('<b>hello</b>');
    expect(result).not.toContain('<b>');
  });

  it('sanitizedUrl should reject invalid URLs', () => {
    expect(() => sanitizedUrl.parse('javascript:alert(1)')).toThrow();
  });

  it('sanitizedUrl should accept valid URLs', () => {
    const result = sanitizedUrl.parse('https://example.com');
    expect(result).toBe('https://example.com/');
  });

  it('sanitizedEmail should reject invalid emails', () => {
    expect(() => sanitizedEmail.parse('not-email')).toThrow();
  });

  it('sanitizedCoinId should accept valid coin IDs', () => {
    expect(sanitizedCoinId.parse('bitcoin')).toBe('bitcoin');
  });

  it('sanitizedWalletAddress should accept valid addresses', () => {
    const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68';
    expect(sanitizedWalletAddress.parse(addr)).toBe(addr.toLowerCase());
  });
});
