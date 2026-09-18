import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { userPreferences } from '@/server/db/schema';
import { getSession } from '@/server/auth/session';
import { getDefaultConnection } from '@/server/connections';
import { loadPersonaliseOptions, resolveOnboardingStep } from '@/server/onboarding/actions';
import { getManagedMapping, managedConfig } from '@/server/managed-firefly';
import { shouldBounceToDashboard } from '@/lib/connection-lifecycle';
import { OnboardingWizard } from './wizard';

export const metadata: Metadata = { title: 'Connect Firefly III' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getDefaultConnection(session.user.id);

  // E2-23 — `?add=1` reuses this wizard to attach an ADDITIONAL instance. The
  // steps are identical; the only difference is that a finished user is not
  // bounced straight back to the dashboard.
  //
  // Connection lifecycle fix — `adding` also requires a connection to already
  // exist. A user with zero connections always sees the plain first-run
  // wizard: the "adding another instance" banner would otherwise lie to
  // someone who has nothing to add to.
  const params = await searchParams;
  const adding = params.add === '1' && connection !== null;

  // Connection lifecycle fix — the app layout now sends a zero-connection
  // user back here even after `onboardingCompletedAt` is set, so bouncing on
  // that flag alone would loop /onboarding <-> /dashboard forever. See
  // shouldBounceToDashboard for the full condition.
  const hasCompletedOnboarding = Boolean(session.user.onboardingCompletedAt);
  if (shouldBounceToDashboard(hasCompletedOnboarding, connection !== null, adding)) {
    redirect('/dashboard');
  }

  // Adding a second instance always starts at step 1, whatever progress the
  // first run left behind.
  const step = adding ? 1 : await resolveOnboardingStep();

  // Only reach out to Firefly once a working connection exists.
  const options = step === 3 ? await loadPersonaliseOptions() : { currency: null, accounts: [] };

  // Connection lifecycle fix — a re-run of step 3 (adding another instance,
  // or resuming after a removed connection) should not silently reset saved
  // preferences back to defaults, so the wizard is seeded with whatever is
  // already on file.
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  // Offered only when this deployment operates an instance. `hasAccount`
  // changes the wording from "we will create one" to "you already have one".
  const managed = managedConfig();
  const managedMapping = managed ? await getManagedMapping(session.user.id) : null;

  return (
    <OnboardingWizard
      adding={adding}
      initialStep={step}
      initialBaseUrl={session.user.onboardingState?.baseUrl ?? ''}
      connectionLabel={connection?.label ?? null}
      remoteEmail={connection?.remoteUserEmail ?? null}
      fireflyVersion={connection?.fireflyVersion ?? null}
      currency={options.currency}
      accounts={options.accounts}
      timezone={session.user.timezone}
      email={session.user.email}
      managed={managed ? { label: managed.label, hasAccount: Boolean(managedMapping) } : null}
      defaultNumberFormat={preferences?.numberFormat ?? 'en-US'}
      defaultDateFormat={preferences?.dateFormat ?? 'medium'}
      defaultWeekStart={preferences?.weekStart ?? 1}
      defaultAccountIds={preferences?.defaultAccountIds ?? []}
    />
  );
}
