/**
 * GET/PUT /api/notifications/preferences
 *
 * Manage per-user notification preferences (email, push, in-app, quiet hours).
 * Requires an authenticated session.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET — Return current user's notification preferences.
 * Creates default row if none exists.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  let [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.userId))
    .limit(1);

  if (!prefs) {
    // Insert default preferences
    const [created] = await db
      .insert(notificationPreferences)
      .values({ userId: session.userId })
      .returning();
    prefs = created;
  }

  return NextResponse.json({ preferences: prefs });
}

const ALLOWED_FREQUENCIES = ['realtime', 'daily', 'weekly'] as const;

/**
 * PUT — Update notification preferences.
 */
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const body = await request.json();

  // Validate fields
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.emailEnabled === 'boolean') update.emailEnabled = body.emailEnabled;
  if (typeof body.pushEnabled === 'boolean') update.pushEnabled = body.pushEnabled;
  if (typeof body.inAppEnabled === 'boolean') update.inAppEnabled = body.inAppEnabled;
  if (typeof body.quietHoursEnabled === 'boolean')
    update.quietHoursEnabled = body.quietHoursEnabled;

  if (typeof body.emailDigestFrequency === 'string') {
    if (!ALLOWED_FREQUENCIES.includes(body.emailDigestFrequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }
    update.emailDigestFrequency = body.emailDigestFrequency;
  }

  if (typeof body.quietHoursStart === 'string' && /^\d{2}:\d{2}$/.test(body.quietHoursStart)) {
    update.quietHoursStart = body.quietHoursStart;
  }
  if (typeof body.quietHoursEnd === 'string' && /^\d{2}:\d{2}$/.test(body.quietHoursEnd)) {
    update.quietHoursEnd = body.quietHoursEnd;
  }

  // Upsert — ensure row exists then update
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.userId))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(notificationPreferences)
      .values({ userId: session.userId, ...update })
      .returning();
    return NextResponse.json({ preferences: created });
  }

  const [updated] = await db
    .update(notificationPreferences)
    .set(update)
    .where(eq(notificationPreferences.userId, session.userId))
    .returning();

  return NextResponse.json({ preferences: updated });
}
