import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getPreferences } from '@/server/preferences';
import { Card, CardContent } from '@/components/ui/card';
import { PreferencesForm } from './preferences-form';

export const metadata: Metadata = { title: 'Preferences' };

/**
 * E18-02 — how the app looks and behaves for this account.
 *
 * Everything on this page changes something, and each control claims only what
 * it actually does — the regional format says "dates and chart labels" because
 * that is its real reach today, not "every number in the app", which it is not.
 *
 * The date format and week start that onboarding also collects are deliberately
 * absent: nothing renders from them at all yet, and a control that stores a
 * value nobody reads is worse than no control. Both arrive with locale-aware
 * formatting (E21-08).
 */
export default async function PreferencesPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const preferences = await getPreferences();

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground text-sm">
          How Firefly Studio looks and behaves for you. These follow your account, not this browser,
          so they apply wherever you sign in.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <PreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
