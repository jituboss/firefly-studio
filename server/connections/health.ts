import 'server-only';
import { and, eq, lt, or, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { fireflyConnections, connectionPublicColumns } from '@/server/db/schema';
import { getConnectionToken, recordConnectionCheck } from '@/server/connections';
import { probeInstance } from '@/server/firefly/probe';
import { FireflyRequestError } from '@/server/firefly/client';
import { createNotification } from '@/server/notifications';
import { purgeConnectionNamespace } from '@/server/firefly/cache';
import { logger } from '@/lib/logger';

/**
 * E2-24 — connection health checks.
 *
 * A Firefly PAT can be revoked, the instance can move, or a TLS certificate can
 * lapse, and none of that announces itself: the first symptom is a dashboard
 * that has quietly stopped updating. This re-probes each connection and records
 * the result, so the UI can say what is wrong instead of showing stale data.
 *
 * **No job runner.** The plan called for an hourly background job, but this app
 * ships as a single container with no worker process, and adding BullMQ plus a
 * Redis-backed queue for one periodic probe is a large amount of moving parts
 * for a self-hosted install. Instead the check is opportunistic — the app shell
 * kicks one off when the stored result has gone stale — with an HTTP endpoint
 * (`/api/cron/health`) for anyone who does want to drive it from real cron.
 */

/** How old a recorded result may be before the shell re-checks. */
export const HEALTH_STALE_MS = 60 * 60 * 1000;

export interface HealthResult {
  connectionId: string;
  status: 'ok' | 'unauthorised' | 'unreachable' | 'version_unsupported';
  changed: boolean;
}

export async function checkConnectionHealth(
  userId: string,
  connectionId: string,
): Promise<HealthResult> {
  const [row] = await db
    .select(connectionPublicColumns)
    .from(fireflyConnections)
    .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)))
    .limit(1);

  if (!row) return { connectionId, status: 'unreachable', changed: false };

  const previous = row.status;
  let status: HealthResult['status'] = 'ok';
  let error: string | undefined;

  try {
    const credentials = await getConnectionToken(userId, connectionId);
    if (!credentials) {
      status = 'unauthorised';
      error = 'The stored token could not be decrypted.';
    } else {
      const info = await probeInstance(credentials.baseUrl, credentials.token);
      logger.debug({ connectionId, version: info.version }, 'Connection health probe succeeded');
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    /*
     * A 401 means the token itself is the problem, which needs a different fix
     * (re-authenticate) from an unreachable host (check the URL or the server).
     *
     * Classify on the thrown CODE, not on the message. The message for a 401 is
     * "Firefly III rejected that token." — which contains neither "401" nor
     * "unauthor", so the regex below filed every revoked token as `unreachable`
     * and told the user to go and look at a server that was answering
     * perfectly. Found on a live connection whose PAT had been revoked.
     *
     * The regex stays as the fallback, because the guard in `url-guard.ts`
     * resolves and checks the host BEFORE any HTTP call: a stopped instance
     * throws from there, not from the client, and never carries a code.
     */
    status =
      caught instanceof FireflyRequestError
        ? caught.code === 'unauthorised' || caught.code === 'forbidden'
          ? 'unauthorised'
          : 'unreachable'
        : /401|unauthor/i.test(message)
          ? 'unauthorised'
          : 'unreachable';
    error = message.slice(0, 300);
  }

  await recordConnectionCheck(connectionId, { status, ...(error ? { error } : {}) });

  const changed = previous !== status;

  // Notify only on the TRANSITION into failure. Firing every hour while a
  // connection stays broken would bury the inbox and train people to ignore it.
  if (changed && status !== 'ok') {
    await createNotification(userId, 'connection_failing', {
      connectionId,
      label: row.label,
      status,
      error: error ?? null,
    });
    // Stale cached responses would keep a broken connection looking healthy.
    await purgeConnectionNamespace(connectionId);
  }

  return { connectionId, status, changed };
}

/** Every connection whose recorded result has aged out. */
export async function listStaleConnections(userId: string, staleMs = HEALTH_STALE_MS) {
  const cutoff = new Date(Date.now() - staleMs);
  return db
    .select(connectionPublicColumns)
    .from(fireflyConnections)
    .where(
      and(
        eq(fireflyConnections.userId, userId),
        or(isNull(fireflyConnections.lastCheckedAt), lt(fireflyConnections.lastCheckedAt, cutoff)),
      ),
    );
}

/**
 * Re-check anything stale for this user, without making them wait.
 *
 * Called from the app shell. Deliberately fire-and-forget: a slow or hanging
 * Firefly instance must never add its timeout to someone's page load. The
 * result lands in the database and shows on the next render.
 */
export function refreshStaleConnectionsInBackground(userId: string): void {
  void listStaleConnections(userId)
    .then(async (connections) => {
      for (const connection of connections) {
        await checkConnectionHealth(userId, connection.id).catch((error) =>
          logger.warn({ err: error, connectionId: connection.id }, 'Health check failed'),
        );
      }
    })
    .catch((error) => logger.warn({ err: error }, 'Could not list stale connections'));
}
