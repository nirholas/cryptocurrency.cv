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
 * API Key Registration Endpoint
 *
 * POST /api/register - Create a free API key
 * GET /api/register - Get registration info
 *
 * Public endpoint - no payment required
 * Rate limited per IP to prevent abuse
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  createApiKey,
  getKeysByEmail,
  revokeApiKey,
  validateApiKey,
  API_KEY_TIERS,
  isKvConfigured,
} from '@/lib/api-keys';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_NAME_LENGTH = 64;

// --- IP-based rate limiting for registration ---
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();
const REG_RATE_LIMIT = 3; // max registrations per window
const REG_WINDOW_MS = 3_600_000; // 1 hour

// --- Separate rate limit for authenticated actions (list / revoke) ---
const actionAttempts = new Map<string, { count: number; resetAt: number }>();
const ACTION_RATE_LIMIT = 10; // max list/revoke calls per window per IP
const ACTION_WINDOW_MS = 60_000; // 1 minute

let globalRequestCounter = 0;

// --- Disposable / temporary email domain blocklist ---
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com', 'grr.la',
  'guerrillamailblock.com', 'pokemail.net', 'spam4.me', 'dispostable.com',
  'yopmail.com', 'yopmail.fr', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'mailnesia.com', 'maildrop.cc', 'discard.email', 'fakeinbox.com',
  'getnada.com', 'tempail.com', 'temp-mail.org', 'temp-mail.io',
  'mohmal.com', 'burnermail.io', 'mailcatch.com', 'mintemail.com',
  'mytemp.email', 'harakirimail.com', 'mailsac.com', 'inboxbear.com',
  '10minutemail.com', '10minutemail.net', 'minutemail.com', 'emailondeck.com',
  'crazymailing.com', 'tempinbox.com', 'tempr.email', 'throwaway.email',
  'mailforspam.com', 'safetymail.info', 'filzmail.com', 'spamgourmet.com',
  'trashymail.com', 'receiveee.com', 'tmail.ws', 'tmpmail.net',
  'tmpmail.org', 'bupmail.com', 'mailnator.com', 'spambox.us',
  'jetable.org', 'trash-mail.com', 'getairmail.com', 'mailexpire.com',
  'tempmailer.com', 'throwam.com', 'tempomail.fr', 'ephemail.net',
  'disposableemailaddresses.emailmiser.com', 'mailzilla.com',
  'anonymousemail.me', 'wegwerfmail.de', 'wegwerfmail.net',
  'spamfree24.org', 'rmqkr.net', 'mobi.web.id', 'mozmail.com',
  'emailfake.com', 'emkei.cz', 'deadfake.com', 'fakemailgenerator.com',
  'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
  'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of registrationAttempts) {
    if (now > entry.resetAt) registrationAttempts.delete(key);
  }
  for (const [key, entry] of actionAttempts) {
    if (now > entry.resetAt) actionAttempts.delete(key);
  }
}

function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  // Cleanup expired entries every 100 requests to prevent unbounded growth
  globalRequestCounter++;
  if (globalRequestCounter % 100 === 0) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Email validation — RFC-ish, rejects obviously bad inputs
function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize an email for deduplication:
 *  - lowercase
 *  - strip Gmail-style dots in local part (only for gmail/googlemail)
 *  - strip +tag aliases
 */
function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [localRaw, domain] = lower.split('@');
  if (!localRaw || !domain) return lower;

  // Strip +tag aliases (user+promo@… → user@…)
  const local = localRaw.split('+')[0];

  // Gmail ignores dots in local part
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.replace(/\./g, '')}@gmail.com`;
  }

  return `${local}@${domain}`;
}

function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function getAuthKey(request: NextRequest): string | null {
  return (
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    null
  );
}

/**
 * Verify that a provided API key belongs to the given email.
 * Returns [null, keyData] on success, [NextResponse, null] on failure.
 * Uses generic error messages to prevent information leakage.
 */
async function verifyKeyOwnership(
  request: NextRequest,
  email: string
): Promise<[NextResponse, null] | [null, { id: string; email: string }]> {
  const authKey = getAuthKey(request);

  if (!authKey) {
    return [
      NextResponse.json(
        { error: 'Authentication required. Provide your API key via X-API-Key header.' },
        { status: 401 }
      ),
      null,
    ];
  }

  const keyData = await validateApiKey(authKey);
  if (!keyData || keyData.email !== email) {
    // Generic error — don't reveal whether the key is invalid vs wrong email
    return [
      NextResponse.json(
        { error: 'Authentication failed' },
        { status: 403 }
      ),
      null,
    ];
  }

  return [null, { id: keyData.id, email: keyData.email }];
}

/**
 * GET /api/register - Registration info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/register',
    method: 'POST',
    description: 'Register for a free API key',

    request: {
      contentType: 'application/json',
      body: {
        email: 'string (required) - Your email address',
        name: 'string (optional) - Name for this key',
      },
    },

    response: {
      success: {
        key: 'cda_free_xxxx... (SAVE THIS - shown only once!)',
        tier: 'free',
        rateLimit: '100 requests/day',
        docs: '/docs/api',
      },
    },

    tiers: Object.entries(API_KEY_TIERS).map(([id, tier]) => ({
      id,
      name: tier.name,
      requestsPerDay: tier.requestsPerDay === -1 ? 'Unlimited' : tier.requestsPerDay,
      requestsPerMinute: tier.requestsPerMinute,
      features: tier.features,
    })),

    notes: [
      'Free tier: 1,000 requests/day, 3 results per response, no AI endpoints',
      'Pro tier: 50,000 requests/day, full results, AI access — $29/mo',
      'Enterprise: 500,000 requests/day, priority routing, SLA — $99/mo',
      'Maximum 3 keys per email',
      'Keep your API key secret',
      'Upgrade via /api/keys/upgrade with x402 USDC payment on Base',
      'List and revoke actions require authentication via X-API-Key header',
    ],

    configured: isKvConfigured(),
  });
}

/**
 * POST /api/register - Create a new API key
 */
export async function POST(request: NextRequest) {
  // --- Enforce Content-Type ---
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 }
    );
  }

  const ip = getClientIp(request);

  // IP-based rate limiting (this route is exempt from middleware rate limiting)
  if (!checkRateLimit(registrationAttempts, ip, REG_RATE_LIMIT, REG_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    const body = await request.json();
    const { email, name, action, keyId } = body;

    // --- Handle key revocation (requires key ownership proof) ---
    if (action === 'revoke' && keyId && email) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      // Rate limit authenticated actions separately
      if (!checkRateLimit(actionAttempts, ip, ACTION_RATE_LIMIT, ACTION_WINDOW_MS)) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      const [authError, authedKey] = await verifyKeyOwnership(request, email);
      if (authError) return authError;

      // Prevent self-revocation — don't let the user revoke the key they authenticated with
      if (authedKey.id === keyId) {
        return NextResponse.json(
          { error: 'Cannot revoke the API key used for authentication. Use a different key.' },
          { status: 400 }
        );
      }

      const success = await revokeApiKey(keyId, email);
      if (success) {
        return NextResponse.json({ success: true, message: 'API key revoked' });
      }
      // Generic error — don't reveal whether keyId exists
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 400 }
      );
    }

    // --- Handle key listing (requires key ownership proof) ---
    if (action === 'list' && email) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      // Rate limit authenticated actions separately
      if (!checkRateLimit(actionAttempts, ip, ACTION_RATE_LIMIT, ACTION_WINDOW_MS)) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      const [authError] = await verifyKeyOwnership(request, email);
      if (authError) return authError;

      const keys = await getKeysByEmail(email);
      return NextResponse.json({
        keys: keys.map((k) => ({
          id: k.id,
          keyPrefix: k.keyPrefix,
          name: k.name,
          tier: k.tier,
          rateLimit: k.rateLimit,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
          active: k.active,
        })),
      });
    }

    // --- Create new key ---
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed. Please use a permanent email.' },
        { status: 400 }
      );
    }

    // Enforce name length limit
    const sanitizedName = name ? String(name).slice(0, MAX_NAME_LENGTH) : 'Default';

    // Normalize email for dedup (lowercase, strip dots/aliases)
    const normalizedEmail = normalizeEmail(email);

    const result = await createApiKey({
      email: normalizedEmail,
      name: sanitizedName,
      tier: 'free',
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      key: result.key,
      message: 'API key created successfully. SAVE THIS KEY - it will only be shown once!',

      details: {
        id: result.data.id,
        tier: result.data.tier,
        email: result.data.email,
        rateLimit: `${result.data.rateLimit} requests/day`,
        maxResultsPerResponse: result.data.tier === 'free' ? 3 : 'unlimited',
        permissions: result.data.permissions,
        createdAt: result.data.createdAt,
      },

      limits: {
        requestsPerDay: result.data.rateLimit,
        maxResults: result.data.tier === 'free' ? 3 : null,
        aiAccess: result.data.tier !== 'free',
        webhookSupport: result.data.tier !== 'free',
      },

      usage: {
        header: 'X-API-Key: ' + result.key,
        queryParam: '?api_key=' + result.key,
        example: `curl -H "X-API-Key: ${result.key}" https://your-domain.com/api/v1/coins`,
      },

      endpoints: {
        usage: '/api/keys/usage',
        rotate: '/api/keys/rotate',
        upgrade: '/api/keys/upgrade',
      },

      docs: '/docs/api',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
