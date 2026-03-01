/**
 * POST /api/auth/refresh — Refresh access token using refresh cookie
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { createSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('fcn_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token', code: 'NO_REFRESH_TOKEN' },
      { status: 401 }
    );
  }

  const payload = await verifyJwt(refreshToken);
  if (!payload || payload.type !== 'refresh') {
    return NextResponse.json(
      { error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH' },
      { status: 401 }
    );
  }

  const user = await getUserById(payload.sub);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found', code: 'USER_NOT_FOUND' },
      { status: 401 }
    );
  }

  // Issue new tokens
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  return createSession(user, response);
}
