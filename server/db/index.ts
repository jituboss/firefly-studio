import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import * as schema from './schema';

/**
 * A single pooled connection per process. Next.js dev-mode hot reload would
 * otherwise leak a pool on every edit until Postgres refuses new connections.
 */
const globalForDb = globalThis as unknown as {
  __fireflyStudioPool?: Pool;
};

function createPool(): Pool {
  const env = getEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === 'production' ? 20 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: 'firefly-studio',
  });

  pool.on('error', (error) => {
    logger.error({ err: error }, 'Unexpected idle Postgres client error');
  });

  return pool;
}

export const pool: Pool = globalForDb.__fireflyStudioPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__fireflyStudioPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema,
  logger: process.env.DRIZZLE_LOG === 'true',
});

export { schema };
export type Database = typeof db;

/** Readiness probe helper (E25-03). */
export async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = performance.now();
  try {
    await pool.query('select 1');
    return { ok: true, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}
