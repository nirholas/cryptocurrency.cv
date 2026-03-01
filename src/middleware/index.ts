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
 * Middleware Modules — Barrel Export
 *
 * Re-exports all middleware sub-modules for clean imports in the root middleware.ts.
 *
 * @module middleware
 */

export {
  FREE_TIER_PATTERNS,
  EXEMPT_PATTERNS,
  AI_ENDPOINT_PATTERNS,
  MAX_BODY_SIZE,
  PUBLIC_RATE_LIMIT,
  API_CLIENT_RATE_LIMIT,
  TIER_LIMITS,
  FREE_TIER_MAX_RESULTS,
  REPEAT_429_BLOCK_MS,
  matchesPattern,
  generateRequestId,
  getClientIp,
} from './config';

export { isBlockedBot, isApiClient } from './bot-detection';
export { isSperaxOSRequest, isTrustedOrigin } from './trusted-origins';
export { SECURITY_HEADERS, isSuspiciousRequest, buildCspHeader } from './security';
export { checkRateLimit, checkTierRateLimit, record429, isRepeat429Blocked } from './rate-limit';
export { getX402Proxy } from './x402';
