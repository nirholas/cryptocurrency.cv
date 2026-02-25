/**
 * API Response Utilities
 * 
 * Helpers for efficient API responses including:
 * - ETag generation and validation
 * - Response compression hints
 * - Standardized cache headers
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate ETag from response data
 */
export function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Check if request has matching ETag (304 Not Modified)
 */
export function checkETagMatch(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}

/**
 * Standard cache control values
 */
export const CACHE_CONTROL = {
  // Real-time data (news, prices) - short cache
  realtime: 'public, s-maxage=60, stale-while-revalidate=120',
  // Standard API responses - medium cache
  standard: 'public, s-maxage=300, stale-while-revalidate=600',
  // AI-generated content - longer cache
  ai: 'public, s-maxage=600, stale-while-revalidate=1200',
  // Static content - long cache
  static: 'public, s-maxage=3600, stale-while-revalidate=7200',
  // Immutable content
  immutable: 'public, max-age=31536000, immutable',
  // No cache
  none: 'no-store, no-cache, must-revalidate',
} as const;

/**
 * Create JSON response with standard headers
 */
export function jsonResponse<T>(
  data: T,
  options: {
    status?: number;
    cacheControl?: keyof typeof CACHE_CONTROL | string;
    etag?: boolean;
    request?: NextRequest;
    /** ISO timestamp or Date — sets Last-Modified and enables If-Modified-Since 304s */
    lastModified?: string | Date;
    /** If true, response came from stale cache (adds X-Stale: 1 header) */
    stale?: boolean;
  } = {}
): NextResponse {
  const { status = 200, cacheControl = 'standard', etag = true, request, lastModified, stale } = options;
  
  // Generate ETag if enabled
  const etagValue = etag ? generateETag(data) : null;

  const cacheControlValue = typeof cacheControl === 'string' && cacheControl in CACHE_CONTROL
    ? CACHE_CONTROL[cacheControl as keyof typeof CACHE_CONTROL]
    : cacheControl;
  
  // Check for 304 Not Modified (ETag)
  if (request && etagValue && checkETagMatch(request, etagValue)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etagValue,
        'Cache-Control': cacheControlValue,
      },
    });
  }

  // Check for 304 Not Modified (If-Modified-Since)
  if (request && lastModified) {
    const ifModifiedSince = request.headers.get('if-modified-since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince).getTime();
      const serverDate = lastModified instanceof Date ? lastModified.getTime() : new Date(lastModified).getTime();
      if (!isNaN(clientDate) && !isNaN(serverDate) && serverDate <= clientDate) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': cacheControlValue,
            'Last-Modified': new Date(serverDate).toUTCString(),
          },
        });
      }
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': cacheControlValue,
    'Vary': 'Accept-Encoding, Accept',
  };
  
  if (etagValue) {
    headers['ETag'] = etagValue;
  }

  if (lastModified) {
    headers['Last-Modified'] = lastModified instanceof Date
      ? lastModified.toUTCString()
      : new Date(lastModified).toUTCString();
  }

  if (stale) {
    headers['X-Stale'] = '1';
  }
  
  return NextResponse.json(data, { status, headers });
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  details?: string,
  status = 500
): NextResponse {
  return NextResponse.json(
    { 
      error, 
      details,
      timestamp: new Date().toISOString(),
    },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': CACHE_CONTROL.none,
      },
    }
  );
}

/**
 * Wrap handler with timing metadata
 */
export function withTiming<T extends Record<string, unknown>>(
  data: T,
  startTime: number
): T & { _meta: { responseTimeMs: number } } {
  return {
    ...data,
    _meta: {
      responseTimeMs: Date.now() - startTime,
    },
  };
}
