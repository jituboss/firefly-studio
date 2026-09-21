'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import { getCategoryTransactions } from './queries';
import type { Category } from './types';

/** E7-02 — category writes. */

export interface CategoryFormState {
  error?: string;
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const name = String(formData.get('name') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  if (!name) return { error: 'Name is required.' };

  let created: { data: Category };
  try {
    created = await fireflyWrite<{ data: Category }>('/v1/categories', 'POST', {
      name,
      ...(notes ? { notes } : {}),
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/categories');
  redirect(`/categories/${created.data.id}`);
}

export async function updateCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  if (!id) return { error: 'Missing category id.' };
  if (!name) return { error: 'Name is required.' };

  try {
    await fireflyWrite(`/v1/categories/${id}`, 'PUT', { name, notes: notes || null });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/categories');
  revalidatePath(`/categories/${id}`);
  return {};
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/categories/${id}`, 'DELETE');
  revalidatePath('/categories');
  redirect('/categories');
}

export interface BulkCategoryState {
  error?: string;
  ok?: boolean;
}

/** E7-04 — set a category on every selected transaction group. */
export async function bulkSetCategoryAction(
  _prev: BulkCategoryState,
  formData: FormData,
): Promise<BulkCategoryState> {
  const categoryName = String(formData.get('category_name') ?? '').trim();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (!categoryName) return { error: 'Pick or type a category.' };
  if (ids.length === 0) return { error: 'Select at least one transaction.' };

  try {
    await Promise.all(
      ids.map((id) =>
        fireflyWrite(`/v1/transactions/${id}`, 'PUT', {
          transactions: [{ category_name: categoryName }],
        }),
      ),
    );
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/categories/uncategorised');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * E7-05 — merge one category into another.
 *
 * Firefly has no merge endpoint (`grep -c merge` over the spec: 0), so this is
 * a re-assignment followed by a delete: every transaction filed under the
 * source is rewritten to the target, then the source category is removed.
 *
 * Two behaviours verified against 6.5.5 before writing it:
 *
 *   - `PUT /transactions/{id}` with `{transaction_journal_id, category_name}`
 *     moves the split and preserves its amount and description.
 *   - `DELETE /categories/{id}` does NOT delete the transactions filed under
 *     it; they survive uncategorised. So a failed re-assignment would silently
 *     strip categories rather than lose money — still wrong, which is why the
 *     delete only runs if every page re-assigned cleanly.
 *
 * **Every split of a group is sent, always.** The `transactions` array
 * REPLACES the group: sending only the splits that matched the source category
 * deletes the others. That was verified the hard way while building
 * transaction conversion (PROJECT_PLAN §18.2), and a merge that quietly
 * destroys the other legs of a split would be far worse here, because nobody
 * would look at a split's other legs after renaming a category.
 */
export async function mergeCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const sourceId = String(formData.get('sourceId') ?? '');
  const sourceName = String(formData.get('sourceName') ?? '');
  const targetName = String(formData.get('targetName') ?? '').trim();

  if (!sourceId || !targetName) return { error: 'Pick a category to merge into.' };
  if (targetName.toLowerCase() === sourceName.toLowerCase()) {
    return { error: 'That is the same category.' };
  }

  let moved = 0;
  try {
    /*
     * Paged, because a category can hold thousands of transactions and the
     * endpoint caps a page. The loop re-reads page 1 each time rather than
     * walking forward: re-assigning removes a transaction from this category,
     * so the list shrinks under the cursor and page 2 would skip whatever slid
     * up into page 1.
     */
    for (let guard = 0; guard < 200; guard += 1) {
      const page = await getCategoryTransactions(sourceId, { limit: 50 });
      if (page.data.length === 0) break;

      for (const group of page.data) {
        const splits = group.attributes.transactions.map((split) => ({
          transaction_journal_id: split.transaction_journal_id,
          // Only the splits actually filed under the source move. A split
          // group can carry a different category on each leg.
          ...(split.category_name === sourceName ? { category_name: targetName } : {}),
        }));

        await fireflyWrite(`/v1/transactions/${group.id}`, 'PUT', {
          ...(splits.length > 1
            ? { group_title: group.attributes.group_title ?? 'Split transaction' }
            : {}),
          transactions: splits,
        });
        moved += 1;
      }
    }

    await fireflyWrite(`/v1/categories/${sourceId}`, 'DELETE');
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      return {
        error: `${error.message} ${moved} transaction${moved === 1 ? '' : 's'} had already moved to ${targetName}; ${sourceName} was left in place.`,
      };
    }
    throw error;
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  redirect(`/categories?merged=${encodeURIComponent(`${sourceName} into ${targetName}`)}`);
}
