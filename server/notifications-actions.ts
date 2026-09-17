'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import {
  listUnreadNotifications,
  markNotificationRead,
  dismissAllNotifications,
} from '@/server/notifications';

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  try {
    await markNotificationRead(session.user.id, id);
  } catch {
    // best-effort; user can retry
  }

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/bills');
}

export async function dismissAllNotificationsAction(): Promise<void> {
  const session = await requireSession();

  try {
    await dismissAllNotifications(session.user.id);
  } catch {
    // best-effort
  }

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/bills');
}

export async function getUnreadNotifications() {
  const session = await requireSession();
  return listUnreadNotifications(session.user.id);
}
