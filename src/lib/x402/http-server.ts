/**
 * x402 HTTP Server with Hybrid Authentication
 *
 * Provides x402 HTTP resource server utilities and API key validation helpers.
 * This module implements hybrid authentication that supports both:
 * 1. API key authentication with rate limiting (for subscribed users)
 * 2. x402 micropayment protocol (for pay-per-request access)
 *
 * Uses the official x402 `onProtectedRequest` hook to enable API key holders
 * to bypass payment verification while still supporting x402 micropayments.
 *
 * @see https://github.com/coinbase/x402
 * @see https://docs.x402.org/advanced-concepts/lifecycle-hooks
 */

import { x402HTTPResourceServer, type RoutesConfig } from '@x402/core/server';
import { x402Server } from './server';
import { createRoutesConfig } from './routes';
import { handleProtectedRequest } from './auth';
import { validateApiKey, checkRateLimit, isKvConfigured, type ApiKeyData } from '@/lib/api-keys';
import { API_TIERS } from './pricing';
import { IS_PRODUCTION, IS_BUILD_TIME, PAYMENT_ADDRESS } from './config';

// Track if we've already logged HTTP server status
let _httpServerLogged = false;

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

/**
 * Get routes configuration compatible with x402HTTPResourceServer
 */
function getRoutesConfig(): RoutesConfig {
  return createRoutesConfig();
}

// =============================================================================
// HTTP SERVER CREATION
// =============================================================================

/**
 * Create the x402 HTTP Resource Server with routes and hybrid auth hook
 *
 * Registers the onProtectedRequest hook to enable API key authentication.
 * This allows subscription users to bypass payment verification while
 * still supporting x402 micropayments for pay-per-request access.
 */
function createHttpServer(): x402HTTPResourceServer {
  const routes = getRoutesConfig();
  const server = new x402HTTPResourceServer(x402Server, routes);

  // Register the onProtectedRequest hook for hybrid authentication
  // - API key holders: { grantAccess: true } bypasses payment
  // - Invalid/rate-limited keys: { abort: true, reason } returns 403
  // - No API key: void continues to x402 payment verification
  // Note: Hook registration depends on x402 SDK version
  if ('onProtectedRequest' in server && typeof (server as unknown as { onProtectedRequest: unknown }).onProtectedRequest === 'function') {
    (server as unknown as { onProtectedRequest: (handler: typeof handleProtectedRequest) => void }).onProtectedRequest(handleProtectedRequest);
  }

  return server;
}

// Lazy singleton pattern to avoid initialization during build
let _httpServerInstance: x402HTTPResourceServer | null = null;

/**
 * Get the x402 HTTP Resource Server instance (lazy initialization)
 *
 * This is the main server instance that handles:
 * - Hybrid auth via onProtectedRequest hook (API key bypass)
 * - Route matching for protected endpoints
 * - Payment verification via facilitator
 * - Payment settlement after successful responses
 */
export function getHttpServer(): x402HTTPResourceServer {
  if (!_httpServerInstance) {
    _httpServerInstance = createHttpServer();
  }
  return _httpServerInstance;
}

// For backwards compatibility - lazy getter
export const httpServer = new Proxy({} as x402HTTPResourceServer, {
  get(_, prop) {
    return (getHttpServer() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// =============================================================================
// API KEY VALIDATION HELPERS
// =============================================================================

/**
 * Validate API key and check rate limits
 * Returns the key data if valid and within limits, null otherwise
 */
export async function validateApiKeyForRequest(
  apiKey: string
): Promise<{ valid: true; keyData: ApiKeyData } | { valid: false; error: string; status: number }> {
  // Check for valid API key prefix
  if (!apiKey.startsWith('cda_')) {
    return { valid: false, error: 'Invalid API key format', status: 401 };
  }

  // Check if Vercel KV is configured
  if (!isKvConfigured()) {
    if (!IS_PRODUCTION) {
      console.warn('[x402] Vercel KV not configured, API key validation disabled');
    }
    return { valid: false, error: 'API key storage not configured', status: 503 };
  }

  // Validate API key against Vercel KV
  const keyData = await validateApiKey(apiKey);

  if (!keyData) {
    return { valid: false, error: 'Invalid or inactive API key', status: 401 };
  }

  // Check rate limits for this key
  const rateLimit = await checkRateLimit(keyData);

  if (!rateLimit.allowed) {
    const tierName = API_TIERS[keyData.tier]?.name || keyData.tier;
    const resetTime = new Date(rateLimit.resetAt).toISOString();

    return {
      valid: false,
      error: `Rate limit exceeded for ${tierName} tier. Limit: ${rateLimit.limit}/day. Resets at ${resetTime}. Upgrade at /pricing or use x402 pay-per-request.`,
      status: 429,
    };
  }

  return { valid: true, keyData };
}

/**
 * Extract API key from request headers or URL
 */
export function extractApiKeyFromRequest(request: Request): string | null {
  // Check X-API-Key header
  const headerKey = request.headers.get('X-API-Key');
  if (headerKey) return headerKey;

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token.startsWith('cda_')) return token;
  }

  // Check URL query parameter
  try {
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('api_key');
    if (queryKey) return queryKey;
  } catch {
    // Ignore URL parsing errors
  }

  return null;
}

// =============================================================================
// SERVER ANALYTICS HOOKS
// =============================================================================

/**
 * Register analytics hooks for payment tracking
 * These run after payment verification/settlement for monitoring
 */
x402Server.onAfterVerify(async (ctx) => {
  if (ctx.result.isValid) {
    // Payment verified successfully
    if (!IS_PRODUCTION) {
      console.log('[x402] Payment verified:', {
        network: ctx.requirements.network,
        amount: ctx.requirements.amount,
        asset: ctx.requirements.asset,
        resource: ctx.paymentPayload.resource,
      });
    }
  }
});

x402Server.onAfterSettle(async (ctx) => {
  if (ctx.result.success) {
    // Payment settled successfully
    if (!IS_PRODUCTION) {
      console.log('[x402] Payment settled:', {
        network: ctx.result.network,
        transaction: ctx.result.transaction,
      });
    }
  }
});

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate HTTP server configuration
 */
export function validateHttpServerConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check payment address
  if (!PAYMENT_ADDRESS || PAYMENT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    if (IS_PRODUCTION) {
      errors.push('X402_PAYMENT_ADDRESS not set - all payments will fail');
    } else {
      warnings.push('X402_PAYMENT_ADDRESS not set - using zero address (dev mode)');
    }
  }

  // Check Vercel KV for API keys
  if (!isKvConfigured()) {
    if (IS_PRODUCTION) {
      warnings.push('Vercel KV not configured - API key authentication disabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// STARTUP LOGGING
// =============================================================================

if (typeof window === 'undefined' && !IS_BUILD_TIME && !_httpServerLogged) {
  _httpServerLogged = true;
  const validation = validateHttpServerConfig();

  if (validation.errors.length > 0) {
    console.error('[x402 HTTP Server] ❌ Configuration errors:');
    validation.errors.forEach((e) => console.error(`  - ${e}`));
  }

  if (validation.warnings.length > 0 && !IS_PRODUCTION) {
    console.warn('[x402 HTTP Server] ⚠️  Warnings:');
    validation.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (validation.valid) {
    console.log('[x402 HTTP Server] ✅ Initialized with hybrid auth (API key + x402 payments)');
  }
}
