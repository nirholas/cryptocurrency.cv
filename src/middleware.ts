/**
 * Global Middleware for Next.js 14
 * 
 * Applies to all routes automatically. Provides:
 * - Security headers (OWASP best practices)
 * - Request size validation
 * - Basic rate limiting for free tier
 * - Request logging
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB max body size
const FREE_TIER_RATE_LIMIT = 10; // requests per minute for unauthenticated users

// Routes that bypass middleware (static assets, etc.)
const BYPASS_PATHS = [
  '/_next/',
  '/favicon.ico',
  '/api/health', // Health checks should be fast
  '/static/',
  '/images/',
  '/fonts/',
];

// Free tier routes that need basic rate limiting
const FREE_TIER_ROUTES = [
  '/api/news',
  '/api/breaking',
  '/api/market/',
  '/api/trending',
  '/api/categories',
];

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * OWASP-recommended security headers
 * @see https://owasp.org/www-project-secure-headers/
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable XSS filter (legacy browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (disable unnecessary features)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Content Security Policy (relaxed for API)
    'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
  };
}

// =============================================================================
// RATE LIMITING (In-memory for free tier only)
// =============================================================================

// Simple in-memory rate limiter for free tier endpoints
// Authenticated requests use distributed Upstash rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to user agent hash
  const ua = request.headers.get('user-agent') || 'unknown';
  return `ua-${hashString(ua)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function checkFreeRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  // Cleanup old entries (10% probability)
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  let entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  const remaining = Math.max(0, FREE_TIER_RATE_LIMIT - entry.count);
  const allowed = entry.count <= FREE_TIER_RATE_LIMIT;
  
  return { allowed, remaining };
}

// =============================================================================
// MIDDLEWARE FUNCTION
// =============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // 1. Validate request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return NextResponse.json(
      {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body too large. Maximum size is 1MB.',
          limit: '1MB',
        },
      },
      {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // 2. Apply basic rate limiting to free tier endpoints
  const isFreeRoute = FREE_TIER_ROUTES.some(route => pathname.startsWith(route));
  
  if (isFreeRoute) {
    // Check if request has authentication (skip rate limit if authenticated)
    const hasApiKey = request.headers.get('x-api-key') || request.headers.get('authorization');
    const hasPayment = request.headers.get('payment-signature');
    
    if (!hasApiKey && !hasPayment) {
      const identifier = getClientIdentifier(request);
      const { allowed, remaining } = checkFreeRateLimit(identifier);
      
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please slow down or use an API key for higher limits.',
              retryAfter: 60,
            },
          },
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': FREE_TIER_RATE_LIMIT.toString(),
              'X-RateLimit-Remaining': '0',
              'Retry-After': '60',
            },
          }
        );
      }
      
      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', FREE_TIER_RATE_LIMIT.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      
      // Apply security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
  }
  
  // 3. Apply security headers to all responses
  const response = NextResponse.next();
  
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// =============================================================================
// MATCHER CONFIGURATION
// =============================================================================

/**
 * Configure which routes the middleware applies to
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
