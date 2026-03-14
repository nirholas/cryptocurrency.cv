/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Admin Authentication Utilities
 *
 * Centralized admin authentication for all admin API endpoints.
 * Enforces proper security practices:
 * - No hardcoded fallback tokens in production
 * - Consistent authorization checks
 * - Secure token comparison
 *
 * @module lib/admin-auth
 */

import { type NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if we're in production environment
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get admin token from environment
 * In development, allows a fallback for convenience
 * In production, requires explicit configuration
 */
function getAdminToken(): string | null {
  const token = process.env.ADMIN_API_KEY || process.env.ADMIN_TOKEN;

  if (token) {
    return token;
  }

  // No fallback tokens — require explicit configuration in all environments
  if (!isProduction) {
    console.warn(
      '[Admin Auth] No ADMIN_API_KEY or ADMIN_TOKEN configured. Admin endpoints are disabled.',
    );
  }

  return null;
}

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks.
 * Does NOT short-circuit on length mismatch — an attacker cannot
 * learn the token length from response timing.
 */
function secureCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  // Always compare against the longer buffer length to avoid
  // leaking length information through timing.
  const maxLen = Math.max(bufA.byteLength, bufB.byteLength);
  if (maxLen === 0) return false;
  let result = bufA.byteLength ^ bufB.byteLength; // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) {
    result |= (bufA[i % bufA.byteLength] ?? 0) ^ (bufB[i % bufB.byteLength] ?? 0);
  }
  return result === 0;
}

/**
 * Extract admin token from request headers
 * Supports: Authorization: Bearer <token> and X-Admin-Key: <token>
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-Admin-Key header
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey) {
    return adminKey;
  }

  return null;
}

/**
 * Check if a request is authorized for admin access
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const adminToken = getAdminToken();

  if (!adminToken) {
    // No admin token configured - deny all access
    return false;
  }

  const requestToken = extractToken(request);

  if (!requestToken) {
    return false;
  }

  return secureCompare(requestToken, adminToken);
}

/**
 * Alias for isAdminAuthorized for backward compatibility
 */
export const verifyAdminAuth = isAdminAuthorized;

/**
 * Check if admin authentication is properly configured
 */
export function isAdminConfigured(): boolean {
  return getAdminToken() !== null;
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Admin authentication middleware
 * Returns an error response if unauthorized, null if authorized
 */
export function requireAdminAuth(request: NextRequest): NextResponse | null {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error: 'Service Unavailable',
        message: isProduction
          ? 'Admin functionality is not configured'
          : 'Set ADMIN_API_KEY or ADMIN_TOKEN environment variable',
      },
      { status: 503 },
    );
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing admin credentials',
      },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Create a standardized admin error response
 */
export function adminErrorResponse(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : String(error);

  // Log error server-side
  console.error(`[Admin ${context}]`, error);

  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: isProduction ? 'An error occurred' : message,
    },
    { status: 500 },
  );
}
