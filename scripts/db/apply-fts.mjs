#!/usr/bin/env node

/**
 * Apply FTS (full-text search) setup to Neon Postgres.
 *
 * Drizzle push creates search_vector as text — this script:
 *   1. Alters it to tsvector
 *   2. Creates the trigger function
 *   3. Creates the trigger
 *   4. Creates the GIN index
 *
 * Usage:  DATABASE_URL=... node scripts/db/apply-fts.mjs
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = neon(DATABASE_URL);

async function main() {
  // 1. Alter column to tsvector (safe if already tsvector)
  console.log('→ Altering search_vector to tsvector...');
  await sql`ALTER TABLE articles ALTER COLUMN search_vector TYPE tsvector USING search_vector::tsvector`;

  // 2. Create trigger function
  console.log('→ Creating trigger function...');
  await sql`
    CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.source, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tickers, ' '), '')), 'A') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;

  // 3. Create trigger
  console.log('→ Creating trigger...');
  await sql`DROP TRIGGER IF EXISTS trg_articles_search_vector ON articles`;
  await sql`
    CREATE TRIGGER trg_articles_search_vector
      BEFORE INSERT OR UPDATE ON articles
      FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update()
  `;

  // 4. GIN index on tsvector
  console.log('→ Creating GIN index...');
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles USING gin (search_vector)`;

  console.log('✓ FTS setup complete');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
