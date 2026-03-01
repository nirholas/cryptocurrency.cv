/**
 * GET /api/auth/verify?token=... — Verify magic link and create session
 *
 * Redirects to /dashboard on success or /login?error=... on failure.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl}/en/login?error=missing_token`
    );
  }

  try {
    const user = await verifyMagicLinkToken(token);

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/en/login?error=invalid_or_expired`
      );
    }

    // Create session (set cookies) and redirect to dashboard
    const response = NextResponse.redirect(`${baseUrl}/en/dashboard`);
    await createSession(user, response);

    return response;
  } catch (error) {
    console.error('[AUTH] Verify error:', error);
    return NextResponse.redirect(
      `${baseUrl}/en/login?error=server_error`
    );
  }
}
