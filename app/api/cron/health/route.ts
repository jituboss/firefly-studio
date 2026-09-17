import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { fireflyConnections } from '@/server/db/schema';
import { checkConnectionHealth } from '@/server/connections/health';
import { getEnv } from '@/lib/env';
import { safeEqual } from '@/server/auth/session';
import { logger } from '@/lib/logger';

/**
 * E2-24 — drive the health check from real cron, for anyone who wants to.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/health
 *
 * Disabled unless CRON_SECRET is set. An unauthenticated endpoint that probes
 * every stored Firefly instance on demand is an outbound-request amplifier, so
 * it must not exist by default.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const secret = getEnv().CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron endpoint is disabled.' }, { status: 404 });
  }

  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!safeEqual(presented, secret)) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }

  const rows = await db
    .select({ id: fireflyConnections.id, userId: fireflyConnections.userId })
    .from(fireflyConnections);

  let ok = 0;
  let failing = 0;

  for (const row of rows) {
    try {
      const result = await checkConnectionHealth(row.userId, row.id);
      if (result.status === 'ok') ok += 1;
      else failing += 1;
    } catch (error) {
      failing += 1;
      logger.warn({ err: error, connectionId: row.id }, 'Cron health check failed');
    }
  }

  return NextResponse.json({ checked: rows.length, ok, failing });
}
