import 'server-only';
import { and, count, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  auditLog,
  fireflyConnections,
  managedFireflyUsers,
  sessions,
  users,
  type UserRole,
  type UserStatus,
} from '@/server/db/schema';
import { getEnv } from '@/lib/env';
import { appRevision, appVersion } from '@/server/version';

/**
 * Reads for the admin page.
 *
 * Every export here answers a question about the DEPLOYMENT rather than about
 * the caller, which is exactly why each one is behind `requireAdmin()` at its
 * call site. Nothing in this module checks that itself — a query that looked
 * like it guarded itself would invite a call site that forgot to.
 *
 * INVARIANT, restated because this is the module most likely to break it: this
 * database holds identity and connection credentials, never financial records.
 * Nothing here can show an administrator another user's transactions, and it
 * must stay that way — the admin of this app is not an admin of anybody's
 * Firefly instance.
 */

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  isDemo: boolean;
  emailVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Firefly instances this user has attached. */
  connections: number;
  /** Sessions that are neither revoked nor expired. */
  activeSessions: number;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const now = new Date();

  /*
   * Correlated subqueries rather than two left joins with a GROUP BY.
   *
   * Joining both `firefly_connections` and `sessions` in one statement
   * multiplies the rows together — a user with 2 connections and 3 sessions
   * produces 6, and `count()` over that reports 6 of each. This is the shape
   * that bug always takes, and it looks right until someone has more than one
   * of both.
   */
  const connectionCount = db
    .select({ value: count() })
    .from(fireflyConnections)
    .where(eq(fireflyConnections.userId, users.id));

  const sessionCount = db
    .select({ value: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, users.id),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        gt(sessions.idleExpiresAt, now),
      ),
    );

  return (
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        status: users.status,
        isDemo: users.isDemo,
        emailVerifiedAt: users.emailVerifiedAt,
        onboardingCompletedAt: users.onboardingCompletedAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        connections: sql<number>`(${connectionCount})`.mapWith(Number),
        activeSessions: sql<number>`(${sessionCount})`.mapWith(Number),
      })
      .from(users)
      .where(isNull(users.deletedAt))
      // Administrators first, then oldest account first — which on a fresh
      // instance puts the operator at the top of their own list.
      .orderBy(desc(eq(users.role, 'admin')), users.createdAt)
  );
}

/** One user, for an action that has to check what it is about to change. */
export async function getAdminUser(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      isDemo: users.isDemo,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export interface AdminStats {
  users: number;
  admins: number;
  suspended: number;
  unverified: number;
  connections: number;
  activeSessions: number;
}

export async function adminStats(): Promise<AdminStats> {
  const now = new Date();
  const [row] = await db
    .select({
      users: count(),
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`.mapWith(Number),
      suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')`.mapWith(Number),
      unverified: sql<number>`count(*) filter (where ${users.emailVerifiedAt} is null)`.mapWith(
        Number,
      ),
    })
    .from(users)
    .where(isNull(users.deletedAt));

  const [connections] = await db.select({ total: count() }).from(fireflyConnections);
  const [live] = await db
    .select({ total: count() })
    .from(sessions)
    .where(
      and(isNull(sessions.revokedAt), gt(sessions.expiresAt, now), gt(sessions.idleExpiresAt, now)),
    );

  return {
    users: row?.users ?? 0,
    admins: row?.admins ?? 0,
    suspended: row?.suspended ?? 0,
    unverified: row?.unverified ?? 0,
    connections: connections?.total ?? 0,
    activeSessions: live?.total ?? 0,
  };
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  /** Null for a failed sign-in against an address that does not exist. */
  email: string | null;
}

/**
 * The audit trail for the whole instance.
 *
 * `server/auth/security.ts` has a near-identical query scoped to one user, and
 * they are deliberately not shared: that one takes a `userId` and this one must
 * not, and a single function with an optional user filter is one missing
 * argument away from showing every account's trail on the security page.
 */
export async function listAdminAuditLog(
  options: {
    limit?: number;
    action?: string;
    before?: Date;
  } = {},
): Promise<AdminAuditEntry[]> {
  const filters = [];
  if (options.action) filters.push(eq(auditLog.action, options.action));
  if (options.before) filters.push(lt(auditLog.createdAt, options.before));

  return (
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
        email: users.email,
      })
      .from(auditLog)
      // LEFT, not inner: an entry whose user has been deleted, or a failed
      // sign-in against an unknown address, still belongs in the trail. An inner
      // join would silently drop exactly the events worth reading.
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(options.limit ?? 100)
  );
}

export async function listAdminAuditActions(): Promise<string[]> {
  const rows = await db.selectDistinct({ action: auditLog.action }).from(auditLog);
  return rows.map((row) => row.action).sort();
}

export interface SystemInfo {
  version: string;
  revision: string;
  nodeVersion: string;
  environment: string;
  cache: 'redis' | 'in-memory';
  mailTransport: string;
  managedFirefly: string | null;
  managedFireflyUsers: number;
  allowPrivateNetworks: boolean;
  allowInsecureHttp: boolean;
  minFireflyVersion: string;
  database: 'reachable' | 'unreachable';
}

/**
 * What this deployment is running, for the operator who has to support it.
 *
 * Every value here is either a version, a mode, or a boolean policy flag.
 * **No secret, and no value derived from one, belongs in this object** — it
 * crosses to a Client Component as page props. "Is SMTP configured" is a
 * transport name; the SMTP password is not a thing this page has any business
 * confirming the length of.
 */
export async function systemInfo(): Promise<SystemInfo> {
  const env = getEnv();

  let database: SystemInfo['database'] = 'reachable';
  try {
    await db.execute(sql`select 1`);
  } catch {
    // Rendering this page at all means the session read worked, so this is
    // close to unreachable in practice — it is here so the panel states a
    // checked fact rather than an assumption.
    database = 'unreachable';
  }

  const [managed] = await db.select({ total: count() }).from(managedFireflyUsers);

  return {
    version: appVersion(),
    revision: appRevision(),
    nodeVersion: process.version,
    environment: env.NODE_ENV,
    cache: env.REDIS_URL ? 'redis' : 'in-memory',
    mailTransport: env.MAIL_TRANSPORT,
    managedFirefly: env.MANAGED_FIREFLY_URL ?? null,
    managedFireflyUsers: managed?.total ?? 0,
    allowPrivateNetworks: env.FIREFLY_ALLOW_PRIVATE_NETWORKS,
    allowInsecureHttp: env.FIREFLY_ALLOW_INSECURE_HTTP,
    minFireflyVersion: env.MIN_FIREFLY_VERSION,
    database,
  };
}
