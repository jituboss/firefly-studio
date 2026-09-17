import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getCurrencies, getExchangeRates } from '@/server/firefly/queries';
import { formatDate, now, toApiDate } from '@/lib/date';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteRateButton, RateForm } from './rate-form';

export const metadata: Metadata = { title: 'Exchange rates' };

/** E13-03 — the rate manager. */
export default async function ExchangeRatesPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const [currencies, rates] = await Promise.all([getCurrencies(), getExchangeRates()]);

  const enabled = currencies.data
    .filter((currency) => currency.attributes.enabled)
    .map((currency) => ({ code: currency.attributes.code, name: currency.attributes.name }));

  // Firefly stores a EUR→EUR row of 1.0 for the primary currency. It is true
  // and useless, so it is not shown.
  const rows = rates.data
    .filter((rate) => rate.attributes.from_currency_code !== rate.attributes.to_currency_code)
    .sort((a, b) => b.attributes.date.localeCompare(a.attributes.date));

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/currencies"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Currencies
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Exchange rates</h1>
        <p className="text-muted-foreground text-sm">
          {rows.length} rate{rows.length === 1 ? '' : 's'} recorded
        </p>
      </header>

      <RateForm
        currencies={enabled}
        today={toApiDate(now(session.user.timezone), session.user.timezone)}
        primary={connection.primaryCurrency}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground p-10 text-center text-sm">
              No rates recorded yet. Firefly only converts between currencies it has a rate for.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {rows.map((rate) => {
                const a = rate.attributes;
                return (
                  <li key={rate.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <span className="font-mono">{a.from_currency_code}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-mono">{a.to_currency_code}</span>
                        <span className="text-muted-foreground"> at </span>
                        <span className="font-medium">{a.rate}</span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(a.date.slice(0, 10), { timezone: session.user.timezone })}
                      </p>
                    </div>
                    <DeleteRateButton
                      id={rate.id}
                      label={`${a.from_currency_code} → ${a.to_currency_code}`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
