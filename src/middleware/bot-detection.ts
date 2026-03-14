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
 * Bot Detection Module
 *
 * Identifies and blocks known scrapers/crawlers while allowing
 * legitimate bots (search engines, x402 clients, etc.).
 *
 * @module middleware/bot-detection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { isRepeat429Blocked } from './rate-limit';

// Known bad bot patterns (Googlebot intentionally excluded for SEO)
// Note: aiohttp removed — it's a legitimate Python HTTP client (like httpx/requests).
// Abuse from aiohttp callers is handled by rate limiting instead of blanket blocking.
const BLOCKED_BOTS =
  /bot|crawler|spider|scraper|wget|curl|python-requests|go-http|java\/|alphahunter/i;

const BOT_ALLOWLIST = [
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'facebookexternalhit',
  'x402', // x402 payment clients
  'coinbase', // Coinbase Wallet SDK
  'fcn-telegram', // Our own Telegram bot
  'fcn-discord', // Our own Discord bot
];

// SDK / programmatic client User-Agent patterns
const SDK_UA_PATTERNS =
  /fcn-sdk|free-crypto-news|axios|node-fetch|undici|python-httpx|aiohttp|guzzle|x402-client/i;

/**
 * Returns true if the user-agent should be blocked.
 */
export function isBlockedBot(ua: string): boolean {
  return (
    BLOCKED_BOTS.test(ua) &&
    !BOT_ALLOWLIST.some((allowed) => ua.toLowerCase().includes(allowed.toLowerCase()))
  );
}

/**
 * Detect whether the caller is a programmatic API consumer vs a browser visitor.
 */
export function isApiClient(request: NextRequest): boolean {
  if (request.headers.get('x-api-key')) return true;
  if (request.headers.get('x-batch-request') === '1') return true;
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json') && !accept.includes('text/html')) return true;
  const ua = request.headers.get('user-agent') ?? '';
  if (SDK_UA_PATTERNS.test(ua)) return true;
  return false;
}

// =============================================================================
// COMPOSABLE HANDLER
// =============================================================================

/**
 * Middleware handler: blocks bots and repeat-429 abusers.
 * Page routes get a plain-text 403; API routes get a JSON 403.
 */
export const botDetection: MiddlewareHandler = (ctx) => {
  const ua = ctx.request.headers.get('user-agent') || '';

  if (!ctx.isApiRoute) {
    if (isBlockedBot(ua)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return ctx;
  }

  // API route: check with exceptions for marketplace and Alibaba Gateway
  if (isBlockedBot(ua) && !ctx.pathname.startsWith('/api/marketplace/') && !ctx.isAlibabaGateway) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'BOT_BLOCKED', requestId: ctx.requestId },
      { status: 403, headers: ctx.headers },
    );
  }

  // Repeat-429 escalation — hard-block IPs that ignore rate limits
  const blockedUntil = isRepeat429Blocked(ctx.clientIp);
  if (blockedUntil) {
    const retryEsc = Math.ceil((blockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'REPEAT_RATE_LIMIT_ABUSE',
        message: 'Too many rate-limited requests. You are temporarily blocked.',
        retryAfter: retryEsc,
        requestId: ctx.requestId,
      },
      {
        status: 403,
        headers: { ...ctx.headers, 'Retry-After': retryEsc.toString() },
      },
    );
  }

  return ctx;
};
