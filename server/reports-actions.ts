'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { createSavedReport, deleteSavedReport, setSavedReportPinned } from '@/server/reports';
import { parseConfig } from '@/lib/custom-report';

export interface SavedReportState {
  error?: string;
  saved?: string;
}

/**
 * E14-10 — save the current builder selection.
 *
 * The config is re-parsed through `parseConfig` rather than stored as posted:
 * form data is user input, and this is what keeps an arbitrary string out of
 * the insight path the report later resolves to.
 */
export async function saveReportAction(
  _prev: SavedReportState,
  formData: FormData,
): Promise<SavedReportState> {
  const session = await requireSession();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Give the report a name.' };
  if (name.length > 80) return { error: 'That name is too long (80 characters max).' };

  const rawLimit = String(formData.get('limit') ?? '');
  const parsedLimit = Number.parseInt(rawLimit, 10);

  const config = parseConfig({
    metric: String(formData.get('metric') ?? ''),
    dimension: String(formData.get('dimension') ?? ''),
    chart: String(formData.get('chart') ?? ''),
    limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
  });

  try {
    await createSavedReport(session.user.id, {
      name,
      type: 'custom',
      config: { ...config },
      isPinned: formData.get('pin') === 'on',
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save the report.' };
  }

  revalidatePath('/reports/custom');
  revalidatePath('/dashboard');
  return { saved: name };
}

export async function deleteReportAction(
  _prev: SavedReportState,
  formData: FormData,
): Promise<SavedReportState> {
  const session = await requireSession();
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing report id.' };

  try {
    await deleteSavedReport(session.user.id, id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete the report.' };
  }

  revalidatePath('/reports/custom');
  revalidatePath('/dashboard');
  return {};
}

export async function toggleReportPinAction(
  _prev: SavedReportState,
  formData: FormData,
): Promise<SavedReportState> {
  const session = await requireSession();
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing report id.' };

  try {
    await setSavedReportPinned(session.user.id, id, formData.get('pinned') !== 'true');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not update the report.' };
  }

  revalidatePath('/reports/custom');
  revalidatePath('/dashboard');
  return {};
}
