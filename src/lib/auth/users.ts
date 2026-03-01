/**
 * User Management — Create and look up users in Postgres.
 */

import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  provider: string;
  providerId: string | null;
  emailVerified: boolean | null;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Find a user by email.
 */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Find a user by ID.
 */
export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Create a new user (or return existing if email already taken).
 */
export async function createUser(params: {
  email: string;
  name?: string;
  provider?: string;
  providerId?: string;
}): Promise<UserRecord> {
  const db = getDb();
  if (!db) throw new Error('Database not available');

  const email = params.email.toLowerCase().trim();

  // Check for existing user
  const existing = await getUserByEmail(email);
  if (existing) return existing;

  const results = await db
    .insert(users)
    .values({
      email,
      name: params.name || null,
      provider: params.provider || 'email',
      providerId: params.providerId || null,
      role: 'developer',
      emailVerified: false,
    })
    .returning();

  return results[0];
}

/**
 * Update user's last login timestamp.
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
