import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { managedConfig } from '@/server/managed-firefly';
import { loadAccounts } from '@/server/import/firefly';
import { isOwn } from '@/lib/account-matrix';
import { currencyForTimezone } from '@/lib/setup';
import { SetupWizard } from './setup-wizard';

export const metadata: Metadata = { title: 'Set up your ledger' };

/**
 * First-run setup. Reached straight from onboarding for a Studio Cloud ledger
 * — a brand-new, empty Firefly account — and from the dashboard's prompt for
 * any ledger that has no account of your own yet.
 */
export default async function SetupPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (!session.user.onboardingCompletedAt) redirect('/onboarding');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const own = await loadAccounts()
    .then((accounts) => accounts.filter((account) => isOwn(account.kind) && account.active))
    .catch(() => []);

  const suggested = currencyForTimezone(session.user.timezone);
  // Firefly opens every ledger in euros. Only suggest a change when the ledger
  // is still on that default and the timezone says otherwise.
  const suggestion =
    suggested && suggested !== connection.primaryCurrency && own.length === 0 ? suggested : null;

  return (
    <SetupWizard
      suggestedCurrency={suggestion}
      currentCurrency={connection.primaryCurrency}
      timezone={session.user.timezone}
      existingAccounts={own.map((account) => account.name)}
      managed={managedConfig()?.baseUrl === connection.baseUrl}
    />
  );
}
