import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security middleware for all API routes
 * Adds security headers, validates requests, and enforces size limits
 */

// Size limits
const MAX_URL_LENGTH = 2048;
const MAX_HEADER_SIZE = 8192; // 8KB total headers
const MAX_BODY_SIZE = 102400; // 100KB
const MAX_QUERY_STRING_LENGTH = 1024;

/**
 * Check request size limits
 */
function checkSizeLimits(request: NextRequest): { ok: boolean; error?: string } {
  // Check URL length
  if (request.url.length > MAX_URL_LENGTH) {
    return { ok: false, error: 'URL too long' };
  }

  // Check query string length
  const queryString = request.nextUrl.search;
  if (queryString.length > MAX_QUERY_STRING_LENGTH) {
    return { ok: false, error: 'Query string too long' };
  }

  // Check total header size (approximate)
  let headerSize = 0;
  request.headers.forEach((value, key) => {
    headerSize += key.length + value.length + 4; // +4 for ": " and "\r\n"
  });
  if (headerSize > MAX_HEADER_SIZE) {
    return { ok: false, error: 'Headers too large' };
  }

  // Check Content-Length header for body size
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > MAX_BODY_SIZE) {
      return { ok: false, error: 'Request body too large' };
    }
  }

  return { ok: true };
}

/**
 * Check for suspicious patterns in request
 */
function checkSuspiciousPatterns(request: NextRequest): { ok: boolean; error?: string } {
  const url = request.nextUrl.pathname + request.nextUrl.search;
  
  // Block null bytes
  if (url.includes('\0') || url.includes('%00')) {
    return { ok: false, error: 'Invalid characters in URL' };
  }

  // Block path traversal attempts
  if (url.includes('..') || url.includes('%2e%2e')) {
    return { ok: false, error: 'Path traversal not allowed' };
  }

  // Block SQL injection patterns (basic)
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database)\b)/i;
  if (sqlPatterns.test(decodeURIComponent(url))) {
    return { ok: false, error: 'Suspicious pattern detected' };
  }

  // Block script injection in URL
  if (/<script|javascript:|data:/i.test(url)) {
    return { ok: false, error: 'Script injection not allowed' };
  }

  return { ok: true };
}

export function middleware(request: NextRequest) {
  // Check size limits first
  const sizeCheck = checkSizeLimits(request);
  if (!sizeCheck.ok) {
    return NextResponse.json(
      { error: sizeCheck.error, code: 'REQUEST_TOO_LARGE' },
      { status: 413 }
    );
  }

  // Check for suspicious patterns
  const patternCheck = checkSuspiciousPatterns(request);
  if (!patternCheck.ok) {
    return NextResponse.json(
      { error: patternCheck.error, code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // Get response
  const response = NextResponse.next();

  // Security Headers
  const headers = response.headers;

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // XSS Protection (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (disable unnecessary features)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy (allow API usage from anywhere)
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'"
  );

  // CORS Headers - Allow public API access
  const origin = request.headers.get('origin');
  
  // Allow all origins for API routes (it's a public API)
  if (request.nextUrl.pathname.startsWith('/api')) {
    headers.set('Access-Control-Allow-Origin', origin || '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  // Rate limit check header (actual limiting done in rate-limit.ts)
  headers.set('X-RateLimit-Policy', 'fair-use');

  return response;
}

// Apply to all API routes
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
