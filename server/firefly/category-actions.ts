'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
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
