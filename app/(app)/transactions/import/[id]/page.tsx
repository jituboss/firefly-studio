import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, FireflyRequestError } from '@/server/firefly/api';
import { batchSummary, currentPlan, getBatch, type Batch } from '@/server/import/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Amount } from '@/components/ui/amount';
import { ErrorState } from '@/components/error-state';
import { FLOW_LABELS, KIND_LABELS } from '@/lib/account-matrix';
import { formatDate } from '@/lib/date';
import { classifyError } from '@/lib/error-taxonomy';
import { ImportPreview } from './preview';
import { UndoButton } from './undo-button';

export const metadata: Metadata = { title: 'Import' };

export default async function ImportBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { id } = await params;
  const batch = await getBatch(id);
  if (!batch) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        href="/transactions/import"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Imports
      </Link>
      <div className="space-y-1">
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{batch.fileName}</h1>
        <p className="text-muted-foreground text-sm">
          Uploaded {formatDate(batch.createdAt, { timezone: session.user.timezone })} ·{' '}
          {batch.rows.length} rows
        </p>
      </div>
      {batch.status === 'preview' || batch.status === 'importing' ? (
        <Preview batch={batch} />
      ) : (
        <Summary batch={batch} timezone={session.user.timezone} />
      )}
    </div>
  );
}

async function Preview({ batch }: { batch: Batch }) {
  let plan;
  try {
    plan = await currentPlan(batch);
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      return <ErrorState kind={classifyError(error)} />;
    }
    throw error;
  }

  const resume =
    batch.status === 'importing' && batch.committed
      ? (() => {
          const values = batch.committed.rows.map((row) => batch.results[String(row.line)]);
          return {
            total: batch.committed.rows.length,
            done: values.filter(Boolean).length,
            imported: values.filter((r) => r?.status === 'imported').length,
            failed: values.filter((r) => r?.status === 'failed').length,
            duplicates: values.filter((r) => r?.status === 'duplicate').length,
          };
        })()
      : null;

  const mapped = Object.entries(batch.overrides.accounts)
    .filter(([, override]) => override.mapTo)
    .map(([name, override]) => ({
      name,
      to: `${override.mapTo!.name} (${KIND_LABELS[override.mapTo!.kind].toLowerCase()})`,
    }));

  return (
    <ImportPreview
      batchId={batch.id}
      plan={plan}
      options={batch.options}
      ledgerTruncated={batch.ledgerTruncated}
      resume={resume}
      mapped={mapped}
    />
  );
}

function Summary({ batch, timezone }: { batch: Batch; timezone: string }) {
  const summary = batchSummary(batch);
  if (!summary || !batch.committed) return null;
  const committed = batch.committed;
  const created = committed.accounts.filter((account) => account.id);
  const createdBudgets = (committed.budgets ?? []).filter((budget) => budget.id);
  const newCategories = committed.newCategories ?? [];
  // The batch tag is the import's own bookkeeping, not part of the user's setup.
  const newTags = (committed.newTags ?? []).filter((tag) => tag !== committed.tag);
  const failed = committed.rows.filter(
    (row) => batch.results[String(row.line)]?.status === 'failed',
  );
  const undone = batch.status === 'undone';
  const undoStarted = committed.undone.length > 0 && !undone;
  const skipped = batch.rows.length - committed.rows.length;

  return (
    <div className="space-y-5">
      {undone ? (
        <Card>
          <CardContent className="p-5 text-sm">
            This import was undone: its {committed.undone.length} transaction
            {committed.undone.length === 1 ? ' was' : 's were'} deleted
            {committed.deletedAccounts.length > 0
              ? `, and ${committed.deletedAccounts.length} account${committed.deletedAccounts.length === 1 ? '' : 's'} it created`
              : ''}
            .
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Imported" value={summary.imported} tone="income" />
        <Tile label="Duplicates skipped" value={summary.duplicates} />
        <Tile
          label="Failed"
          value={summary.failed}
          tone={summary.failed > 0 ? 'expense' : undefined}
        />
        <Tile label="Left out in preview" value={skipped} />
      </div>

      <div className="flex flex-wrap gap-2">
        {batch.tag && !undone ? (
          <Button asChild>
            <Link href={`/transactions?q=${encodeURIComponent(`tag_is:"${batch.tag}"`)}`}>
              <ExternalLink className="size-4" aria-hidden="true" />
              View imported transactions
            </Link>
          </Button>
        ) : null}
        {failed.length > 0 ? (
          <Button asChild variant="outline">
            <a href={`/api/import/${batch.id}/rows?which=failed`} download>
              <Download className="size-4" aria-hidden="true" />
              Download failed rows to fix
            </a>
          </Button>
        ) : null}
        {!undone && summary.imported > 0 ? (
          <UndoButton
            batchId={batch.id}
            imported={summary.imported}
            createdAccounts={created.length}
            createdSetup={createdBudgets.length + newCategories.length + newTags.length}
            resume={undoStarted}
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What was recorded</CardTitle>
          {summary.firstDate && summary.lastDate ? (
            <p className="text-muted-foreground text-sm">
              {formatDate(summary.firstDate, { timezone })} –{' '}
              {formatDate(summary.lastDate, { timezone })}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="divide-y p-0">
          {summary.totals.length === 0 ? (
            <p className="text-muted-foreground px-4 py-4 text-sm">Nothing was imported.</p>
          ) : (
            summary.totals.map((total) => (
              <div
                key={`${total.type}-${total.currency}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="flex-1 text-sm">
                  {FLOW_LABELS[total.type]}s
                  <span className="text-muted-foreground"> · {total.count}</span>
                </span>
                <Amount
                  value={total.amount}
                  currency={total.currency || undefined}
                  tone={
                    total.type === 'withdrawal'
                      ? 'expense'
                      : total.type === 'deposit'
                        ? 'income'
                        : 'neutral'
                  }
                  showSign={false}
                  size="sm"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {summary.accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Effect on your accounts</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {summary.accounts.map((account) => (
              <div
                key={`${account.id ?? account.name}-${account.currency}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {account.id && !undone ? (
                    <Link href={`/accounts/${account.id}`} className="hover:underline">
                      {account.name}
                    </Link>
                  ) : (
                    account.name
                  )}
                </span>
                <Amount value={account.change} currency={account.currency || undefined} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {created.length + createdBudgets.length + newCategories.length + newTags.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set up by this import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                [
                  'Accounts',
                  created.map(
                    (account) => `${account.name} · ${KIND_LABELS[account.kind].toLowerCase()}`,
                  ),
                ],
                ['Budgets', createdBudgets.map((budget) => budget.name)],
                ['Categories', newCategories],
                ['Tags', newTags],
              ] as Array<[string, string[]]>
            ).map(([label, names]) =>
              names.length === 0 ? null : (
                <div
                  key={label}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-sm"
                >
                  <span className="w-24 shrink-0 font-medium">{label}</span>
                  {names.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              ),
            )}
          </CardContent>
        </Card>
      ) : null}

      {failed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Failed rows</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {failed.map((row) => (
              <div key={row.line} className="space-y-0.5 px-4 py-2.5">
                <p className="text-sm">
                  <span className="text-muted-foreground tabular-nums">#{row.line}</span>{' '}
                  {row.row.description} · {row.date}
                </p>
                <p className="text-expense text-xs">{batch.results[String(row.line)]?.error}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'income' | 'expense';
}) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <span className="text-muted-foreground block text-xs">{label}</span>
      <span
        className={
          tone === 'income'
            ? 'text-income text-xl font-semibold tabular-nums'
            : tone === 'expense'
              ? 'text-expense text-xl font-semibold tabular-nums'
              : 'text-xl font-semibold tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}
