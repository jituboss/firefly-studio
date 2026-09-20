'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { requireSession } from '@/server/auth/session';
import { recordAudit } from '@/server/audit';
import {
  deleteConnection,
  getConnectionToken,
  listConnections,
  recordConnectionCheck,
  renameConnection,
  rotateConnectionToken,
  setDefaultConnection,
} from '@/server/connections';
import { probeInstance, probeUser } from '@/server/firefly/probe';
import { FireflyRequestError } from '@/server/firefly/client';
import { UrlGuardError } from '@/server/firefly/url-guard';
import { assertDemoAllowed, demoRefusal } from '@/server/auth/demo';

/** E2-22 — connections manager actions. */

export interface ConnectionActionState {
  error?: string;
  notice?: string;
}

function describe(error: unknown): string {
  if (error instanceof UrlGuardError || error instanceof FireflyRequestError) return error.message;
  return 'Something went wrong.';
}

export async function testConnectionAction(
  _prev: ConnectionActionState,
  formData: FormData,
): Promise<ConnectionActionState> {
  const refusal = await demoRefusal('manageConnections');
  if (refusal) return { error: refusal };
  const session = await requireSession();
  const connectionId = String(formData.get('connectionId') ?? '');

  const credentials = await getConnectionToken(session.user.id, connectionId);
  if (!credentials) return { error: 'Connection not found.' };

  try {
    const remoteUser = await probeUser(credentials.baseUrl, credentials.token);
    const instance = await probeInstance(credentials.baseUrl, credentials.token);
    await recordConnectionCheck(connectionId, { status: 'ok' });
    revalidatePath('/settings/connections');
    return { notice: `Connected to Firefly III ${instance.version} as ${remoteUser.email}.` };
  } catch (error) {
    const status =
      error instanceof FireflyRequestError &&
      (error.code === 'unauthorised' || error.code === 'forbidden')
        ? 'unauthorised'
        : 'unreachable';
    await recordConnectionCheck(connectionId, { status, error: describe(error) });
    revalidatePath('/settings/connections');
    return { error: describe(error) };
  }
}

export async function rotateTokenAction(
  _prev: ConnectionActionState,
  formData: FormData,
): Promise<ConnectionActionState> {
  const refusal = await demoRefusal('manageConnections');
  if (refusal) return { error: refusal };
  const session = await requireSession();
  const connectionId = String(formData.get('connectionId') ?? '');
  const token = String(formData.get('token') ?? '').trim();

  if (!token) return { error: 'Paste the new token.' };

  const existing = await getConnectionToken(session.user.id, connectionId);
  if (!existing) return { error: 'Connection not found.' };

  try {
    const remoteUser = await probeUser(existing.baseUrl, token);
    await rotateConnectionToken(session.user.id, connectionId, token, remoteUser);
    await recordAudit({
      userId: session.user.id,
      action: 'connection.token_rotated',
      entity: 'firefly_connection',
      entityId: connectionId,
    });
    revalidatePath('/settings/connections');
    return { notice: `Token replaced. Connected as ${remoteUser.email}.` };
  } catch (error) {
    return { error: describe(error) };
  }
}

export async function renameConnectionAction(formData: FormData): Promise<void> {
  await assertDemoAllowed('manageConnections');
  const session = await requireSession();
  const connectionId = String(formData.get('connectionId') ?? '');
  const label = String(formData.get('label') ?? '').trim();
  if (label) {
    await renameConnection(session.user.id, connectionId, label);
    revalidatePath('/settings/connections');
  }
}

export async function setDefaultConnectionAction(formData: FormData): Promise<void> {
  await assertDemoAllowed('manageConnections');
  const session = await requireSession();
  await setDefaultConnection(session.user.id, String(formData.get('connectionId') ?? ''));
  revalidatePath('/settings/connections');
}

export async function deleteConnectionAction(formData: FormData): Promise<void> {
  await assertDemoAllowed('manageConnections');
  const session = await requireSession();
  const connectionId = String(formData.get('connectionId') ?? '');
  await deleteConnection(session.user.id, connectionId);
  await recordAudit({
    userId: session.user.id,
    action: 'connection.deleted',
    entity: 'firefly_connection',
    entityId: connectionId,
  });

  // Connection lifecycle fix — with zero connections left, `onboardingState`
  // resuming at the token step (E2-21) would point the wizard at a server
  // that no longer has a row here. Clearing it sends the user back to step 1
  // instead of a stale step 2.
  const remaining = await listConnections(session.user.id);
  if (remaining.length === 0) {
    await db
      .update(users)
      .set({ onboardingState: null, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
  }

  // Connection lifecycle fix — the connection count now decides whether the
  // user can even reach the app (see app/(app)/layout.tsx), so the whole
  // tree has to revalidate, not just this settings page.
  revalidatePath('/', 'layout');
}
