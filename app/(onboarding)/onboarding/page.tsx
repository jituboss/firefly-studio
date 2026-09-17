import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getDefaultConnection } from '@/server/connections';
import { loadPersonaliseOptions, resolveOnboardingStep } from '@/server/onboarding/actions';
import { OnboardingWizard } from './wizard';

export const metadata: Metadata = { title: 'Connect Firefly III' };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  if (session.user.onboardingCompletedAt) redirect('/dashboard');

  const step = await resolveOnboardingStep();
  const connection = await getDefaultConnection(session.user.id);

  // Only reach out to Firefly once a working connection exists.
  const options = step === 3 ? await loadPersonaliseOptions() : { currency: null, accounts: [] };

  return (
    <OnboardingWizard
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
