import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { userPreferences } from '@/server/db/schema';
import { parseLayout, type DashboardLayout } from '@/lib/dashboard-layout';
import { parseTourState, type TourState } from '@/lib/tour';

/**
 * E3-12 / E2-20 — the two per-account UI states that live beside the display
 * preferences: the dashboard layout and the product tour's progress.
 *
 * Kept out of `server/preferences.ts` because that module's reader is what the
 * root layout calls on every request, and neither of these is needed there.
 */

export async function getDashboardLayout(userId: string): Promise<DashboardLayout> {
  const [row] = await db
    .select({ layout: userPreferences.dashboardLayout })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return parseLayout(row?.layout);
}

export async function saveDashboardLayout(userId: string, layout: DashboardLayout): Promise<void> {
  const value = { order: layout.order, hidden: layout.hidden };
  await db
    .insert(userPreferences)
    .values({ userId, dashboardLayout: value })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { dashboardLayout: value, updatedAt: new Date() },
    });
}

export async function getTourState(userId: string): Promise<TourState | null> {
  const [row] = await db
    .select({ tour: userPreferences.tourState })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return parseTourState(row?.tour);
}

export async function saveTourState(userId: string, state: TourState): Promise<void> {
  const value = { status: state.status, step: state.step };
  await db
    .insert(userPreferences)
    .values({ userId, tourState: value })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { tourState: value, updatedAt: new Date() },
    });
}
