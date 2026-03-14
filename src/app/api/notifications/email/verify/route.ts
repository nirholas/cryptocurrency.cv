/**
 * POST /api/notifications/email/verify — Send email verification
 * GET  /api/notifications/email/verify?token=... — Verify email
 *
 * Sends a verification email to the authenticated user's address.
 * On confirmation, marks emailVerified=true in notification_preferences.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { notificationPreferences, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, emailVerificationEmail } from '@/lib/email';
import { randomBytes, createHash } from 'crypto';

export const runtime = 'nodejs';

// In-memory token store (short-lived verification tokens)
// In production you'd persist these; here we use a simple map with 1h TTL.
const verificationTokens = new Map<string, { userId: string; expiresAt: number }>();
const MAX_MAP_SIZE = 10_000;

function cleanupTokens() {
  const now = Date.now();
  for (const [key, entry] of verificationTokens) {
    if (now > entry.expiresAt) verificationTokens.delete(key);
  }
}

/**
 * POST — Send verification email to the logged-in user.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Check if already verified
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.userId))
    .limit(1);

  if (prefs?.emailVerified) {
    return NextResponse.json({ message: 'Email already verified' });
  }

  // Generate token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  // Cleanup and store
  if (verificationTokens.size >= MAX_MAP_SIZE) cleanupTokens();
  verificationTokens.set(tokenHash, {
    userId: session.userId,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://cryptocurrency.cv';
  const verifyUrl = `${baseUrl}/api/notifications/email/verify?token=${rawToken}`;

  const template = emailVerificationEmail(verifyUrl);
  await sendEmail({
    to: session.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'email-verification' }],
  });

  return NextResponse.json({ success: true, message: 'Verification email sent' });
}

/**
 * GET — Verify the email token from the link.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const entry = verificationTokens.get(tokenHash);

  if (!entry || Date.now() > entry.expiresAt) {
    verificationTokens.delete(tokenHash);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Mark email as verified
  await db
    .update(notificationPreferences)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(notificationPreferences.userId, entry.userId));

  // Also mark on the users table
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, entry.userId));

  verificationTokens.delete(tokenHash);

  // Redirect to notifications page with success
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptocurrency.cv';
  return NextResponse.redirect(`${baseUrl}/notifications?emailVerified=true`);
}
