import { AppShell } from '@/components/app-shell';
import { appVersion } from '@/server/version';
import { requireAdmin } from '@/server/auth/roles';
import { listConnections } from '@/server/connections';
import { listUnreadNotifications } from '@/server/notifications';

/**
 * Admin sits in its own route group, for the same reason Settings does — and it
 * is the same bug avoided twice.
 *
 * `app/(app)/layout.tsx` redirects to /onboarding until a Firefly connection
 * exists, which is right for every ledger view and wrong here. An administrator
 * managing accounts on this deployment may have no Firefly instance of their
 * own at all; under that layout they would be bounced to a wizard asking for a
 * personal access token before they could reach a page that has nothing to do
 * with one. The operator locked out of the admin page is precisely the person
 * who cannot ask anyone to let them in.
 *
 * `requireAdmin()` is here as well as on the page. The layout is what runs on
 * every route in the group, so it is the guard that keeps covering anything
 * added under /admin later without whoever adds it having to remember.
 *
 * Route groups do not affect the URL, so this is still /admin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

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
      isAdmin
    >
      {children}
    </AppShell>
  );
}
