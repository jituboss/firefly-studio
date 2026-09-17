import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getCurrency } from '@/server/firefly/queries';
import { Card, CardContent } from '@/components/ui/card';
import { CurrencyForm } from '../currency-form';
import { DeleteCurrencyButton } from '../state-buttons';

export const metadata: Metadata = { title: 'Currency' };

export default async function CurrencyDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { code } = await params;

  let currency;
  try {
    currency = (await getCurrency(code)).data;
  } catch {
    notFound();
  }

  const primary = Boolean(currency.attributes.primary ?? currency.attributes.default);

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <Link
        href="/currencies"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Currencies
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="font-mono">{currency.attributes.code}</span> {currency.attributes.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          {primary ? 'The primary currency' : currency.attributes.enabled ? 'In use' : 'Not in use'}
        </p>
      </header>

      <CurrencyForm currency={currency} />

      {primary ? null : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-medium">Delete this currency</p>
              <p className="text-muted-foreground text-sm">
                Firefly refuses if anything still uses it.
              </p>
            </div>
            <DeleteCurrencyButton code={currency.attributes.code} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
