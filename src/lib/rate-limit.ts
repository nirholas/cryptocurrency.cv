import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple rate limiter using in-memory store
 * For production, use Redis or similar
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 60,     // 60 requests per minute (1 per second average)
  message: 'Too many requests. Please slow down.',
};

function getClientIP(request: NextRequest): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a hash of user-agent for basic identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua-${hashCode(userAgent)}`;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export function checkRateLimit(request: NextRequest): RateLimitResult {
  const clientIP = getClientIP(request);
  const now = Date.now();
  
  // Periodic cleanup (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(clientIP);
  
  // Create new entry if doesn't exist or has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(clientIP, entry);
  
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.count);
  const allowed = entry.count <= RATE_LIMIT_CONFIG.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    limit: RATE_LIMIT_CONFIG.maxRequests,
  };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: RATE_LIMIT_CONFIG.message,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}

/**
 * Rate limiting middleware wrapper
 * 
 * Usage in route:
 * ```
 * import { withRateLimit } from '@/lib/rate-limit';
 * 
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler code
 * });
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const result = checkRateLimit(request);
    
    if (!result.allowed) {
      return rateLimitResponse(result);
    }
    
    const response = await handler(request);
    return addRateLimitHeaders(response, result);
  };
}
