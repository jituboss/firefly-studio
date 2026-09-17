'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { requireSession, destroyCurrentSession, revokeAllSessions } from '@/server/auth/session';
import { verifyPassword } from '@/server/auth/password';
import { revokeOtherSessions, revokeSession } from '@/server/auth/security';
import { listConnections } from '@/server/connections';
import { purgeConnectionNamespace } from '@/server/firefly/cache';
import { recordAudit } from '@/server/audit';
import { requestMeta } from '@/server/auth/request-meta';

export interface SecurityState {
  error?: string;
  notice?: string;
}

/** E2-08 — sign one other device out. */
export async function revokeSessionAction(
  _prev: SecurityState,
  formData: FormData,
): Promise<SecurityState> {
  const session = await requireSession();
  const id = String(formData.get('sessionId') ?? '');
  if (!id) return { error: 'Missing session.' };

  // Revoking your own session here would sign you out mid-page with no
  // explanation; "Sign out" is the button for that.
  if (id === session.sessionId) {
    return { error: 'That is this device. Use Sign out instead.' };
  }

  const revoked = await revokeSession(session.user.id, id);
  if (!revoked) return { error: 'That session is no longer active.' };

  const meta = await requestMeta();
  await recordAudit({
    userId: session.user.id,
    action: 'auth.session.revoked',
    entity: 'session',
    entityId: id,
    ...meta,
  });

  revalidatePath('/settings/security');
  return { notice: 'That device has been signed out.' };
}

/** E2-08 — sign every other device out at once. */
export async function revokeOtherSessionsAction(
  _prev: SecurityState,
  _formData: FormData,
): Promise<SecurityState> {
  const session = await requireSession();
  const count = await revokeOtherSessions(session.user.id, session.sessionId);

  const meta = await requestMeta();
  await recordAudit({
    userId: session.user.id,
    action: 'auth.sessions.revoked_others',
    metadata: { count },
    ...meta,
  });

  revalidatePath('/settings/security');
  return {
    notice:
      count === 0
        ? 'No other devices were signed in.'
        : `Signed out ${count} other device${count === 1 ? '' : 's'}.`,
  };
}

/**
 * E2-10 — account deletion.
 *
 * Soft delete, not a row delete. The `users_email_unique` index is partial on
 * `deleted_at is null`, so the address is freed for re-registration while the
 * tombstone stays put — which is what keeps audit rows that reference this user
 * meaningful instead of orphaned.
 *
 * Order matters: purge the Firefly response cache BEFORE dropping the
 * connection rows, because the cache is keyed by connection id and once the
 * rows are gone there is nothing left to tell us which namespaces to clear.
 */
export async function deleteAccountAction(
  _prev: SecurityState,
  formData: FormData,
): Promise<SecurityState> {
  const session = await requireSession();

  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirm') ?? '').trim();

  if (confirmation !== 'DELETE') {
    return { error: 'Type DELETE to confirm.' };
  }
  if (!password) {
    return { error: 'Enter your password to confirm.' };
  }

  // Re-authenticate: a deletion reached from an already-open session is
  // exactly the case a stolen laptop produces.
  const digest = session.user.passwordHash;
  if (!digest || !(await verifyPassword(digest, password))) {
    return { error: 'That password is not correct.' };
  }

  const connections = await listConnections(session.user.id);
  for (const connection of connections) {
    await purgeConnectionNamespace(connection.id);
  }

  const meta = await requestMeta();
  await recordAudit({
    userId: session.user.id,
    action: 'auth.account.deleted',
    metadata: { connections: connections.length },
    ...meta,
  });

  // The connection rows, sessions, saved views and saved reports all cascade
  // from this via their own foreign keys.
  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      status: 'deleted',
      // The encrypted PAT is unreachable without a session, but a deleted
      // account should not keep a usable credential hash either.
      passwordHash: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  await revokeAllSessions(session.user.id);
  await destroyCurrentSession();

  redirect('/sign-in?deleted=1');
}
