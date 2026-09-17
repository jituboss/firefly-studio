import 'server-only';
import { and, desc, eq, gt, isNull, lt, ne } from 'drizzle-orm';
import { db } from '@/server/db';
import { auditLog, sessions } from '@/server/db/schema';

/**
 * E2-08 / E2-09 — the reads behind Settings → Security.
 *
 * Every query is scoped by `userId`. The session and audit tables are the two
 * places where leaking another account's rows would be a security incident
 * rather than a bug, so the scoping is never left to the caller.
 */

export interface ActiveSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  lastSeenAt: Date;
  createdAt: Date;
  expiresAt: Date;
  /** True for the session making this request — it must not offer "revoke". */
  current: boolean;
}

export async function listActiveSessions(
  userId: string,
  currentSessionId: string,
): Promise<ActiveSession[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        gt(sessions.idleExpiresAt, now),
      ),
    )
    .orderBy(desc(sessions.lastSeenAt));

  return rows.map((row) => ({
    id: row.id,
    ip: row.ip,
    userAgent: row.userAgent,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    current: row.id === currentSessionId,
  }));
}

/**
 * Revoke one session by id. Returns false when nothing matched, which covers
 * both "already revoked" and "belongs to someone else" — the caller cannot
 * tell those apart, and should not be able to.
 */
export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const revoked = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  return revoked.length > 0;
}

/** Sign out everywhere except here. Used by the "revoke others" button. */
export async function revokeOtherSessions(userId: string, keepSessionId: string): Promise<number> {
  const revoked = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId), isNull(sessions.revokedAt)),
    )
    .returning({ id: sessions.id });
  return revoked.length;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export async function listAuditLog(
  userId: string,
  options: { limit?: number; before?: Date; action?: string } = {},
): Promise<AuditEntry[]> {
  const { limit = 50, before, action } = options;

  const filters = [eq(auditLog.userId, userId)];
  if (before) filters.push(lt(auditLog.createdAt, before));
  if (action) filters.push(eq(auditLog.action, action));

  return db
    .select()
    .from(auditLog)
    .where(and(...filters))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(200, limit));
}

/** The distinct actions this user has actually generated, for the filter. */
export async function listAuditActions(userId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ action: auditLog.action })
    .from(auditLog)
    .where(eq(auditLog.userId, userId));
  return rows.map((row) => row.action).sort();
}

// Presentation helpers live in `lib/audit-labels.ts`: the audit filter is a
// Client Component, and this module is `server-only`. Re-exported so server
// callers have one import.
export { AUDIT_LABELS, describeAuditAction, describeDevice } from '@/lib/audit-labels';
