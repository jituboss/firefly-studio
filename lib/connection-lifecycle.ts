/**
 * Connection lifecycle fix — pure decisions shared between the onboarding
 * page and the connections settings page, kept out of Server Components so
 * they can be unit tested without a session or a database.
 */

/**
 * `/onboarding` bounces a finished user straight to the dashboard — except
 * when they have zero connections (the app layout sends them right back
 * here) or when they are deliberately attaching another instance. Getting
 * either of those wrong is a redirect loop between `/onboarding` and
 * `/dashboard`, not just a bad default.
 */
export function shouldBounceToDashboard(
  hasCompletedOnboarding: boolean,
  hasConnection: boolean,
  adding: boolean,
): boolean {
  return hasCompletedOnboarding && hasConnection && !adding;
}

/** The `confirm()` copy for removing a connection from Settings → Connections. */
export function deleteConfirmMessage(label: string, isOnly: boolean): string {
  if (isOnly) {
    return (
      `Remove "${label}"? This is your only Firefly instance, so the app will have none left — ` +
      `you'll be walked through reconnecting. Your Firefly III data is not affected.`
    );
  }
  return `Remove "${label}"? Your Firefly III data is not affected.`;
}
