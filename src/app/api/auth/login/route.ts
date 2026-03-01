/**
 * POST /api/auth/login — Send magic link email
 *
 * Body: { email: string, name?: string }
 * Response: { success: true, message: string }
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth/users';
import { createMagicLink } from '@/lib/auth/tokens';

export const runtime = 'nodejs';

// Rate limit: 5 login requests per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
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
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create user if they don't exist, or get existing
    let user = await getUserByEmail(normalizedEmail);
    if (!user) {
      user = await createUser({ email: normalizedEmail, name });
    }

    // Generate magic link
    const magicLink = await createMagicLink(user.id, ip);

    // In production, send email. For now, log it.
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    if (process.env.NODE_ENV === 'development' || process.env.LOG_MAGIC_LINKS === 'true') {
      console.log(`[AUTH] Magic link for ${normalizedEmail}: ${magicLink}`);
    }

    // If an email service is configured, send email
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Free Crypto News <noreply@cryptocurrency.cv>',
            to: normalizedEmail,
            subject: 'Sign in to Free Crypto News',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 16px;">Sign in to Free Crypto News</h1>
                <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Click the button below to sign in to your developer dashboard. This link expires in 15 minutes.
                </p>
                <a href="${magicLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Sign In
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; line-height: 1.5;">
                  If you didn't request this email, you can safely ignore it.<br/>
                  This link will expire in 15 minutes.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">
                  Free Crypto News — <a href="https://cryptocurrency.cv" style="color: #3b82f6;">cryptocurrency.cv</a>
                </p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('[AUTH] Failed to send magic link email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a sign-in link has been sent.',
      // In dev mode, include the magic link for testing
      ...(process.env.NODE_ENV === 'development' ? { magicLink } : {}),
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
