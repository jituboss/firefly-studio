'use server';

import { revalidatePath } from 'next/cache';
import { fireflyWrite, FireflyRequestError } from './api';

/** E5-14 — transaction links (refunds, reimbursements, part-payments). */

export interface LinkState {
  error?: string;
  ok?: boolean;
}

/**
 * Link two transactions.
 *
 * Both ids are JOURNAL ids — the id of a single split — not transaction group
 * ids. On a one-split transaction the two happen to look interchangeable, which
 * is exactly why this is easy to get wrong and hard to notice: a group id that
 * happens to collide with a real journal id links the wrong pair silently.
 * `/transactions/{id}` reports `transaction_journal_id` per split; that is the
 * value to send.
 */
export async function createTransactionLinkAction(
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const inward = String(formData.get('inward_id') ?? '').trim();
  const outward = String(formData.get('outward_id') ?? '').trim();
  const linkTypeId = String(formData.get('link_type_id') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!inward || !outward) return { error: 'Both transactions are needed.' };
  if (inward === outward) return { error: 'A transaction cannot be linked to itself.' };
  if (!linkTypeId) return { error: 'Pick how they are related.' };

  try {
    await fireflyWrite('/v1/transaction-links', 'POST', {
      link_type_id: linkTypeId,
      inward_id: inward,
      outward_id: outward,
      ...(notes ? { notes } : {}),
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/transactions');
  return { ok: true };
}

export async function deleteTransactionLinkAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await fireflyWrite(`/v1/transaction-links/${id}`, 'DELETE');
  revalidatePath('/transactions');
}

// --- preferences ------------------------------------------------------------

export interface PreferenceState {
  error?: string;
  ok?: boolean;
}

/**
 * E18-01 — write one Firefly-side preference.
 *
 * These are the connected instance's own settings, not this app's. The value is
 * sent as a string and Firefly coerces it to whatever the key expects, so
 * `list-length` comes back as the number 25 after being sent as "25".
 */
export async function savePreferenceAction(
  _prev: PreferenceState,
  formData: FormData,
): Promise<PreferenceState> {
  const name = String(formData.get('name') ?? '').trim();
  const value = String(formData.get('value') ?? '').trim();
  if (!name) return { error: 'Missing preference.' };

  try {
    await fireflyWrite(`/v1/preferences/${encodeURIComponent(name)}`, 'PUT', { data: value });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/settings/firefly');
  return { ok: true };
}
