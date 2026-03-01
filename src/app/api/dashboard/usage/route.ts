/**
 * GET /api/dashboard/usage — Get usage stats for the authenticated user
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUsageStats } from '@/lib/api-keys';

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

  // Get all user's keys
  const keys = await db
    .select({ id: apiKeys.id, name: apiKeys.name, tier: apiKeys.tier, active: apiKeys.active })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.userId));

  // Get usage stats for each active key
  const usageByKey = await Promise.all(
    keys
      .filter((k) => k.active)
      .map(async (key) => {
        const stats = await getUsageStats(key.id);
        return {
          keyId: key.id,
          keyName: key.name,
          tier: key.tier,
          ...stats,
        };
      })
  );

  // Aggregate totals
  const totals = usageByKey.reduce(
    (acc, key) => ({
      today: acc.today + (key.today || 0),
      month: acc.month + (key.month || 0),
      allTime: acc.allTime + (key.allTime || 0),
    }),
    { today: 0, month: 0, allTime: 0 }
  );

  return NextResponse.json({
    totals,
    keys: usageByKey,
    activeKeys: keys.filter((k) => k.active).length,
    totalKeys: keys.length,
  });
}
