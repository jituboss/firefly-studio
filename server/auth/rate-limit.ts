import 'server-only';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { rateLimits } from '@/server/db/schema';

/**
 * §4.4 — fixed-window rate limiting in Postgres.
 *
 * Redis is the eventual home (E22-03), but auth endpoints must be protected
 * from day one and Redis is an optional dependency. The window is coarse but
 * the upsert is atomic, which is what matters for a login throttle.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, retryAfterSeconds),
  };
}

/** Login: 5 attempts per 15 minutes, keyed on email+IP so one does not mask the other. */
export const LOGIN_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 } as const;
/** Anything that sends an email: 3 per hour, to avoid becoming a spam relay. */
export const EMAIL_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 } as const;
/** Firefly probes during onboarding: 20 per 15 minutes, to blunt SSRF scanning. */
export const PROBE_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 } as const;

/** Housekeeping: drop windows older than a day. Called opportunistically. */
export async function pruneRateLimits(): Promise<void> {
  await db
    .delete(rateLimits)
    .where(
      and(
        gte(sql`now() - ${rateLimits.windowStart}`, sql`interval '1 day'`),
        eq(sql`true`, sql`true`),
      ),
    );
}
