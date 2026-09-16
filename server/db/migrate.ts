import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

/**
 * E25-02 — migration runner.
 *
 * This file is bundled to `dist/migrate.cjs` (scripts/build-migrator.ts) so the
 * production image can apply migrations with plain `node`, with no tsx and no
 * path-alias resolution at runtime.
 *
 * It deliberately creates its OWN pool instead of importing `server/db`, and
 * writes to the console instead of `lib/logger`. Importing either would pull
 * Pino's pretty transport into the bundle, and that transport runs in a worker
 * thread whose entry point cannot be bundled — the binary would build fine and
 * then fail at container start.
 *
 * Migrations run under a Postgres advisory lock so that N replicas booting
 * simultaneously do not race each other through the same DDL.
 */
const ADVISORY_LOCK_KEY = 4242_1001;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // max MUST be at least 2: one connection holds the advisory lock for the
  // whole run, and `migrate()` checks out a second one from the same pool. With
  // max: 1 the runner deadlocks against itself and hangs forever.
  const pool = new Pool({ connectionString, max: 2, application_name: 'firefly-studio-migrate' });
  const client = await pool.connect();

  try {
    console.log('[migrate] acquiring advisory lock…');
    await client.query('select pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    // `citext` backs the case-insensitive unique index on users.email;
    // `pgcrypto` provides gen_random_uuid() on older Postgres builds.
    await client.query('create extension if not exists citext');
    await client.query('create extension if not exists pgcrypto');

    console.log('[migrate] running migrations…');
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
    console.log('[migrate] complete.');
  } finally {
    await client.query('select pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {});
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[migrate] failed:', error);
  process.exit(1);
});
