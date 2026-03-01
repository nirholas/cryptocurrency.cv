/**
 * Session Management — Cookie-based JWT sessions.
 *
 * Access token stored in httpOnly cookie (15 min).
 * Refresh token stored in httpOnly cookie (7 days).
 * On access token expiry, the refresh endpoint issues new tokens.
 */

import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyJwt, type JwtPayload } from './jwt';
import { createAccessToken, createRefreshToken } from './jwt';
import { getUserById } from './users';

const ACCESS_COOKIE = 'fcn_access';
const REFRESH_COOKIE = 'fcn_refresh';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export interface Session {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

/**
 * Get current session from cookies (server component / route handler).
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) return null;

  const payload = await verifyJwt(accessToken);
  if (!payload || payload.type !== 'access') return null;

  return {
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

/**
 * Set auth cookies on a response.
 */
export async function createSession(
  user: { id: string; email: string; name?: string | null; role: string },
  response: NextResponse
): Promise<NextResponse> {
  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });

  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}

/**
 * Clear auth cookies (logout).
 */
export async function clearSession(response: NextResponse): Promise<NextResponse> {
  response.cookies.set(ACCESS_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

/**
 * Higher-order function for protected API route handlers.
 * Returns 401 if not authenticated.
 */
export function withAuth<T extends unknown[]>(
  handler: (req: NextRequest, session: Session, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Try access token first
    const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
    let payload = accessToken ? await verifyJwt(accessToken) : null;

    // If access token expired, try refresh token
    if (!payload || payload.type !== 'access') {
      const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const refreshPayload = await verifyJwt(refreshToken);
      if (!refreshPayload || refreshPayload.type !== 'refresh') {
        return NextResponse.json(
          { error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      // Verify user still exists
      const user = await getUserById(refreshPayload.sub);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 401 }
        );
      }

      // Issue new tokens
      const response = await handler(req, {
        userId: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
      }, ...args);

      // Attach refreshed tokens to the response
      return createSession(user, response);
    }

    const session: Session = {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    return handler(req, session, ...args);
  };
}
