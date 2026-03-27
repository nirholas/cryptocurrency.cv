/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Token Utilities — Magic link generation and verification.
 * Uses Web Crypto API for Edge compatibility.
 */

import { getDb } from '@/lib/db';
import { authTokens, users } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

/**
 * Generate cryptographically secure random bytes.
 */
function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Convert bytes to hex string.
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash using Web Crypto API.
 */
export async function hashToken(token: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return toHex(new Uint8Array(hashBuffer));
}

/**
 * Generate a magic link token (64 hex chars = 32 bytes of entropy).
 */
export function generateMagicLinkToken(): string {
  return toHex(getRandomBytes(32));
}

/**
 * Create a magic link URL and store the hashed token in the database.
 */
export async function createMagicLink(
  userId: string,
  ipAddress?: string
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Database not available');

  const rawToken = generateMagicLinkToken();
  const tokenHash = await hashToken(rawToken);

  // Token expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(authTokens).values({
    userId,
    type: 'magic_link',
    tokenHash,
    expiresAt,
    ipAddress: ipAddress || null,
  });

  return `${BASE_URL}/api/auth/verify?token=${rawToken}`;
}

/**
 * Verify a magic link token. Returns the user if valid, null otherwise.
 * Marks the token as used (one-time use).
 */
export async function verifyMagicLinkToken(rawToken: string): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null> {
  const db = getDb();
  if (!db) return null;

  const tokenHash = await hashToken(rawToken);

  // Find valid, unused, non-expired token
  const results = await db
    .select({
      tokenId: authTokens.id,
      userId: authTokens.userId,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(authTokens)
    .innerJoin(users, eq(authTokens.userId, users.id))
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, 'magic_link'),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (results.length === 0) return null;

  const result = results[0];

  // Mark as used
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(eq(authTokens.id, result.tokenId));

  // Mark email as verified
  if (result.userId) {
    await db
      .update(users)
      .set({ emailVerified: true, lastLoginAt: new Date() })
      .where(eq(users.id, result.userId));
  }

  return {
    id: result.userId!,
    email: result.email,
    name: result.name,
    role: result.role,
  };
}
