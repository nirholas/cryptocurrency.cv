/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for security headers and CSP utility functions
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { SECURITY_HEADERS, buildCspHeader, isSuspiciousRequest } from '@/middleware/security';

describe('SECURITY_HEADERS', () => {
  it('should include nosniff', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
  });

  it('should include DENY for X-Frame-Options', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('should include HSTS with preload', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=');
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('preload');
  });

  it('should include referrer policy', () => {
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include restrictive permissions policy', () => {
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('microphone=()');
  });

  it('should include source attribution headers', () => {
    expect(SECURITY_HEADERS['X-Source']).toBe('cryptocurrency.cv');
    expect(SECURITY_HEADERS['X-Copyright']).toContain('nirholas');
  });
});

describe('buildCspHeader', () => {
  it('should include the nonce in script-src', () => {
    const nonce = 'dGVzdC1ub25jZQ==';
    const csp = buildCspHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it('should include self in default-src', () => {
    const csp = buildCspHeader('abc123');
    expect(csp).toContain("default-src 'self'");
  });

  it('should include Google Analytics in script-src', () => {
    const csp = buildCspHeader('abc123');
    expect(csp).toContain('https://www.googletagmanager.com');
  });

  it('should include upgrade-insecure-requests', () => {
    const csp = buildCspHeader('abc123');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('should restrict object-src to none', () => {
    const csp = buildCspHeader('abc123');
    expect(csp).toContain("object-src 'none'");
  });

  it('should set frame-ancestors to self', () => {
    const csp = buildCspHeader('abc123');
    expect(csp).toContain("frame-ancestors 'self'");
  });
});

describe('isSuspiciousRequest', () => {
  function makeRequest(url: string): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  }

  it('should detect javascript: protocol in query string', () => {
    const req = makeRequest('/api/test?url=javascript:alert(1)');
    expect(isSuspiciousRequest(req)).toBe('query');
  });

  it('should detect null byte injection in query string', () => {
    // %00 survives URL encoding and is always suspicious
    const req = makeRequest('/api/test?q=1%00DROP');
    expect(isSuspiciousRequest(req)).toBe('query');
  });

  it('should detect URL-encoded path traversal', () => {
    // URL constructor normalises ../; use the %2e-encoded form the function checks
    const req = makeRequest('/api/test/%2e%2e%2f%2e%2e%2fetc/passwd');
    expect(isSuspiciousRequest(req)).toBe('path');
  });

  it('should detect null byte injection', () => {
    const req = makeRequest('/api/test?file=test%00.txt');
    expect(isSuspiciousRequest(req)).toBe('query');
  });

  it('should detect overly long query strings', () => {
    const long = 'a'.repeat(2100);
    const req = makeRequest(`/api/test?q=${long}`);
    expect(isSuspiciousRequest(req)).toBe('query-length');
  });

  it('should pass clean requests', () => {
    const req = makeRequest('/api/news?limit=10&category=bitcoin');
    expect(isSuspiciousRequest(req)).toBeNull();
  });

  it('should detect javascript: protocol in query', () => {
    const req = makeRequest('/api/test?url=javascript:alert(1)');
    expect(isSuspiciousRequest(req)).toBe('query');
  });
});
