'use server';

import { revalidatePath } from 'next/cache';
import { fireflyWrite, FireflyRequestError } from './api';

/** E16-05 — rename and delete from the attachment manager. */

export interface AttachmentState {
  error?: string;
  notice?: string;
  ok?: boolean;
}

export async function renameAttachmentAction(
  _prev: AttachmentState,
  formData: FormData,
): Promise<AttachmentState> {
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!id) return { error: 'Missing attachment.' };

  try {
    // `title` is the display name; `filename` is the stored file and Firefly
    // will not let it change, so renaming only ever touches the title.
    await fireflyWrite(`/v1/attachments/${id}`, 'PUT', { title });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/attachments');
  return { ok: true, notice: 'Renamed.' };
}

export async function deleteAttachmentAction(
  _prev: AttachmentState,
  formData: FormData,
): Promise<AttachmentState> {
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing attachment.' };

  try {
    await fireflyWrite(`/v1/attachments/${id}`, 'DELETE');
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/attachments');
  revalidatePath('/transactions');
  return { ok: true, notice: 'Deleted.' };
}
