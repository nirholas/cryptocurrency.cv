/**
 * Security Utilities
 *
 * Provides security features:
 * - Request ID generation
 * - IP address extraction
 * - User agent parsing
 * - Security header management
 * - Input sanitization
 *
 * @module lib/security
 */

import { type NextRequest } from 'next/server';

// =============================================================================
// REQUEST ID GENERATION
// =============================================================================

/**
 * URL-safe alphabet for request ID generation
 */
const URL_SAFE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate cryptographically secure random string
 * Uses Web Crypto API for Edge runtime compatibility
 */
function generateSecureRandom(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += URL_SAFE_ALPHABET[bytes[i] % URL_SAFE_ALPHABET.length];
  }
  return result;
}

/**
 * Generate unique request ID
 * Format: req_{timestamp36}_{random12}
 * Total length: 4 + 8-9 + 1 + 12 = ~25 chars
 *
 * @returns Unique request identifier
 *
 * @example
 * generateRequestId() // "req_m5x8k2j_A1b2C3d4E5f6"
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = generateSecureRandom(12);
  return `req_${timestamp}_${random}`;
}

// =============================================================================
// IP ADDRESS EXTRACTION
// =============================================================================

/**
 * Extract client IP address from request
 * Checks headers in order of preference:
 * 1. x-forwarded-for (standard proxy header)
 * 2. x-real-ip (nginx)
 * 3. cf-connecting-ip (Cloudflare)
 * 4. true-client-ip (Akamai)
 * 5. x-client-ip (various proxies)
 *
 * @param request - Next.js request object
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (most common)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first is the client
    const firstIp = forwardedFor.split(',')[0].trim();
    if (isValidIp(firstIp)) {
      return firstIp;
    }
  }

  // Try x-real-ip (nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // Try cf-connecting-ip (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // Try true-client-ip (Akamai)
  const trueClientIp = request.headers.get('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp.trim())) {
    return trueClientIp.trim();
  }

  // Try x-client-ip
  const xClientIp = request.headers.get('x-client-ip');
  if (xClientIp && isValidIp(xClientIp.trim())) {
    return xClientIp.trim();
  }

  return 'unknown';
}

/**
 * Validate if string is a valid IP address (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  // Reject obviously bogus values
  if (!ip || ip.length > 45) return false;

  // IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const octets = ip.split('.');
    return octets.every((octet) => {
      const n = parseInt(octet, 10);
      // Reject leading zeros (octal ambiguity: "010" !== "10")
      return n >= 0 && n <= 255 && octet === n.toString();
    });
  }

  // IPv6 (full, compressed, and mixed notation)
  // RFC 5952 — up to 8 groups of 4 hex digits separated by ':'
  // Allows one '::' for zero-group compression and optional IPv4 suffix
  const ipv6Full = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6Compressed = /^(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?::((([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?)$/;
  const ipv6Mixed = /^(([0-9a-fA-F]{1,4}:){5}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:)*)?::([0-9a-fA-F]{1,4}:)*)((\d{1,3}\.){3}\d{1,3})$/;

  if (ipv6Full.test(ip) || ipv6Compressed.test(ip) || ipv6Mixed.test(ip)) {
    // Count total groups to ensure ≤ 8
    const expanded = ip.replace('::', ':PLACEHOLDER:');
    const groups = expanded.split(':').filter(Boolean);
    return groups.length <= 8;
  }

  return false;
}

// =============================================================================
// USER AGENT UTILITIES
// =============================================================================

/**
 * Extract user agent from request
 *
 * @param request - Next.js request object
 * @returns User agent string or 'unknown'
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Known bot patterns for detection
 */
const BOT_PATTERNS = [
  // Search engines
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  // Social media
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  // Generic
  'bot',
  'crawl',
  'spider',
  'scrape',
  // HTTP clients
  'curl',
  'wget',
  'httpie',
  'python-requests',
  'python-urllib',
  'axios',
  'node-fetch',
  'go-http-client',
  'java/',
  'okhttp',
  // Monitoring
  'uptimerobot',
  'pingdom',
  'site24x7',
  'datadog',
  'newrelic',
];

/**
 * Check if request is from a bot based on user agent
 *
 * @param request - Next.js request object
 * @returns true if request appears to be from a bot
 */
export function isBot(request: NextRequest): boolean {
  const userAgent = getUserAgent(request).toLowerCase();
  return BOT_PATTERNS.some((pattern) => userAgent.includes(pattern));
}

/**
 * Get bot type if user agent is a known bot
 *
 * @param request - Next.js request object
 * @returns Bot type or null if not a bot
 */
export function getBotType(request: NextRequest): string | null {
  const userAgent = getUserAgent(request).toLowerCase();

  if (userAgent.includes('googlebot')) return 'googlebot';
  if (userAgent.includes('bingbot')) return 'bingbot';
  if (userAgent.includes('facebookexternalhit')) return 'facebook';
  if (userAgent.includes('twitterbot')) return 'twitter';
  if (userAgent.includes('slackbot')) return 'slack';
  if (userAgent.includes('discordbot')) return 'discord';
  if (userAgent.includes('telegrambot')) return 'telegram';
  if (userAgent.includes('curl')) return 'curl';
  if (userAgent.includes('wget')) return 'wget';
  if (userAgent.includes('python')) return 'python';
  if (userAgent.includes('axios') || userAgent.includes('node')) return 'nodejs';

  if (isBot(request)) return 'unknown-bot';

  return null;
}

// =============================================================================
// ORIGIN VALIDATION
// =============================================================================

/**
 * Validate request origin against allowed list
 *
 * @param request - Next.js request object
 * @param allowedOrigins - List of allowed origins (supports wildcards)
 * @returns true if origin is allowed
 *
 * @example
 * // Allow specific domain
 * validateOrigin(request, ['https://example.com'])
 *
 * // Allow subdomains
 * validateOrigin(request, ['*.example.com'])
 *
 * // Allow all
 * validateOrigin(request, ['*'])
 */
export function validateOrigin(
  request: NextRequest,
  allowedOrigins: string[]
): boolean {
  const origin = request.headers.get('origin');

  // Allow requests without origin (server-to-server, same-origin)
  if (!origin) return true;

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;

    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      try {
        const hostname = new URL(origin).hostname;
        // Strict subdomain match: must be exact domain or a proper subdomain
        // e.g. *.example.com matches sub.example.com and example.com
        // but NOT evil-example.com
        return hostname === domain || hostname.endsWith('.' + domain);
      } catch {
        return false;
      }
    }

    return origin === allowed;
  });
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * Standard security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // Changed from DENY to allow PWA features
  'X-XSS-Protection': '0', // Disabled — CSP is the modern replacement; legacy XSS auditors can cause issues
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
  'Content-Security-Policy': "default-src 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
} as const;

/**
 * Get security headers as a Headers object
 *
 * @returns Headers object with security headers
 */
export function getSecurityHeaders(): Headers {
  const headers = new Headers();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

/**
 * Apply security headers to a response
 *
 * @param response - Response object to modify
 * @returns Modified response with security headers
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * HTML entity map for encoding dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Encode HTML entities to prevent XSS
 *
 * @param input - Raw user input
 * @returns HTML-entity-encoded string
 */
export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize user input to prevent XSS
 * Uses a multi-layered approach:
 * 1. Removes null bytes
 * 2. Strips HTML tags (including malformed ones)
 * 3. Removes dangerous URI protocols
 * 4. Removes inline event handlers
 * 5. Normalises whitespace
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/\0/g, '')                     // Strip null bytes
    .replace(/<\/?[^>]*>/g, '')              // Remove HTML tags (including self-closing)
    .replace(/javascript\s*:/gi, '')         // Remove javascript: protocol (with optional spaces)
    .replace(/data\s*:/gi, '')               // Remove data: protocol
    .replace(/vbscript\s*:/gi, '')           // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '')              // Remove event handlers (onerror=, onclick=, …)
    .replace(/expression\s*\(/gi, '')        // Remove CSS expression()
    .replace(/url\s*\(/gi, '')               // Remove CSS url()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control characters
    .trim();
}

/**
 * Sanitize object values recursively
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email format
 *
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 *
 * @param url - URL string to validate
 * @returns true if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if request is HTTPS
 *
 * @param request - Next.js request object
 * @returns true if request is over HTTPS
 */
export function isSecureRequest(request: NextRequest): boolean {
  // Check protocol
  if (request.nextUrl.protocol === 'https:') return true;

  // Check x-forwarded-proto for proxied requests
  const proto = request.headers.get('x-forwarded-proto');
  return proto === 'https';
}

// =============================================================================
// HASH UTILITIES
// =============================================================================

/**
 * Generate SHA-256 hash of a string
 * Uses Web Crypto API for Edge runtime compatibility
 *
 * @param data - String to hash
 * @returns Hex-encoded hash
 */
export async function sha256(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a fingerprint for a request
 * Useful for identifying unique clients
 *
 * @param request - Next.js request object
 * @returns Request fingerprint hash
 */
export async function getRequestFingerprint(request: NextRequest): Promise<string> {
  const components = [
    getClientIp(request),
    getUserAgent(request),
    request.headers.get('accept-language') || '',
    request.headers.get('accept-encoding') || '',
  ];

  return sha256(components.join('|'));
}

// =============================================================================
// RATE KEY GENERATION
// =============================================================================

/**
 * Generate a rate limit key for a request
 *
 * @param request - Next.js request object
 * @param prefix - Optional key prefix
 * @returns Rate limit key
 */
export function getRateLimitKey(request: NextRequest, prefix = 'free'): string {
  const clientIp = getClientIp(request);
  const pathname = request.nextUrl.pathname;
  return `${prefix}:${clientIp}:${pathname}`;
}

// =============================================================================
// CSRF TOKEN UTILITIES
// =============================================================================

/**
 * Generate a cryptographically secure CSRF token
 * Uses Web Crypto API for Edge runtime compatibility
 *
 * @returns Base64url-encoded CSRF token (32 bytes of entropy)
 */
export function generateCsrfToken(): string {
  return generateSecureRandom(32);
}

/**
 * Validate a CSRF token via double-submit cookie pattern.
 * Compares the token from a request header (`X-CSRF-Token`)
 * against the token stored in a cookie (`__csrf`).
 *
 * @param request - Next.js request object
 * @returns true if tokens match
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('__csrf')?.value;

  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses XOR comparison of char codes to ensure consistent execution time.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// =============================================================================
// PAYLOAD SIZE VALIDATION
// =============================================================================

/**
 * Maximum allowed payload sizes by content type (in bytes)
 */
export const MAX_PAYLOAD_SIZES = {
  json: 1 * 1024 * 1024,    // 1 MB for JSON bodies
  form: 2 * 1024 * 1024,    // 2 MB for form data
  default: 10 * 1024 * 1024, // 10 MB general fallback
} as const;

/**
 * Validate request payload size based on content type
 *
 * @param request - Next.js request object
 * @returns Error message if payload is too large, null if OK
 */
export function validatePayloadSize(request: NextRequest): string | null {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return null;

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return 'Invalid content-length header';

  const contentType = request.headers.get('content-type') ?? '';

  let maxSize: number;
  if (contentType.includes('application/json')) {
    maxSize = MAX_PAYLOAD_SIZES.json;
  } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    maxSize = MAX_PAYLOAD_SIZES.form;
  } else {
    maxSize = MAX_PAYLOAD_SIZES.default;
  }

  if (size > maxSize) {
    return `Payload too large: ${size} bytes exceeds ${maxSize} byte limit`;
  }

  return null;
}