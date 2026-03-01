/**
 * GET /api/dashboard/keys — List API keys for the authenticated user
 * POST /api/dashboard/keys — Create a new API key
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createApiKey, hashApiKey } from '@/lib/api-keys';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      tier: apiKeys.tier,
      active: apiKeys.active,
      rateLimitDay: apiKeys.rateLimitDay,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.userId))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await request.json();
  const name = body.name || 'Default';
  const tier = body.tier || 'pro';

  // Check key limit (max 5 per user)
  const existingKeys = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.userId));

  const activeKeys = existingKeys.length;
  if (activeKeys >= 5) {
    return NextResponse.json(
      { error: 'Maximum 5 API keys per account. Please revoke an existing key.' },
      { status: 400 }
    );
  }

  // Create key via existing API key system (writes to Redis/KV)
  const result = await createApiKey({
    email: session.email,
    name,
    tier: tier as 'pro' | 'enterprise',
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Also persist to Postgres for durability
  const keyHash = await hashApiKey(result.key);

  await db.insert(apiKeys).values({
    id: result.data.id,
    userId: session.userId,
    keyHash,
    keyPrefix: result.key.substring(0, 12),
    name,
    tier,
    permissions: [...result.data.permissions],
    rateLimitDay: result.data.rateLimit,
    active: true,
    expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : null,
  });

  return NextResponse.json({
    success: true,
    key: result.key, // Show ONCE — never returned again
    keyId: result.data.id,
    keyPrefix: result.key.substring(0, 12),
    tier,
    expiresAt: result.data.expiresAt,
    message: 'API key created. Save it now — it will not be shown again.',
  });
}
