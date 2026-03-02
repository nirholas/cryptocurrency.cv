#!/usr/bin/env node
/**
 * Run database migration against Neon Postgres.
 * Usage: DATABASE_URL=<your-url> node scripts/run-migration.mjs
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="postgresql://..." node scripts/run-migration.mjs');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Each statement as a separate string for Neon's HTTP driver
const statements = [
  // users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(128),
    avatar_url TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'developer',
    provider VARCHAR(32) NOT NULL DEFAULT 'email',
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_provider ON users (provider)`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)`,

  // api_keys table
  `CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(64) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(128) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Default',
    tier VARCHAR(32) NOT NULL DEFAULT 'pro',
    permissions TEXT[] DEFAULT ARRAY[]::text[],
    rate_limit_day INTEGER NOT NULL DEFAULT 50000,
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys (user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_apikeys_hash ON api_keys (key_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_apikeys_tier ON api_keys (tier)`,
  `CREATE INDEX IF NOT EXISTS idx_apikeys_active ON api_keys (active)`,

  // auth_tokens table
  `CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_authtokens_hash ON auth_tokens (token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_authtokens_user ON auth_tokens (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_authtokens_type ON auth_tokens (type)`,
  `CREATE INDEX IF NOT EXISTS idx_authtokens_expires ON auth_tokens (expires_at)`,
];

console.log('Running migration: 0002_add_users_apikeys_authtokens.sql');
console.log(`${statements.length} statements to execute...\n`);

let success = 0;
for (const stmt of statements) {
  try {
    await sql.query(stmt);
    success++;
    const preview = stmt.split('\n')[0].trim();
    console.log(`  ✓ ${preview.substring(0, 80)}`);
  } catch (err) {
    const preview = stmt.split('\n')[0].trim();
    console.error(`  ✗ FAILED: ${preview.substring(0, 80)}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log(`\nDone: ${success}/${statements.length} statements succeeded.`);

// Verify tables exist
if (success > 0) {
  try {
    const result = await sql.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'api_keys', 'auth_tokens') ORDER BY table_name"
    );
    console.log(`\nVerification: Found ${result.length} auth tables:`);
    for (const row of result) {
      console.log(`  • ${row.table_name}`);
    }
  } catch (err) {
    console.error('  Verification query failed:', err.message);
  }
}
