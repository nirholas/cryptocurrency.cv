/**
 * API Key Handler
 *
 * Resolves API key tier from request headers via Redis lookup.
 * Handles expired, revoked, and discontinued free-tier keys.
 *
 * @module middleware/api-key
 */

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { MiddlewareContext, MiddlewareHandler } from './types';

export const apiKey: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const apiKeyRaw =
    ctx.request.headers.get('x-api-key') ||
    ctx.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null;

  if (!apiKeyRaw || !apiKeyRaw.startsWith('cda_')) return ctx;

  // Determine tier from prefix
  if (apiKeyRaw.startsWith('cda_ent_')) ctx.apiKeyTier = 'enterprise';
  else if (apiKeyRaw.startsWith('cda_pro_')) ctx.apiKeyTier = 'pro';
  else ctx.apiKeyTier = 'free';

  try {
    const msgBuffer = new TextEncoder().encode(apiKeyRaw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      const redis = new Redis({ url, token });
      const keyData = await redis.get<{
        id: string;
        tier: 'free' | 'pro' | 'enterprise';
        active: boolean;
        email: string;
        expiresAt?: string;
      }>(`apikey:${hashHex}`);

      if (keyData && keyData.active) {
        // Check key expiration
        if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
          return NextResponse.json(
            {
              error: 'API key expired',
              code: 'KEY_EXPIRED',
              message: 'Your API key has expired. Please register a new key or contact support.',
              expiredAt: keyData.expiresAt,
              register: '/api/register',
              requestId: ctx.requestId,
            },
            { status: 401, headers: ctx.headers },
          );
        }
        ctx.apiKeyTier = keyData.tier;
        ctx.apiKeyId = keyData.id;
      } else if (keyData && !keyData.active) {
        return NextResponse.json(
          { error: 'API key revoked', code: 'KEY_REVOKED', requestId: ctx.requestId },
          { status: 401, headers: ctx.headers },
        );
      }
      if (!keyData) {
        ctx.apiKeyTier = null;
      }
    }
  } catch {
    ctx.apiKeyTier = 'free';
    ctx.apiKeyId = null;
  }

  // Free tier discontinued — reject existing free keys
  if (ctx.apiKeyTier === 'free' && !ctx.isSperaxOS && !ctx.isTrustedOrigin) {
    return NextResponse.json(
      {
        error: 'Free tier discontinued',
        code: 'FREE_TIER_DISCONTINUED',
        message:
          'Free API keys are no longer supported. Use x402 micropayment ($0.001/req) or upgrade to Pro ($29/mo).',
        upgrade: '/api/keys/upgrade',
        sample: '/api/sample',
        requestId: ctx.requestId,
      },
      { status: 403, headers: ctx.headers },
    );
  }

  return ctx;
};
