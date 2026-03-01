/**
 * DELETE /api/dashboard/keys/[keyId] — Revoke an API key
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revokeApiKey } from '@/lib/api-keys';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ keyId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { keyId } = await params;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  // Verify ownership
  const keyRecords = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.userId)))
    .limit(1);

  if (keyRecords.length === 0) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  // Revoke in Redis/KV
  try {
    await revokeApiKey(keyId, session.email);
  } catch {
    // May fail if KV not configured — still revoke in Postgres
  }

  // Revoke in Postgres
  await db
    .update(apiKeys)
    .set({ active: false, revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));

  return NextResponse.json({ success: true, message: 'Key revoked' });
}
