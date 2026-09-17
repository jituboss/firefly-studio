'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { setDefaultConnection } from '@/server/connections';
import { recordAudit } from '@/server/audit';
import { requestMeta } from '@/server/auth/request-meta';

/**
 * E2-23 — make one connection the active one.
 *
 * `setDefaultConnection` already scopes its update by userId, so a guessed id
 * belonging to someone else matches no row.
 */
export async function switchConnectionAction(connectionId: string): Promise<void> {
  const session = await requireSession();
  if (!/^[0-9a-f-]{36}$/i.test(connectionId)) return;

  await setDefaultConnection(session.user.id, connectionId);

  const meta = await requestMeta();
  await recordAudit({
    userId: session.user.id,
    action: 'connection.switched',
    entity: 'connection',
    entityId: connectionId,
    ...meta,
  });

  // Every Firefly read resolves through the default connection, so nothing
  // rendered before this point is still valid.
  revalidatePath('/', 'layout');
}
