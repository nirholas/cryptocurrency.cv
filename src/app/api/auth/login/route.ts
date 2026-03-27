/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * POST /api/auth/login — Send magic link email
 *
 * Body: { email: string, name?: string }
 * Response: { success: true, message: string }
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth/users';
import { createMagicLink } from '@/lib/auth/tokens';
import { sendEmail, magicLinkEmail } from '@/lib/email';

export const runtime = 'nodejs';

// Rate limit: 5 login requests per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_MAP_SIZE = 10_000;
let loginRequestCounter = 0;

function cleanupExpiredLoginEntries() {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(key);
  }
}

function checkRateLimit(ip: string): boolean {
  // Periodic cleanup to prevent unbounded map growth
  loginRequestCounter++;
  if (loginRequestCounter % 100 === 0) {
    cleanupExpiredLoginEntries();
  }
  // Hard cap to prevent memory exhaustion under heavy attack
  if (loginAttempts.size >= MAX_MAP_SIZE) {
    cleanupExpiredLoginEntries();
    if (loginAttempts.size >= MAX_MAP_SIZE) return false;
  }

  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Create user if they don't exist, or get existing
    let user = await getUserByEmail(normalizedEmail);
    if (!user) {
      user = await createUser({ email: normalizedEmail, name });
    }

    // Generate magic link
    const magicLink = await createMagicLink(user.id, ip);

    // Never log the actual magic link token — it's equivalent to a password.
    // In development, log only that a link was generated (not the token itself).
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] Magic link generated for ${normalizedEmail} (token redacted)`);
    }

    // Send magic link email (Resend in prod, console fallback in dev)
    try {
      const template = magicLinkEmail(magicLink);
      await sendEmail({
        to: normalizedEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [{ name: 'type', value: 'magic-link' }],
      });
    } catch (emailError) {
      console.error('[AUTH] Failed to send magic link email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a sign-in link has been sent.',
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
