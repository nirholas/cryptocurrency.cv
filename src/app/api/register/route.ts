/**
 * API Key Registration Endpoint
 *
 * POST /api/register - Create a free API key
 * GET /api/register - Get registration info
 *
 * Public endpoint - no payment required
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createApiKey,
  getKeysByEmail,
  revokeApiKey,
  API_KEY_TIERS,
  isKvConfigured,
} from '@/lib/api-keys';

export const runtime = 'nodejs';

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
      features: tier.features,
    })),

    notes: [
      'Free tier: 100 requests/day',
      'Maximum 3 keys per email',
      'Keep your API key secret',
      'Upgrade to Pro for 10,000 requests/day',
    ],

    configured: isKvConfigured(),
  });
}

/**
 * POST /api/register - Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, action, keyId } = body;

    // Handle key revocation
    if (action === 'revoke' && keyId && email) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      const success = await revokeApiKey(keyId, email);
      if (success) {
        return NextResponse.json({ success: true, message: 'API key revoked' });
      }
      return NextResponse.json(
        { error: 'Failed to revoke key. Check keyId and email.' },
        { status: 400 }
      );
    }

    // Handle key listing
    if (action === 'list' && email) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

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

    // Create new key
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const result = await createApiKey({
      email,
      name: name || 'Default',
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
        rateLimit: `${result.data.rateLimit} requests/day`,
        permissions: result.data.permissions,
      },

      usage: {
        header: 'X-API-Key: ' + result.key,
        queryParam: '?api_key=' + result.key,
        example: `curl -H "X-API-Key: ${result.key}" https://your-domain.com/api/v1/coins`,
      },

      docs: '/docs/api',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
