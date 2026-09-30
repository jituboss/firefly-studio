'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { getTourState, saveDashboardLayout, saveTourState } from '@/server/dashboard';
import {
  isPresetId,
  parseLayout,
  presetLayout,
  type DashboardLayout,
} from '@/lib/dashboard-layout';
import { nextTourState, type TourState } from '@/lib/tour';

/**
 * E3-12 — save the dashboard layout. The argument arrives from the browser, so
 * it goes through `parseLayout` like anything else read from outside.
 */
export async function saveDashboardLayoutAction(
  raw: unknown,
): Promise<{ layout: DashboardLayout }> {
  const session = await requireSession();
  const layout = parseLayout(raw);
  await saveDashboardLayout(session.user.id, layout);
  revalidatePath('/dashboard');
  return { layout };
}

/** E2-19 — replace the layout with a preset's. */
export async function applyDashboardPresetAction(
  preset: string,
): Promise<{ layout: DashboardLayout } | { error: string }> {
  const session = await requireSession();
  if (!isPresetId(preset)) return { error: 'Unknown preset.' };
  const layout = presetLayout(preset);
  await saveDashboardLayout(session.user.id, layout);
  revalidatePath('/dashboard');
  return { layout };
}

/**
 * E2-20 — move the tour. Deliberately does not revalidate: the tour renders
 * from client state once it is running, and a revalidation on every "Next"
 * would re-render the page underneath the popover the user is reading.
 */
export async function tourAction(
  action: 'start' | 'next' | 'back' | 'dismiss' | 'finish',
): Promise<TourState> {
  const session = await requireSession();
  const next = nextTourState(await getTourState(session.user.id), action);
  await saveTourState(session.user.id, next);
  return next;
}
