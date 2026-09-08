/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Bot Detection Module
 *
 * Blocks known attack tooling and repeat rate-limit abusers while letting
 * every legitimate programmatic caller through: cURL, wget, SDK clients,
 * search engines, and AI agents.
 *
 * This site's whole pitch is "curl https://cryptocurrency.cv/api/news" with
 * no key, and ai.txt / robots.txt explicitly invite AI crawlers (GPTBot,
 * ClaudeBot, PerplexityBot...). A generic /bot|curl|wget/ blocklist used to
 * 403 all of them on the front door, so abuse control lives in the rate
 * limiter (see rate-limit.ts) and this module only rejects tooling that has
 * no legitimate reason to hit a news API.
 *
 * @module middleware/bot-detection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { isRepeat429Blocked } from './rate-limit';

/**
 * Vulnerability scanners, exploit kits, and named scrapers. Nothing on this
 * list is ever a legitimate reader or API consumer.
 */
const BLOCKED_BOTS =
  /sqlmap|nikto|nmap|masscan|zgrab|nuclei|wpscan|acunetix|nessus|openvas|jorgee|python-urllib\/1|libwww-perl|alphahunter|scrapy|scraper|httrack|webzip|teleport ?pro|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|megaindex|blexbot|serpstatbot|dataforseo/i;

/**
 * Explicitly welcome user agents. Checked before BLOCKED_BOTS so a future
 * blocklist entry can never lock out a search engine or an AI agent.
 */
const BOT_ALLOWLIST = [
  // Search engines
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Applebot',
  'YandexBot',
  'Baiduspider',
  // Social previews
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  // AI agents and assistants (see public/ai.txt)
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'cohere-ai',
  'Bytespider',
  'Amazonbot',
  'Applebot-Extended',
  'CCBot',
  'Diffbot',
  'YouBot',
  'DuckAssistBot',
  'MistralAI-User',
  'meta-externalagent',
  // Payment and platform clients
  'x402', // x402 payment clients
  'coinbase', // Coinbase Wallet SDK
  'fcn-telegram', // Our own Telegram bot
  'fcn-discord', // Our own Discord bot
];

/**
 * Programmatic client User-Agent patterns. These callers get the API-client
 * rate-limit tier instead of the browser tier.
 */
const SDK_UA_PATTERNS =
  /fcn-sdk|free-crypto-news|cryptocurrency\.cv|axios|node-fetch|undici|python-httpx|python-requests|aiohttp|go-http|guzzle|okhttp|java\/|libcurl|curl\/|wget\/|httpie|insomnia|postman|x402-client|langchain|llamaindex|openai|anthropic|mcp/i;

/**
 * Returns true if the user-agent should be blocked.
 */
export function isBlockedBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  if (BOT_ALLOWLIST.some((allowed) => lower.includes(allowed.toLowerCase()))) {
    return false;
  }
  return BLOCKED_BOTS.test(ua);
}

/**
 * Returns true for user agents that identify as an AI agent, assistant, or
 * LLM tool. Used for observability only; these callers are always allowed.
 */
export function isAiAgent(ua: string): boolean {
  return /gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|google-extended|cohere|mistral|llamaindex|langchain|openai|mcp|agent/i.test(
    ua,
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
 * Middleware handler: blocks attack tooling and repeat-429 abusers.
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

  // API route: block known attack tooling
  if (isBlockedBot(ua)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'BOT_BLOCKED', requestId: ctx.requestId },
      { status: 403, headers: ctx.headers },
    );
  }

  // Repeat-429 escalation — hard-block IPs that ignore rate limits.
  //
  // First-party traffic is exempt. The block is keyed on client IP, and IPs are
  // shared: corporate NAT, mobile CGNAT, VPN exits and CDN edges collapse many
  // readers onto one address. Because this check runs ahead of the
  // trusted-origin exemption in rateLimitHandler, a single scraper on such an
  // address took the whole API down for every real reader behind it for an
  // hour, including the site's own pages. `isSperaxOS` (verified HMAC) and
  // `isTrustedOrigin` (same-origin browser fetch or allow-listed Origin, both
  // set by trustedOriginHandler earlier in the pipeline) identify requests that
  // came from our own pages; those are metered by the trusted tier instead.
  if (ctx.isSperaxOS || ctx.isTrustedOrigin) return ctx;

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
