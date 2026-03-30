import pg from "pg";
const pool = new pg.Pool({
  connectionString:
    "postgresql://neondb_owner:npg_LPQwhR84FOba@ep-flat-sky-ak3b9ahn-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});
const res = await pool.query(
  `UPDATE "user" SET role = 'admin' WHERE email = 'swarsmy@swarmsy.space'`
);
console.log("Rows updated:", res.rowCount);
await pool.end();
