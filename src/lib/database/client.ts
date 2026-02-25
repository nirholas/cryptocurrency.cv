/**
 * Database Client — Edge-compatible PostgreSQL connection
 *
 * Uses `@neondatabase/serverless` for Edge Runtime compatibility + connection
 * pooling via Neon's built-in pooler. Falls back gracefully when
 * `DATABASE_URL` is not set.
 *
 * @module database/client
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const DATABASE_POOL_URL = process.env.DATABASE_POOL_URL ?? '';

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

/**
 * Whether the database is configured and available.
 */
export const isDatabaseConfigured = Boolean(DATABASE_URL);

/**
 * Neon SQL query function — used directly for raw queries.
 * Prefer `db` instance for typed queries.
 */
export const sql = DATABASE_URL ? neon(DATABASE_POOL_URL || DATABASE_URL) : null;

/**
 * Drizzle ORM database instance.
 * Returns `null` when DATABASE_URL is not configured.
 */
function createDb() {
  if (!DATABASE_URL) return null;

  const queryFn = neon(DATABASE_POOL_URL || DATABASE_URL);
  return drizzle(queryFn, { schema });
}

export const db = createDb();

export type Database = NonNullable<typeof db>;

// ---------------------------------------------------------------------------
// Helper: Execute with fallback
// ---------------------------------------------------------------------------

/**
 * Execute a database query, returning null if DB is not configured.
 * Useful for dual-write/read patterns.
 *
 * @example
 * const articles = await withDb(db => db.select().from(schema.articles).limit(20));
 * if (!articles) {
 *   // fall back to Redis/file
 * }
 */
export async function withDb<T>(
  fn: (db: Database) => Promise<T>,
): Promise<T | null> {
  if (!db) return null;
  try {
    return await fn(db);
  } catch (error) {
    console.error('[database] Query failed, falling back:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { schema };
