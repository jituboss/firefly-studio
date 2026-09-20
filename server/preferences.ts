import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { userPreferences, users } from '@/server/db/schema';
import { getSession } from '@/server/auth/session';
import { DEFAULT_PREFERENCES, type AppPreferences } from '@/lib/preferences';

export { DEFAULT_PREFERENCES, type AppPreferences };

/**
 * E18-02 — read the signed-in user's display preferences.
 *
 * `cache()` because the root layout, the app shell and individual pages all
 * want these within one render, and they must not become three queries.
 *
 * The locale comes from `users.locale`, not from `user_preferences`. Those two
 * had drifted: onboarding wrote `user_preferences.number_format`, which nothing
 * read, while sixteen pages formatted their numbers with `users.locale`, which
 * nothing wrote — so the number format chosen during setup had never once
 * changed what anybody saw. One column is the source of truth now, and it is
 * the one the pages were already reading.
 */
export const getPreferences = cache(async (): Promise<AppPreferences> => {
  const session = await getSession();
  if (!session) return DEFAULT_PREFERENCES;

  const [row] = await db
    .select({
      theme: userPreferences.theme,
      density: userPreferences.density,
      defaultLandingPage: userPreferences.defaultLandingPage,
      hideBalances: userPreferences.hideBalances,
      reducedMotion: userPreferences.reducedMotion,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (!row) return { ...DEFAULT_PREFERENCES, locale: session.user.locale };

  return {
    theme: row.theme,
    density: row.density,
    locale: session.user.locale,
    defaultLandingPage: row.defaultLandingPage,
    hideBalances: row.hideBalances,
    reducedMotion: row.reducedMotion,
  };
});

/** Write all of them, including the locale that lives on the user row. */
export async function savePreferences(userId: string, preferences: AppPreferences): Promise<void> {
  await db
    .insert(userPreferences)
    .values({
      userId,
      theme: preferences.theme,
      density: preferences.density,
      defaultLandingPage: preferences.defaultLandingPage,
      hideBalances: preferences.hideBalances,
      reducedMotion: preferences.reducedMotion,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        theme: preferences.theme,
        density: preferences.density,
        defaultLandingPage: preferences.defaultLandingPage,
        hideBalances: preferences.hideBalances,
        reducedMotion: preferences.reducedMotion,
        updatedAt: new Date(),
      },
    });

  await db
    .update(users)
    .set({ locale: preferences.locale, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * The landing page for a user id, for callers that cannot use the cached
 * reader above: sign-in resolves this in the same request that creates the
 * session, before `getSession()` can see the cookie it has just set.
 */
export async function getLandingPage(userId: string): Promise<string> {
  const [row] = await db
    .select({ landing: userPreferences.defaultLandingPage })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return row?.landing ?? DEFAULT_PREFERENCES.defaultLandingPage;
}
