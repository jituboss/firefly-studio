'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { createSavedView, deleteSavedView } from '@/server/saved-views';

export interface SavedViewState {
  error?: string;
}

export async function createSavedViewAction(
  _prev: SavedViewState,
  formData: FormData,
): Promise<SavedViewState> {
  const session = await requireSession();
  const name = String(formData.get('name') ?? '').trim();
  const entity = String(formData.get('entity') ?? '').trim();
  const raw = String(formData.get('query') ?? '{}');

  if (!name || !entity) return { error: 'Name and entity are required.' };

  let query: Record<string, unknown>;
  try {
    query = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { error: 'Invalid query.' };
  }

  try {
    await createSavedView(session.user.id, { name, entity, query, isPinned: true });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save view.' };
  }

  revalidatePath('/transactions');
  return {};
}

export async function deleteSavedViewAction(
  _prev: SavedViewState,
  formData: FormData,
): Promise<SavedViewState> {
  const session = await requireSession();
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing view id.' };

  try {
    await deleteSavedView(session.user.id, id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete view.' };
  }

  revalidatePath('/transactions');
  return {};
}
