'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { savePreferences } from '@/server/preferences';
import { parsePreferences } from '@/lib/preferences';

export interface PreferencesState {
  error?: string;
  saved?: boolean;
}

/**
 * E18-02 — save the display preferences.
 *
 * `revalidatePath('/', 'layout')` rather than a single page: theme, balance
 * blurring and reduced motion are applied as attributes on <html> by the root
 * layout, and the density and locale reach every page that renders a figure.
 * Revalidating just this page would save the value and leave the whole app
 * still rendering the old one until something else happened to refresh it.
 */
export async function savePreferencesAction(
  _prev: PreferencesState,
  formData: FormData,
): Promise<PreferencesState> {
  const session = await requireSession();

  await savePreferences(session.user.id, parsePreferences(formData));

  revalidatePath('/', 'layout');
  return { saved: true };
}
