import { NextResponse } from 'next/server';
import { checkDatabase } from '@/server/db';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Readiness (E25-03). Checks the dependencies needed to serve traffic.
 * Returns 503 when a hard dependency is down so the load balancer drains this
 * replica instead of sending it requests it cannot fulfil.
 *
 * Redis is a SOFT dependency — the proxy cache and rate limiter fall back to
 * Postgres — so a Redis outage degrades rather than fails readiness.
 */
export async function GET() {
  const checks: Record<
    string,
    { ok: boolean; latencyMs?: number; error?: string; soft?: boolean }
  > = {};

  const database = await checkDatabase();
  checks.database = database;

  let redisConfigured = false;
  try {
    redisConfigured = Boolean(getEnv().REDIS_URL);
  } catch (error) {
    checks.environment = {
      ok: false,
      error: error instanceof Error ? error.message.split('\n')[1]?.trim() : 'invalid',
    };
  }

  checks.cache = redisConfigured
    ? { ok: true, soft: true }
    : { ok: true, soft: true, error: 'REDIS_URL unset — using Postgres fallback' };

  const hardFailures = Object.entries(checks).filter(([, check]) => !check.ok && !check.soft);
  const ready = hardFailures.length === 0;

  if (!ready) {
    logger.warn({ checks }, 'Readiness probe failing');
  }

  return NextResponse.json(
    { status: ready ? 'ready' : 'not_ready', checks },
    { status: ready ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
