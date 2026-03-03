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
  // Hard cap to prevent memory exhaustion under heavy distributed attack
  const MAX_MAP_SIZE = 10_000;
  if (map.size >= MAX_MAP_SIZE) {
    cleanupExpiredEntries();
    if (map.size >= MAX_MAP_SIZE) return false;
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
    status: 'Free key registration is discontinued',
    description:
      'Free API keys are no longer issued. Use x402 micropayment ($0.001/req in USDC on Base) ' +
      'for pay-per-request access, or subscribe to Pro ($29/mo) or Enterprise ($99/mo) for a key.',

    freePreview: {
      endpoint: '/api/sample',
      description: '2 headline snippets + 2 coin prices — no key required',
    },

    tiers: Object.entries(API_KEY_TIERS)
      .filter(([id]) => id !== 'free')
      .map(([id, tier]) => ({
        id,
        name: tier.name,
        requestsPerDay: tier.requestsPerDay === -1 ? 'Unlimited' : tier.requestsPerDay,
        requestsPerMinute: tier.requestsPerMinute,
        features: tier.features,
      })),

    x402: {
      price: '$0.001 per request',
      currency: 'USDC on Base (EIP-155:8453)',
      description: 'No key needed — include x402 payment header on any API request',
      docs: 'https://x402.org',
    },

    notes: [
      'Free API keys are no longer issued',
      'Use /api/sample for a free preview',
      'x402 micropayment: $0.001/req, no signup, pay per request',
      'Pro: $29/mo — 50,000 req/day, all endpoints, AI access',
      'Enterprise: $99/mo — 500,000 req/day, priority routing, SLA',
      'Existing key holders can still list/revoke keys via POST with action=list or action=revoke',
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
    // Free key registration is discontinued
    return NextResponse.json(
      {
        error: 'Free key registration discontinued',
        message:
          'Free API keys are no longer issued. Use x402 micropayment ($0.001/req in USDC on Base) ' +
          'or subscribe to a Pro key ($29/mo) at /api/keys/upgrade.',
        alternatives: {
          sample: '/api/sample — free preview (2 headlines, 2 prices)',
          x402: 'Include x402 payment header on any API request — $0.001/req',
          pro: '/api/keys/upgrade — $29/mo for 50,000 req/day',
          enterprise: '/api/keys/upgrade — $99/mo for 500,000 req/day',
        },
      },
      { status: 410 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
