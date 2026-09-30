/**
 * Promote a user to admin.
 *
 * Usage: DATABASE_URL=postgresql://... node scripts/set-admin.mjs user@example.com
 *
 * The connection string comes from the environment, never from this file: a
 * credential committed here is public for as long as the history exists.
 */
import pg from "pg";

const email = process.argv[2];
if (!process.env.DATABASE_URL || !email) {
  console.error("Usage: DATABASE_URL=postgresql://... node scripts/set-admin.mjs <email>");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`UPDATE "user" SET role = 'admin' WHERE email = $1`, [email]);
console.log("Rows updated:", res.rowCount);
await pool.end();
