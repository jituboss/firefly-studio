'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Tag } from './types';

/** E12-02 — tag writes. */

export interface TagFormState {
  error?: string;
}

/**
 * Firefly names the field `tag`, not `name`. Sending `name` is not an error —
 * it is simply ignored, and the tag is created with an empty title, so the
 * mistake shows up as a blank row rather than a 422.
 */
function readTagFields(formData: FormData) {
  const tag = String(formData.get('tag') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const latitude = String(formData.get('latitude') ?? '').trim();
  const longitude = String(formData.get('longitude') ?? '').trim();
  const zoomLevel = String(formData.get('zoom_level') ?? '').trim();

  return {
    tag,
    payload: {
      tag,
      ...(date ? { date } : {}),
      ...(description ? { description } : {}),
      // Firefly rejects a partial coordinate pair, so all three geo fields go
      // together or not at all.
      ...(latitude && longitude
        ? {
            latitude,
            longitude,
            // Sent as the raw string: Firefly coerces it, and the money lint
            // rule bans Number() outside lib/money.ts — correctly, since the
            // exception would be the thin end of that wedge.
            ...(zoomLevel ? { zoom_level: zoomLevel } : {}),
          }
        : {}),
    },
  };
}

export async function createTagAction(
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const { tag, payload } = readTagFields(formData);
  if (!tag) return { error: 'Tag name is required.' };

  let created: { data: Tag };
  try {
    created = await fireflyWrite<{ data: Tag }>('/v1/tags', 'POST', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/tags');
  redirect(`/tags/${encodeURIComponent(created.data.attributes.tag)}`);
}

export async function updateTagAction(
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const original = String(formData.get('original') ?? '');
  const { tag, payload } = readTagFields(formData);
  if (!original) return { error: 'Missing tag.' };
  if (!tag) return { error: 'Tag name is required.' };

  try {
    await fireflyWrite(`/v1/tags/${encodeURIComponent(original)}`, 'PUT', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/tags');
  revalidatePath(`/tags/${encodeURIComponent(original)}`);
  // A rename moves the resource: the old URL 404s from here on.
  if (tag !== original) redirect(`/tags/${encodeURIComponent(tag)}`);
  return {};
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const tag = String(formData.get('tag') ?? '');
  if (!tag) return;

  await fireflyWrite(`/v1/tags/${encodeURIComponent(tag)}`, 'DELETE');
  revalidatePath('/tags');
  redirect('/tags');
}

export interface BulkTagState {
  error?: string;
  ok?: boolean;
  applied?: number;
}

/**
 * E12-04 — add or remove a tag across selected transactions.
 *
 * Firefly replaces the whole `tags` array on a split rather than merging, so
 * adding one tag means reading the current set, appending, and writing it all
 * back. Sending just the new tag silently deletes every other tag on the row.
 */
export async function bulkTagAction(
  _prev: BulkTagState,
  formData: FormData,
): Promise<BulkTagState> {
  const tag = String(formData.get('tag') ?? '').trim();
  const mode = String(formData.get('mode') ?? 'add');
  const ids = formData.getAll('ids').map(String).filter(Boolean);

  if (!tag) return { error: 'Pick or type a tag.' };
  if (ids.length === 0) return { error: 'Select at least one transaction.' };

  try {
    const { getTransaction } = await import('./queries');
    await Promise.all(
      ids.map(async (id) => {
        const current = await getTransaction(id);
        const splits = current.data.attributes.transactions.map((split) => {
          const existing = split.tags ?? [];
          const next =
            mode === 'remove'
              ? existing.filter((value) => value !== tag)
              : existing.includes(tag)
                ? existing
                : [...existing, tag];
          return { transaction_journal_id: split.transaction_journal_id, tags: next };
        });
        await fireflyWrite(`/v1/transactions/${id}`, 'PUT', { transactions: splits });
      }),
    );
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/transactions');
  revalidatePath('/tags');
  return { ok: true, applied: ids.length };
}
