/**
 * JWT Utilities — Edge-compatible using `jose`
 *
 * Access tokens: 15 minutes
 * Refresh tokens: 7 days
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fcn-dev-secret-change-in-production-32chars!'
);

const ISSUER = 'cryptocurrency.cv';
const AUDIENCE = 'cryptocurrency.cv';

export interface JwtPayload extends JWTPayload {
  sub: string; // user ID
  email: string;
  name?: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Sign a JWT token.
 */
export async function signJwt(
  payload: Omit<JwtPayload, 'iss' | 'aud' | 'iat' | 'exp'>,
  expiresIn: string = '15m'
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Create an access token (15 min).
 */
export function createAccessToken(user: {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}): Promise<string> {
  return signJwt({
    sub: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    type: 'access',
  }, '15m');
}

/**
 * Create a refresh token (7 days).
 */
export function createRefreshToken(user: {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}): Promise<string> {
  return signJwt({
    sub: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    type: 'refresh',
  }, '7d');
}
