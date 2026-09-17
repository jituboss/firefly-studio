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
  if (!session) redirect('/sign-in');

  if (!session.user.onboardingCompletedAt) redirect('/onboarding');

  const [connections, notifications] = await Promise.all([
    listConnections(session.user.id),
    listUnreadNotifications(session.user.id),
  ]);

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
    >
      {children}
    </AppShell>
  );
}
