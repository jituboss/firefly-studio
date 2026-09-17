import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getSession } from '@/server/auth/session';
import { getDefaultConnection } from '@/server/connections';

/**
 * E2-13 — the authoritative guard. Middleware only checks that a cookie exists;
 * this validates it against the database and forces onboarding until the user
 * has a working Firefly connection.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  if (!session.user.onboardingCompletedAt) redirect('/onboarding');

  const connection = await getDefaultConnection(session.user.id);

  return (
    <AppShell
      userName={session.user.displayName ?? session.user.email}
      connectionLabel={connection?.label ?? null}
      connectionStatus={connection?.status ?? null}
    >
      {children}
    </AppShell>
  );
}
