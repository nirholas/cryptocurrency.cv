/**
 * GET /api/auth/me — Get current user session info
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  // Get full user data from DB
  const user = await getUserById(session.userId);

  return NextResponse.json({
    authenticated: true,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        }
      : {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
        },
  });
}
