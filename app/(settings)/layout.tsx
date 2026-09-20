import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { appVersion } from '@/server/version';
import { SettingsTabs } from './settings/tabs';
import { getSession } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { listUnreadNotifications } from '@/server/notifications';

/**
 * Settings sits in its own route group so that it is reachable BEFORE
 * onboarding is finished.
 *
 * `app/(app)/layout.tsx` redirects to /onboarding until a Firefly connection
 * exists, which is right for the dashboard and every ledger view — they have
 * nothing to show without one. Applying it to Settings had a sharp edge:
 * someone who signed up and then abandoned the wizard could never reach
 * Settings → Security, so they could not see their sessions or delete their
 * own account. Found by trying exactly that (E2-10 verification).
 *
 * Route groups do not affect the URL, so these pages are still /settings/*.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const [connections, notifications] = await Promise.all([
    listConnections(session.user.id),
    listUnreadNotifications(session.user.id),
  ]);

  return (
    <AppShell
      userName={session.user.displayName ?? session.user.email}
      connections={connections.map((entry) => ({
        id: entry.id,
        label: entry.label,
        status: entry.status,
        isDefault: entry.isDefault,
      }))}
      notifications={notifications}
      version={appVersion()}
      isDemo={session.user.isDemo}
    >
      {/* The tab bar belongs to the whole section, so it lives here rather than
          being repeated on each page. Its container matches the `max-w-3xl`
          every settings page uses, so the tabs line up with the content under
          them. */}
      <div className="mx-auto w-full max-w-3xl">
        <SettingsTabs />
      </div>
      {children}
    </AppShell>
  );
}
