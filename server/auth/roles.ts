import 'server-only';
import { notFound } from 'next/navigation';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { getSession, type SessionContext } from '@/server/auth/session';

/**
 * The administrator gate.
 *
 * Every admin read and every admin write goes through one of these. The nav
 * link and the page both hide themselves from a non-admin, and neither of those
 * is a control: the only thing standing between an ordinary session and another
 * user's account is this module being called on the server, every time.
 */

/** Active administrators, which is what every "last admin" rule is counting. */
export async function adminCount(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active'), isNull(users.deletedAt)));
  return row?.total ?? 0;
}

/**
 * The session, if it belongs to an administrator.
 *
 * `notFound()` rather than a redirect: a non-admin asking for /admin should be
 * told the route does not exist, not that it exists and is not for them.
 */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await getSession();
  if (!session || session.user.role !== 'admin' || session.user.status !== 'active') notFound();
  return session;
}

/**
 * The same check for a Server Action, which cannot render a 404.
 *
 * Returns null when the caller is not an administrator, so the action answers
 * with its own refusal shape rather than throwing a digest at the client.
 */
export async function adminSession(): Promise<SessionContext | null> {
  const session = await getSession();
  if (!session || session.user.role !== 'admin' || session.user.status !== 'active') return null;
  return session;
}

/**
 * Promote this account if the instance has no administrator yet.
 *
 * **One statement, on purpose.** Reading "are there any admins?" and then
 * writing is a race: two people completing sign-up in the same second both read
 * zero and both become administrators of an instance neither of them expected
 * to share. The `not exists` is evaluated inside the same UPDATE, so exactly
 * one of them wins and the other is a no-op.
 *
 * Returns whether it promoted, so the caller can say so in the audit trail.
 */
export async function bootstrapFirstAdmin(userId: string): Promise<boolean> {
  const result = await db.execute(sql`
    update ${users}
    set role = 'admin', updated_at = now()
    where ${users.id} = ${userId}
      and ${users.isDemo} = false
      and ${users.deletedAt} is null
      and not exists (
        select 1 from ${users} as existing
        where existing.role = 'admin' and existing.deleted_at is null
      )
    returning ${users.id}
  `);

  // node-postgres reports `rowCount`; the driver's typing is loose here because
  // `execute` cannot know the shape of an arbitrary statement.
  return (result as unknown as { rowCount: number | null }).rowCount === 1;
}
