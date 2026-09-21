import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { appVersion } from '@/server/version';
import { getSession } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { refreshStaleConnectionsInBackground } from '@/server/connections/health';
import { listUnreadNotifications } from '@/server/notifications';

/**
 * E2-13 — the authoritative guard. Middleware only checks that a cookie exists;
 * this validates it against the database and forces onboarding until the user
 * has a working Firefly connection.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  /*
   * `?expired=1` so the sign-in page can say what happened. Arriving at a
   * login form with no explanation, having been signed in a moment ago, reads
   * as the app losing your session at random — which is exactly what it looks
   * like after a deploy reopens a long-idle tab.
   */
  if (!session) redirect('/sign-in?expired=1');

  if (!session.user.onboardingCompletedAt) redirect('/onboarding');

  const [connections, notifications] = await Promise.all([
    listConnections(session.user.id),
    listUnreadNotifications(session.user.id),
  ]);

  // Connection lifecycle fix — `onboardingCompletedAt` stays true forever
  // once set, even after the user removes their last connection. Every
  // ledger page resolves reads through the default connection, so a zero-
  // connection user here is a broken app, not a quiet empty dashboard.
  if (connections.length === 0) redirect('/onboarding');

  // E2-24 — opportunistic health check, deliberately NOT awaited. A hanging
  // Firefly instance must never add its timeout to this page load; the result
  // lands in the database and shows on the next render.
  refreshStaleConnectionsInBackground(session.user.id);

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
      {children}
    </AppShell>
  );
}
