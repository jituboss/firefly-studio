'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  SkipForward,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  commitChunkAction,
  discardImportAction,
  recheckDuplicatesAction,
  setAccountOverrideAction,
  setOptionsAction,
  setRowOverrideAction,
  skipRowsAction,
} from '@/server/import/actions';
import type {
  ImportPlan,
  NewAccount,
  PlannedRow,
  PlannedSide,
  RowStatus,
  SetupName,
} from '@/lib/import/plan';
import { CREATABLE_KINDS } from '@/lib/import/plan';
import { ALL_KINDS, FLOW_LABELS, KIND_LABELS, type AccountKind } from '@/lib/account-matrix';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Amount } from '@/components/ui/amount';
import { ConfirmButton } from '@/components/ui/confirm';
import { FormMessage } from '@/components/auth/form-shell';
import { AccountPicker, NO_ACCOUNT } from '@/components/transactions/account-picker';

interface Progress {
  total: number;
  done: number;
  imported: number;
  failed: number;
  duplicates: number;
}

const FILTERS: Array<{ value: RowStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'error', label: 'Needs attention' },
  { value: 'duplicate', label: 'Duplicates' },
  { value: 'skipped', label: 'Skipped' },
];

const STATUS_BADGE: Record<
  RowStatus,
  { label: string; variant: 'income' | 'warning' | 'expense' | 'outline' }
> = {
  ready: { label: 'Ready', variant: 'income' },
  duplicate: { label: 'Duplicate', variant: 'warning' },
  error: { label: 'Needs attention', variant: 'expense' },
  skipped: { label: 'Skipped', variant: 'outline' },
};

const PAGE = 100;

/**
 * The import preview: everything the import WILL do, correctable in place,
 * before anything is written. Every correction is a server action that stores
 * an override and re-renders the plan, so what is shown is always what the
 * commit will freeze — the plan is never recomputed in the browser.
 */
export function ImportPreview({
  batchId,
  plan,
  options,
  ledgerTruncated,
  resume,
  mapped,
}: {
  batchId: string;
  plan: ImportPlan;
  /** Names the user pointed at an existing account, so the choice can be undone. */
  mapped: Array<{ name: string; to: string }>;
  options: { applyRules: boolean; tag: boolean };
  ledgerTruncated: boolean;
  /** Set when an import already started and stopped part-way. */
  resume: Progress | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<RowStatus | 'all'>(
    plan.counts.error > 0 ? 'error' : 'all',
  );
  const [shown, setShown] = React.useState(PAGE);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<Progress | null>(resume);

  const rows = filter === 'all' ? plan.rows : plan.rows.filter((row) => row.status === filter);

  function act(work: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await work();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'That did not work.');
      }
    });
  }

  async function run() {
    setRunning(true);
    setError(null);
    try {
      // Chunk after chunk until done; each one records its own results, so a
      // closed tab or a failed request resumes rather than restarts.
      for (;;) {
        const next = await commitChunkAction(batchId);
        if (next.error) {
          setError(next.error);
          break;
        }
        setProgress(next);
        if (next.finished) break;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The import stopped.');
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  if (running || progress) {
    const value = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <div className="flex items-center gap-2 text-sm font-medium">
            {running ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {running
              ? 'Importing — keep this page open.'
              : 'This import stopped part-way. Resuming carries on from where it stopped; rows already written are not written again.'}
          </div>
          <ProgressBar value={value} label="Import progress" />
          {progress ? (
            <p className="text-muted-foreground text-sm tabular-nums">
              {progress.done} of {progress.total} rows · {progress.imported} imported
              {progress.duplicates ? ` · ${progress.duplicates} duplicates` : ''}
              {progress.failed ? ` · ${progress.failed} failed` : ''}
            </p>
          ) : null}
          {!running ? (
            <Button onClick={run}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Resume import
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const errorLines = plan.rows.filter((row) => row.status === 'error').map((row) => row.line);

  return (
    <div className="space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['ready', 'error', 'duplicate', 'skipped'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status);
              setShown(PAGE);
            }}
            className={cn(
              'bg-card hover:bg-accent/40 rounded-lg border p-3 text-left transition-colors',
              filter === status && 'ring-ring ring-2',
            )}
          >
            <span className="text-muted-foreground block text-xs">
              {STATUS_BADGE[status].label}
            </span>
            <span className="text-xl font-semibold tabular-nums">{plan.counts[status]}</span>
          </button>
        ))}
      </div>

      {ledgerTruncated ? (
        <p className="text-warning flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          The file covers more transactions than the duplicate check reads at once, so some existing
          transactions were not compared. Splitting the file by month makes the check complete.
        </p>
      ) : null}

      <SetupPanel plan={plan} />

      {plan.newAccounts.length > 0 || mapped.length > 0 ? (
        <NewAccounts
          batchId={batchId}
          accounts={plan.newAccounts}
          mapped={mapped}
          act={act}
          disabled={pending}
        />
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Rows</CardTitle>
          <div
            role="tablist"
            aria-label="Filter rows"
            className="bg-muted flex flex-wrap gap-1 rounded-lg p-1"
          >
            {FILTERS.map((entry) => (
              <button
                key={entry.value}
                type="button"
                role="tab"
                aria-selected={filter === entry.value}
                onClick={() => {
                  setFilter(entry.value);
                  setShown(PAGE);
                }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium',
                  filter === entry.value ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
              >
                {entry.label}
                {entry.value !== 'all' ? ` ${plan.counts[entry.value]}` : ''}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pb-3">
          {filter === 'error' && errorLines.length > 0 ? (
            <div className="flex flex-wrap gap-2 px-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => act(() => skipRowsAction(batchId, errorLines))}
              >
                <SkipForward className="size-4" aria-hidden="true" />
                Skip all {errorLines.length}
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/import/${batchId}/rows`} download>
                  <Download className="size-4" aria-hidden="true" />
                  Download these rows to fix
                </a>
              </Button>
            </div>
          ) : null}
          {rows.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">No rows here.</p>
          ) : (
            <ul className="divide-y border-t">
              {rows.slice(0, shown).map((row) => (
                <RowItem key={row.line} batchId={batchId} row={row} act={act} disabled={pending} />
              ))}
            </ul>
          )}
          {rows.length > shown ? (
            <div className="px-4">
              <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, rows.length - shown)} more of {rows.length - shown}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <fieldset className="space-y-2" disabled={pending}>
            <legend className="sr-only">Options</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={options.applyRules}
                onChange={(event) =>
                  act(() =>
                    setOptionsAction(batchId, { ...options, applyRules: event.target.checked }),
                  )
                }
              />
              <span>
                Apply my rules
                <span className="text-muted-foreground block text-xs">
                  Firefly runs your rules on each imported transaction, as it does on one entered by
                  hand.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={options.tag}
                onChange={(event) =>
                  act(() => setOptionsAction(batchId, { ...options, tag: event.target.checked }))
                }
              />
              <span>
                Tag them with this import
                <span className="text-muted-foreground block text-xs">
                  Makes the batch easy to find afterwards. Undo works either way.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={pending || plan.counts.ready === 0}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Import {plan.counts.ready} transaction{plan.counts.ready === 1 ? '' : 's'}
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => act(() => recheckDuplicatesAction(batchId))}
            >
              <RefreshCw className={cn('size-4', pending && 'animate-spin')} aria-hidden="true" />
              Re-check duplicates
            </Button>
            <ConfirmButton
              variant="ghost"
              size="default"
              title="Discard this import?"
              message="The uploaded rows and your corrections are removed. Nothing in Firefly changes."
              confirmLabel="Discard"
              onConfirm={() => act(() => discardImportAction(batchId))}
              className="text-expense ml-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Discard
            </ConfirmButton>
          </div>
          {plan.counts.error > 0 ? (
            <p className="text-muted-foreground text-xs">
              Rows that need attention are left out unless fixed. Duplicates are left out unless you
              choose to import them anyway.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

/*
 * Names wrap rather than truncate. On a phone the two sides share one narrow
 * line, and `truncate` there squeezed both names to nothing while their kind
 * labels ran into each other — the one thing this line exists to show.
 */
function Side({ side, fallback }: { side: PlannedSide | null; fallback: string }) {
  if (!side) return <span className="text-foreground break-words">{fallback || '—'}</span>;
  return (
    <span className="min-w-0">
      <span className="text-foreground break-words">{side.name}</span>
      {side.kind ? (
        <span className="text-muted-foreground">
          {' '}
          · {KIND_LABELS[side.kind].toLowerCase()}
          {side.newKey ? ', new' : ''}
        </span>
      ) : null}
    </span>
  );
}

function RowItem({
  batchId,
  row,
  act,
  disabled,
}: {
  batchId: string;
  row: PlannedRow;
  act: (work: () => Promise<unknown>) => void;
  disabled: boolean;
}) {
  const badge = STATUS_BADGE[row.status];
  return (
    <li className="space-y-1.5 px-4 py-3">
      {/* Three lines that each have the full width: what and how much, between
          whom, and when and in what state. Side by side they fought for room. */}
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground w-8 shrink-0 pt-0.5 text-xs tabular-nums">
          #{row.line}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-sm font-medium break-words">
              {row.row.description || '—'}
            </span>
            {row.row.amount ? (
              <Amount
                value={row.row.amount}
                currency={row.row.currency ?? undefined}
                tone="neutral"
                size="sm"
                showSign={false}
                className="shrink-0"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
            <Side side={row.source} fallback={row.swapped ? row.row.destination : row.row.source} />
            <ArrowRight
              className="text-muted-foreground size-3 shrink-0 self-center"
              aria-hidden="true"
            />
            <Side
              side={row.destination}
              fallback={row.swapped ? row.row.source : row.row.destination}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs tabular-nums">{row.row.date ?? ''}</span>
            {row.type ? <Badge variant="outline">{FLOW_LABELS[row.type]}</Badge> : null}
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>
      </div>

      {row.errors.length > 0 || row.warnings.length > 0 ? (
        <ul className="ml-11 space-y-0.5 text-xs">
          {row.errors.map((message) => (
            <li key={message} className="text-expense">
              {message}
            </li>
          ))}
          {row.warnings.map((message) => (
            <li key={message} className="text-muted-foreground">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ml-11 flex flex-wrap gap-1.5">
        {row.status === 'skipped' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => act(() => setRowOverrideAction(batchId, row.line, { skip: false }))}
          >
            <Undo2 className="size-3.5" aria-hidden="true" />
            Include again
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => act(() => setRowOverrideAction(batchId, row.line, { skip: true }))}
          >
            <SkipForward className="size-3.5" aria-hidden="true" />
            Skip
          </Button>
        )}
        {row.canSwap || row.swapped ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() =>
              act(() => setRowOverrideAction(batchId, row.line, { swap: !row.swapped }))
            }
          >
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            {row.swapped ? 'Swap back' : 'Swap source and destination'}
          </Button>
        ) : null}
        {row.status === 'duplicate' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => act(() => setRowOverrideAction(batchId, row.line, { force: true }))}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            Not a duplicate — import it
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function NewAccounts({
  batchId,
  accounts,
  mapped,
  act,
  disabled,
}: {
  batchId: string;
  accounts: NewAccount[];
  mapped: Array<{ name: string; to: string }>;
  act: (work: () => Promise<unknown>) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {accounts.length > 0 ? 'New accounts' : 'Accounts'}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Names that matched nothing in Firefly. A new payee becomes an expense account and a new
          payer a revenue account — if a name is one of YOUR accounts (a bank account, a loan),
          choose that kind here. Or point the name at an account you already have.
        </p>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {accounts.map((account) => (
          <div key={account.key} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{account.name}</span>
              <span className="text-muted-foreground text-xs">
                {account.needed ? 'will be created · ' : 'needed by rows to fix · '}
                {account.lines.length} row{account.lines.length === 1 ? '' : 's'}
              </span>
              <Select
                aria-label={`Kind for ${account.name}`}
                value={account.kind}
                disabled={disabled}
                className="h-8 w-36"
                onChange={(event) =>
                  act(() =>
                    setAccountOverrideAction(batchId, account.name, { kind: event.target.value }),
                  )
                }
              >
                {CREATABLE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </Select>
            </div>
            {account.reason ? (
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {account.reason}
                  {account.confidence === 'low' ? ' Worth a check.' : ''}
                </span>
              </p>
            ) : null}
            {account.suggestion ? (
              <p className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-warning">
                  Did you mean {account.suggestion.name} (
                  {KIND_LABELS[account.suggestion.kind].toLowerCase()})?
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  disabled={disabled}
                  onClick={() =>
                    act(() =>
                      setAccountOverrideAction(batchId, account.name, {
                        mapTo: {
                          id: account.suggestion!.id,
                          name: account.suggestion!.name,
                          kind: account.suggestion!.kind,
                        },
                      }),
                    )
                  }
                >
                  Use {account.suggestion.name}
                </Button>
              </p>
            ) : null}
            <MapToExisting
              id={`map-${account.key}`}
              onPick={(picked) =>
                act(() => setAccountOverrideAction(batchId, account.name, { mapTo: picked }))
              }
            />
          </div>
        ))}
        {mapped.map((entry) => (
          <div key={entry.name} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate">
              “{entry.name}” <ArrowRight className="inline size-3" aria-hidden="true" /> {entry.to}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() =>
                act(() => setAccountOverrideAction(batchId, entry.name, { mapTo: null }))
              }
            >
              <Undo2 className="size-3.5" aria-hidden="true" />
              Undo
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MapToExisting({
  id,
  onPick,
}: {
  id: string;
  onPick: (account: { id: string; name: string; kind: AccountKind }) => void;
}) {
  const [value, setValue] = React.useState(NO_ACCOUNT);
  return (
    <div className="max-w-sm">
      <AccountPicker
        id={id}
        kinds={ALL_KINDS}
        value={value}
        label="Use an existing account instead"
        placeholder="Or use an existing account…"
        onChange={(next) => {
          setValue(next);
          if (next.id && next.kind) onPick({ id: next.id, name: next.name, kind: next.kind });
        }}
      />
    </div>
  );
}

/**
 * What the ready rows will set up, at a glance: new accounts by kind, and the
 * categories, budgets and tags they create or reuse. For someone starting with
 * an empty ledger this is the whole of their setup, so it is said plainly
 * before anything is written.
 */
function SetupPanel({ plan }: { plan: ImportPlan }) {
  const accounts = plan.newAccounts.filter((account) => account.needed);
  const byKind = new Map<string, number>();
  for (const account of accounts) {
    const label = KIND_LABELS[account.kind].toLowerCase();
    byKind.set(label, (byKind.get(label) ?? 0) + 1);
  }
  const groups: Array<[string, SetupName[]]> = [
    ['Categories', plan.setup.categories],
    ['Budgets', plan.setup.budgets],
    ['Tags', plan.setup.tags],
  ];
  if (accounts.length === 0 && groups.every(([, list]) => list.length === 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What this import sets up</CardTitle>
        <p className="text-muted-foreground text-sm">
          Anything that already exists is reused — names are matched whatever their capitals. Only
          what the ready rows need is created.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="w-24 shrink-0 font-medium">Accounts</span>
          {accounts.length === 0 ? (
            <span className="text-muted-foreground">all existing</span>
          ) : (
            <span>
              {accounts.length} new
              <span className="text-muted-foreground">
                {' '}
                ({[...byKind].map(([kind, count]) => `${count} ${kind}`).join(', ')})
              </span>
            </span>
          )}
        </div>
        {groups.map(([label, list]) =>
          list.length === 0 ? null : (
            <div key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-sm">
              <span className="w-24 shrink-0 font-medium">{label}</span>
              {list.map((entry) => (
                <Badge key={entry.name} variant={entry.isNew ? 'income' : 'outline'}>
                  {entry.isNew ? '+ ' : ''}
                  {entry.name}
                  <span className="opacity-70"> · {entry.rows}</span>
                </Badge>
              ))}
            </div>
          ),
        )}
        <p className="text-muted-foreground text-xs">
          <Badge variant="income">+ new</Badge> is created by this import; the rest already exist.
        </p>
      </CardContent>
    </Card>
  );
}
