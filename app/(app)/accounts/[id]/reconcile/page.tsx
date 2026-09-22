import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ScaleIcon, TriangleAlert } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAccount,
  getAccountBalanceOn,
  getAllAccountTransactions,
  getReconciliationAccounts,
} from '@/server/firefly/queries';
import { resolveRangeFromParams, previousDay } from '@/lib/date-range';
import {
  buildReconcileRows,
  findReconciliationAccount,
  isReconcilable,
  reconciliationAccountName,
} from '@/lib/reconcile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/ui/empty-state';
import { ReconcileWorkspace } from './workspace';

export const metadata: Metadata = { title: 'Reconcile' };

/**
 * E4-06 — reconcile an account against a bank statement.
 *
 * Asset accounts only, and that is Firefly's rule rather than ours: the
 * `reconciliation` transaction type is valid between a Reconciliation account
 * and an Asset account and no other pair, and Firefly's own repository throws
 * outright when asked for the holding account of anything else. A liability
 * gets a plain explanation here rather than a 404, because "Reconcile" is a
 * word people will try in the address bar after seeing it on another account.
 *
 * The default range is LAST month, not this one. A statement covers a period
 * that has closed; defaulting to a month still in progress would open the page
 * on a list that is guaranteed not to balance.
 */
export default async function ReconcilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { id } = await params;
  const query = await searchParams;
  const hasExplicitRange =
    typeof query.range === 'string' ||
    (typeof query.start === 'string' && typeof query.end === 'string');
  const range = resolveRangeFromParams(
    hasExplicitRange ? query : { range: 'last-month' },
    session.user.timezone,
  );

  let account;
  try {
    account = (await getAccount(id)).data;
  } catch {
    notFound();
  }

  const a = account.attributes;

  if (!isReconcilable(account)) {
    return (
      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
        <BackLink id={id} />
        <EmptyState
          icon={ScaleIcon}
          title={`${a.name} cannot be reconciled`}
          description={
            'Firefly reconciles asset accounts — current accounts, savings, cash and credit cards held as assets. ' +
            'This one is a ' +
            a.type +
            ' account, and Firefly has no reconciliation for it.'
          }
          action={{ label: 'Back to the account', href: `/accounts/${id}` }}
        />
      </div>
    );
  }

  const currency = a.currency_code ?? connection.primaryCurrency;
  const decimals = a.currency_decimal_places ?? 2;

  /*
   * Every read here throws rather than degrading to an empty result, and the
   * failure is shown as a failure.
   *
   * The fail-soft readers the rest of the account views use answer `{data: []}`
   * when Firefly is unreachable. On a list that renders as "no transactions".
   * Here it would render as an opening balance of zero, a full-period
   * difference, and a button offering to write that difference into the ledger
   * — the dashboard-zeros defect with a money write attached to it.
   */
  let figures;
  try {
    figures = await Promise.all([
      getAccountBalanceOn(id, previousDay(range.start)),
      getAccountBalanceOn(id, range.end),
      getAllAccountTransactions(id, range.start, range.end),
      getReconciliationAccounts(),
    ]);
  } catch {
    return (
      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
        <BackLink id={id} />
        <EmptyState
          icon={TriangleAlert}
          title="Firefly did not answer"
          description={
            'Reconciling needs every transaction in the period and the balances either side of it. ' +
            'Some of that could not be read, so nothing is shown rather than a difference computed ' +
            'from a partial picture.'
          }
          action={{ label: 'Try again', href: `/accounts/${id}/reconcile?range=${range.preset}` }}
          secondaryAction={{ label: 'Back to the account', href: `/accounts/${id}` }}
        />
      </div>
    );
  }

  const [openingResponse, closingResponse, range_, holdingAccounts] = figures;
  const { rows, unconvertible } = buildReconcileRows(range_.groups, id, currency, decimals);
  const holding = findReconciliationAccount(holdingAccounts.data, a.name, currency);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-5">
      <BackLink id={id} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reconcile</h1>
          <p className="text-muted-foreground text-sm">
            {a.name} · {currency}
          </p>
        </div>
        <DateRangePicker label={range.label} />
      </header>

      {range_.truncated ? (
        <Card className="border-expense/40 bg-expense/5">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-medium">This range is too long to reconcile in one go</p>
            <p className="text-muted-foreground text-sm">
              More transactions were found than one screen can account for, so the figures below
              would be computed from a partial list. Pick a shorter period — a single statement
              month is what this page is for.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReconcileWorkspace
          accountId={id}
          accountName={a.name}
          currency={currency}
          decimals={decimals}
          locale={session.user.locale}
          timezone={session.user.timezone}
          start={range.start}
          end={range.end}
          rangeLabel={range.label}
          opening={openingResponse.data.attributes.current_balance ?? '0'}
          bookClosing={closingResponse.data.attributes.current_balance ?? '0'}
          rows={rows}
          unconvertibleIds={unconvertible.map((row) => row.journalId)}
          holdingAccountName={
            holding ? holding.attributes.name : reconciliationAccountName(a.name, currency)
          }
          canCorrect={holding !== null}
        />
      )}
    </div>
  );
}

function BackLink({ id }: { id: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href={`/accounts/${id}`}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to account
      </Link>
    </Button>
  );
}
