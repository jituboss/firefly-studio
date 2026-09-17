import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getDefaultConnection } from '@/server/connections';
import { loadPersonaliseOptions, resolveOnboardingStep } from '@/server/onboarding/actions';
import { OnboardingWizard } from './wizard';

export const metadata: Metadata = { title: 'Connect Firefly III' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  // E2-23 — `?add=1` reuses this wizard to attach an ADDITIONAL instance. The
  // steps are identical; the only difference is that a finished user is not
  // bounced straight back to the dashboard.
  const params = await searchParams;
  const adding = params.add === '1';

  if (session.user.onboardingCompletedAt && !adding) redirect('/dashboard');

  // Adding a second instance always starts at step 1, whatever progress the
  // first run left behind.
  const step = adding ? 1 : await resolveOnboardingStep();
  const connection = await getDefaultConnection(session.user.id);

  // Only reach out to Firefly once a working connection exists.
  const options = step === 3 ? await loadPersonaliseOptions() : { currency: null, accounts: [] };

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
    />
  );
}
