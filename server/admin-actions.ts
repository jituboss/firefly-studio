'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { adminSession, adminCount } from '@/server/auth/roles';
import { getAdminUser } from '@/server/admin';
import { recordAudit } from '@/server/audit';
import { requestMeta } from '@/server/auth/request-meta';
import { revokeAllSessions } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { purgeConnectionNamespace } from '@/server/firefly/cache';
import {
  refuseDeletion,
  refuseRoleChange,
  refuseStatusChange,
  type AdminTarget,
} from '@/lib/roles';

/**
 * The admin page's writes — all of them, behind ONE exported action.
 *
 * **Every export in a `'use server'` file is a public endpoint.** Four
 * exports — grant, suspend, verify, delete — is four endpoints to keep
 * guarded, and each one that gets added later is another. One action with an
 * `intent` is one place the administrator check has to be right, and it cannot
 * be forgotten on the fifth operation because there is nowhere to forget it.
 *
 * It also fixes a smaller thing that was visible immediately: four
 * `useActionState` hooks meant four result banners stacking up on the page, so
 * after suspending someone the panel still said "…is no longer an
 * administrator" from two actions ago. One action, one current answer.
 *
 * It is called directly as an async function rather than through
 * `useActionState`. Every one of these ends in `revalidatePath('/admin')`,
 * which re-renders the route and takes the panel's hook state with it — the
 * write landed, the audit row was written, and the confirmation never appeared,
 * which reads exactly like a button that does nothing. The caller awaits the
 * returned value and shows it as a toast, which is rendered from the root
 * layout and so outlives the revalidation.
 *
 * The caller is proved to be an administrator here, not trusted to have been
 * checked by the page that rendered the button — verified by replaying a real
 * Server Action request from an ordinary user's session, which is answered
 * `Not allowed.` and writes nothing. That refusal is deliberately the same for
 * "you are not an admin" and "no such user": telling an attacker which of the
 * two they got wrong is telling them something.
 *
 * The decisions themselves live in `lib/roles.ts` and are unit-tested there.
 * This file's job is to load the target, ask, write, and record.
 */

export interface AdminActionState {
  error?: string;
  notice?: string;
}

/** What the row menu asked for. The field name is `intent` on every form. */
const INTENTS = ['role', 'status', 'verify-email', 'delete'] as const;
type Intent = (typeof INTENTS)[number];

/**
 * The single endpoint. Dispatches on `intent` and refuses anything else.
 *
 * An unknown intent is a refusal rather than a silent no-op: a form that posts
 * a typo would otherwise report success and change nothing, which is the worst
 * answer of the three.
 */
export async function manageUserAction(formData: FormData): Promise<AdminActionState> {
  const intent = String(formData.get('intent') ?? '') as Intent;
  if (!INTENTS.includes(intent)) return { error: 'Unknown action.' };

  switch (intent) {
    case 'role':
      return setRole(formData);
    case 'status':
      return setStatus(formData);
    case 'verify-email':
      return verifyEmail(formData);
    case 'delete':
      return deleteUser(formData);
  }
}

const NOT_ALLOWED: AdminActionState = { error: 'Not allowed.' };

/** The target plus the context every rule in `lib/roles.ts` needs. */
async function resolve(formData: FormData, actorId: string) {
  const id = String(formData.get('userId') ?? '');
  if (!id) return null;

  const row = await getAdminUser(id);
  if (!row) return null;

  const target: AdminTarget = {
    id: row.id,
    role: row.role,
    // A soft-deleted row keeps its status, so read the tombstone first.
    status: row.deletedAt ? 'deleted' : row.status,
    isDemo: row.isDemo,
  };

  return { row, target, context: { actorId, adminCount: await adminCount() } };
}

async function setRole(formData: FormData): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return NOT_ALLOWED;

  const next = String(formData.get('role') ?? '');
  if (next !== 'admin' && next !== 'user') return { error: 'Unknown role.' };

  const resolved = await resolve(formData, session.user.id);
  if (!resolved) return NOT_ALLOWED;

  const refusal = refuseRoleChange(resolved.target, next, resolved.context);
  if (refusal) return { error: refusal };

  await db
    .update(users)
    .set({ role: next, updatedAt: new Date() })
    .where(eq(users.id, resolved.row.id));

  await recordAudit({
    userId: session.user.id,
    action: next === 'admin' ? 'admin.role.granted' : 'admin.role.revoked',
    entity: 'user',
    entityId: resolved.row.id,
    metadata: { email: resolved.row.email, from: resolved.target.role, to: next },
    ...(await requestMeta()),
  });

  revalidatePath('/admin');
  return {
    notice:
      next === 'admin'
        ? `${resolved.row.email} is now an administrator.`
        : `${resolved.row.email} is no longer an administrator.`,
  };
}

async function setStatus(formData: FormData): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return NOT_ALLOWED;

  const next = String(formData.get('status') ?? '');
  if (next !== 'active' && next !== 'suspended') return { error: 'Unknown status.' };

  const resolved = await resolve(formData, session.user.id);
  if (!resolved) return NOT_ALLOWED;

  const refusal = refuseStatusChange(resolved.target, next, resolved.context);
  if (refusal) return { error: refusal };

  await db
    .update(users)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(users.id, resolved.row.id));

  /*
   * `getSession` already refuses a non-active user, so a suspension takes
   * effect on their very next request whether or not this runs. The rows are
   * revoked anyway: leaving them live means the suspended account's own
   * security page lists sessions it says are signed in, and an operator
   * auditing "who is currently in" reads a number that includes people who
   * cannot get in.
   */
  if (next === 'suspended') await revokeAllSessions(resolved.row.id);

  await recordAudit({
    userId: session.user.id,
    action: next === 'suspended' ? 'admin.user.suspended' : 'admin.user.reactivated',
    entity: 'user',
    entityId: resolved.row.id,
    metadata: { email: resolved.row.email },
    ...(await requestMeta()),
  });

  revalidatePath('/admin');
  return {
    notice:
      next === 'suspended'
        ? `${resolved.row.email} is suspended and signed out.`
        : `${resolved.row.email} can sign in again.`,
  };
}

/**
 * Confirm an address without a mail round trip.
 *
 * Not a convenience. This app's default mail transport writes the verification
 * link to the server log (`server/mail`), so on a deployment with no SMTP
 * configured an operator's only way to let someone in is to go and read the
 * container's stdout. There is already a `pnpm user:verify` for exactly this;
 * this is the same thing for a person who has a browser and not a shell.
 */
async function verifyEmail(formData: FormData): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return NOT_ALLOWED;

  const resolved = await resolve(formData, session.user.id);
  if (!resolved) return NOT_ALLOWED;
  if (resolved.target.status === 'deleted') return { error: 'That account has been deleted.' };

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, resolved.row.id));

  await recordAudit({
    userId: session.user.id,
    action: 'admin.user.email_verified',
    entity: 'user',
    entityId: resolved.row.id,
    metadata: { email: resolved.row.email },
    ...(await requestMeta()),
  });

  revalidatePath('/admin');
  return { notice: `${resolved.row.email} is confirmed and can sign in.` };
}

/**
 * Soft-delete another account.
 *
 * Mirrors `deleteAccountAction` on the security page deliberately, down to the
 * order: the Firefly response cache is keyed by connection id, so it has to be
 * purged BEFORE the connection rows cascade away, or there is nothing left to
 * say which namespaces to clear.
 *
 * It does not ask for the operator's password the way self-deletion does. The
 * step-up there protects against a stolen laptop being used to destroy the
 * owner's own account; here the damage is bounded by being an administrator in
 * the first place, and the confirmation is a typed dialog.
 */
async function deleteUser(formData: FormData): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return NOT_ALLOWED;

  const resolved = await resolve(formData, session.user.id);
  if (!resolved) return NOT_ALLOWED;

  const refusal = refuseDeletion(resolved.target, resolved.context);
  if (refusal) return { error: refusal };

  const connections = await listConnections(resolved.row.id);
  for (const connection of connections) {
    await purgeConnectionNamespace(connection.id);
  }

  await recordAudit({
    userId: session.user.id,
    action: 'admin.user.deleted',
    entity: 'user',
    entityId: resolved.row.id,
    metadata: { email: resolved.row.email, connections: connections.length },
    ...(await requestMeta()),
  });

  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      status: 'deleted',
      // The sealed PAT is unreachable without a session, but a deleted account
      // should not keep a usable credential hash either.
      passwordHash: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, resolved.row.id));

  await revokeAllSessions(resolved.row.id);

  revalidatePath('/admin');
  return { notice: `${resolved.row.email} has been deleted.` };
}
