import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getCurrencies } from '@/server/firefly/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CurrencyStateButtons } from './state-buttons';

export const metadata: Metadata = { title: 'Currencies' };

/** E13-01 — the currency list, enabled ones first. */
export default async function CurrenciesPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const result = await getCurrencies();

  // `primary` is the current concept; `default` is what older instances called
  // it. Treating either as primary keeps this right across both.
  const isPrimary = (c: (typeof result.data)[number]) =>
    Boolean(c.attributes.primary ?? c.attributes.default);

  const rows = [...result.data].sort((a, b) => {
    if (isPrimary(a) !== isPrimary(b)) return isPrimary(a) ? -1 : 1;
    if (a.attributes.enabled !== b.attributes.enabled) return a.attributes.enabled ? -1 : 1;
    return a.attributes.code.localeCompare(b.attributes.code);
  });

  const enabled = rows.filter((c) => c.attributes.enabled);
  const disabled = rows.filter((c) => !c.attributes.enabled);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground truncate text-sm">
            {enabled.length} in use of {rows.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/currencies/rates">
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Exchange rates
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/currencies/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-border divide-y">
            {enabled.map((currency) => (
              <li key={currency.id} className="flex items-center gap-3 px-4 py-2.5">
                <Link
                  href={`/currencies/${currency.attributes.code}`}
                  className="hover:text-primary min-w-0 flex-1 transition-colors"
                >
                  <p className="truncate text-sm font-medium">
                    <span className="font-mono">{currency.attributes.code}</span>{' '}
                    <span className="text-muted-foreground">{currency.attributes.symbol}</span>{' '}
                    {currency.attributes.name}
                  </p>
                </Link>
                <CurrencyStateButtons
                  code={currency.attributes.code}
                  enabled
                  primary={isPrimary(currency)}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {disabled.length > 0 ? (
        <details>
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">
            {disabled.length} currencies not in use
          </summary>
          <Card className="mt-2 min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-border divide-y">
                {disabled.map((currency) => (
                  <li key={currency.id} className="flex items-center gap-3 px-4 py-2">
                    <Link
                      href={`/currencies/${currency.attributes.code}`}
                      className="hover:text-foreground text-muted-foreground min-w-0 flex-1 truncate text-sm transition-colors"
                    >
                      <span className="font-mono">{currency.attributes.code}</span>{' '}
                      {currency.attributes.name}
                    </Link>
                    <CurrencyStateButtons
                      code={currency.attributes.code}
                      enabled={false}
                      primary={false}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </details>
      ) : null}
    </div>
  );
}
