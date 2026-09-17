'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { fireflyWrite, FireflyRequestError } from './api';
import { requireSession } from '@/server/auth/session';
import { recordAudit } from '@/server/audit';
import { DESTROYABLE_VALUES, type DestroyableObject } from '@/lib/firefly-data';

/**
 * E19-03 — the danger zone.
 *
 * `DELETE /data/destroy?objects=<type>` removes a whole class of records from
 * the connected Firefly instance with no undo and no export first. Firefly
 * answers 204 whether it deleted ten thousand rows or none, so there is no
 * confirmation to show afterwards beyond "it finished".
 *
 * Three gates stand in front of it, and each one guards a different mistake:
 * an elevated session (someone else at an unlocked screen), a typed phrase
 * naming the exact data (the right person on the wrong row), and an audit entry
 * (nobody being able to say afterwards that it did not happen).
 */

export interface DestroyState {
  error?: string;
  ok?: boolean;
  destroyed?: string;
}

export async function destroyDataAction(
  _prev: DestroyState,
  formData: FormData,
): Promise<DestroyState> {
  const session = await requireSession();
  const objects = String(formData.get('objects') ?? '').trim();
  const confirmation = String(formData.get('confirmation') ?? '').trim();

  if (!objects) return { error: 'Choose what to delete.' };
  // Never interpolate a value straight into the query: an unrecognised one
  // would be handed to Firefly to interpret.
  if (!DESTROYABLE_VALUES.has(objects as DestroyableObject)) {
    return { error: 'That is not something Firefly can delete.' };
  }

  // The phrase is the exact `objects` value, so a mis-click on the picker does
  // not survive: the typed word has to agree with the selected one.
  if (confirmation !== objects) {
    return { error: `Type ${objects} exactly to confirm.` };
  }

  if (!session.isElevated) {
    return {
      error:
        'Confirm your password first — this needs a recently re-authenticated session. Open Settings → Security, confirm your password, then come back.',
    };
  }

  const headerList = await headers();
  try {
    await fireflyWrite(`/v1/data/destroy?objects=${encodeURIComponent(objects)}`, 'DELETE');
  } catch (error) {
    // Recorded even on failure: an attempt matters as much as a success here.
    await recordAudit({
      userId: session.user.id,
      action: 'firefly.destroy_failed',
      entity: 'firefly_data',
      ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headerList.get('user-agent'),
      metadata: { objects },
    });
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  await recordAudit({
    userId: session.user.id,
    action: 'firefly.destroy',
    entity: 'firefly_data',
    ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: headerList.get('user-agent'),
    metadata: { objects },
  });

  // Everything could have changed.
  for (const path of [
    '/dashboard',
    '/accounts',
    '/transactions',
    '/budgets',
    '/categories',
    '/bills',
    '/piggy-banks',
    '/rules',
    '/recurring',
    '/tags',
    '/reports',
  ]) {
    revalidatePath(path);
  }

  return { ok: true, destroyed: objects };
}
