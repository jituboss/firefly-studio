import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { userPreferences } from '@/server/db/schema';
import { parseMobileNav, type MobileNavSlots } from '@/lib/mobile-nav';
import { now, toApiDate } from '@/lib/date';

/** The phone bottom bar's configurable slots for one user. */
export async function getMobileNav(userId: string): Promise<MobileNavSlots> {
  const [row] = await db
    .select({ nav: userPreferences.mobileNav })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return parseMobileNav(row?.nav);
}

export async function saveMobileNav(userId: string, slots: MobileNavSlots): Promise<void> {
  const value = { second: slots.second, fourth: slots.fourth };
  await db
    .insert(userPreferences)
    .values({ userId, mobileNav: value })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { mobileNav: value, updatedAt: new Date() },
    });
}

/**
 * Everything the app shell needs to render the phone bottom bar. Every layout
 * that renders the shell must pass this: the bar is the only navigation on a
 * phone, so a section without it (Settings and Admin were, at first) is a
 * dead end with no way back.
 */
export async function mobileNavProps(
  user: { id: string; timezone: string },
  connections: Array<{ isDefault: boolean; primaryCurrency: string | null }>,
): Promise<{ slots: MobileNavSlots; today: string; currency: string }> {
  const active = connections.find((entry) => entry.isDefault) ?? connections[0];
  return {
    slots: await getMobileNav(user.id),
    today: toApiDate(now(user.timezone), user.timezone),
    currency: active?.primaryCurrency ?? 'EUR',
  };
}
