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
 * Main Middleware — Composable Pipeline
 *
 * Thin orchestrator that composes sub-modules from src/middleware/.
 * Each handler enriches a shared context or short-circuits with a response.
 *
 * @see src/middleware/compose.ts for the composition utility
 * @see src/middleware/types.ts for the shared context interface
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MiddlewareContext } from './src/middleware/types';
import { compose } from './src/middleware/compose';
import { redirects } from './src/middleware/redirects';
import { embed } from './src/middleware/embed';
import { observability } from './src/middleware/observability';
import { speraxosHmac } from './src/middleware/speraxos-hmac';
import { trustedOriginHandler } from './src/middleware/trusted-origins';
import { cors } from './src/middleware/cors';
import { requestValidation } from './src/middleware/request-validation';
import { botDetection } from './src/middleware/bot-detection';
import { intl } from './src/middleware/intl';
import { apiKey } from './src/middleware/api-key';
import { rateLimitHandler } from './src/middleware/rate-limit';
import { x402Gate } from './src/middleware/x402';
import { apiResponse } from './src/middleware/api-response';
import { generateRequestId } from './src/middleware/config';

const pipeline = compose(
  redirects, // /docs redirect, /dashboard/dashboard fix
  embed, // Embed routes (skip intl, allow iframing)
  observability, // Request ID, security headers, client detection
  speraxosHmac, // SperaxOS HMAC-SHA256 signature verification
  trustedOriginHandler, // SperaxOS + browser origin trust check
  cors, // CORS preflight (OPTIONS → 204)
  requestValidation, // Suspicious payload detection
  botDetection, // Bot blocking + repeat-429 escalation
  intl, // Non-API: locale routing + CSP (short-circuit)
  apiKey, // API key tier resolution
  x402Gate, // USDC micropayment gate (before rate limit so 402 is always returned)
  rateLimitHandler, // Rate limiting (register, tier, free, per-route)
  apiResponse, // Final response assembly
);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Discovery endpoints must be freely accessible to x402scan, agentcash,
  // and other automated discovery tools — skip entire middleware pipeline.
  if (pathname === '/.well-known/x402' || pathname === '/openapi.json') {
    return NextResponse.next();
  }

  const ctx: MiddlewareContext = {
    request,
    requestId: generateRequestId(),
    startTime: Date.now(),
    pathname,
    isApiRoute: pathname.startsWith('/api/'),
    isEmbedRoute: pathname.startsWith('/embed/') || pathname === '/embed',
    isSperaxOS: false,
    isTrustedOrigin: false,
    isApiClient: false,
    clientIp: 'unknown',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
  };

  const result = await pipeline(ctx);
  if (result instanceof NextResponse) return result;
  return result.response ?? NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/((?!_next|_vercel|feed\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|xml|json|txt|js|css|woff|woff2|webp|avif)).*)',
  ],
};
