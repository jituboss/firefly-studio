'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useActionState } from 'react';
import { CircleCheck, Info, ListChecks, ScaleIcon, TriangleAlert } from 'lucide-react';
import {
  clearedTotal,
  correctionPlan,
  countChanges,
  initialSelection,
  parseStatementInput,
  reconcileMath,
  type ReconcileRow,
} from '@/lib/reconcile';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { reconcileAction, type ReconcileState } from '@/server/firefly/reconcile-actions';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';

/**
 * E4-06 — the reconciliation workspace.
 *
 * The whole reason this is a client component is the running difference. Every
 * tick has to move that number in the same frame, because reconciling is a loop
 * of "tick a line, look at the difference, tick the next" run forty times: a
 * server round trip per tick would turn a two-minute job into a ten-minute one
 * and make people stop using the page. So the arithmetic runs here, on
 * `lib/reconcile` — the same functions the Server Action re-runs against fresh
 * data before it writes anything, so a stale tab cannot talk the server into a
 * wrong correction.
 *
 * The live figure lives in the sticky bar at the BOTTOM rather than a sticky
 * header. The list is the thing being scrolled and the difference is the thing
 * being watched, so they cannot share the top of a phone screen: a summary tall
 * enough to show the working eats a fifth of the viewport on every scroll. The
 * working stays in a card that is allowed to scroll away, and the one number
 * that matters follows you down the page.
 */

export interface ReconcileWorkspaceProps {
  accountId: string;
  accountName: string;
  currency: string;
  decimals: number;
  locale: string;
  timezone: string;
  start: string;
  end: string;
  rangeLabel: string;
  opening: string;
  /** What Firefly's own books say the account closed at. */
  bookClosing: string;
  rows: ReconcileRow[];
  unconvertibleIds: string[];
  holdingAccountName: string;
  canCorrect: boolean;
}

export function ReconcileWorkspace({
  accountId,
  accountName,
  currency,
  decimals,
  locale,
  timezone,
  start,
  end,
  rangeLabel,
  opening,
  bookClosing,
  rows,
  unconvertibleIds,
  holdingAccountName,
  canCorrect,
}: ReconcileWorkspaceProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ReconcileState, FormData>(
    reconcileAction,
    {},
  );

  const [selected, setSelected] = React.useState(() => initialSelection(rows));
  /*
   * Prefilled with Firefly's own closing figure, which is right far more often
   * than it is wrong and turns the common case into "tick everything, submit".
   * Held as the raw string the user typed, not a parsed number, so a
   * half-entered "1.23" is never silently rewritten under the cursor.
   */
  const [statementRaw, setStatementRaw] = React.useState(bookClosing);

  // Server data changes under us after a successful submit (`router.refresh`),
  // so the ticked set has to be rebuilt from it or the page would show the old
  // selection over new rows.
  const rowKey = rows.map((row) => `${row.journalId}:${row.reconciled ? 1 : 0}`).join(',');
  React.useEffect(() => {
    setSelected(initialSelection(rows));
    // rowKey is the identity of the server data; `rows` is a fresh array each
    // render and would restart this on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKey]);

  React.useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const unconvertible = React.useMemo(() => new Set(unconvertibleIds), [unconvertibleIds]);

  const statement = parseStatementInput(statementRaw);
  const cleared = clearedTotal(rows, selected, decimals);
  const math = reconcileMath({
    opening,
    cleared,
    statement: statement.value,
    decimals,
  });

  const plan = statement.error
    ? null
    : correctionPlan({
        difference: math.difference,
        assetAccountId: accountId,
        // A placeholder id: the plan is only used here to describe the
        // direction and amount in words. The Server Action builds the real one
        // against the holding account it looks up itself.
        reconciliationAccountId: 'holding',
        start,
        end,
        decimals,
      });

  const [wantsCorrection, setWantsCorrection] = React.useState(false);
  const ticked = rows.filter((row) => selected.has(row.journalId)).length;
  const allTicked = rows.length > 0 && ticked === rows.length;

  /*
   * How many rows would actually be written, as opposed to how many are ticked.
   * Opening the page on a month that was reconciled last week shows every row
   * ticked already, and an enabled "Reconcile 11 transactions" button there
   * promises work it would not do. The count of CHANGES is what the button
   * should offer and what decides whether it is live at all.
   */
  const counts = countChanges(rows, selected);
  const willCorrect = wantsCorrection && !math.balanced && canCorrect && !statement.error;
  const nothingToDo = counts.total === 0 && !willCorrect;

  const money = (value: string) =>
    formatMoney(value, { currency, locale, decimalPlaces: decimals });

  function toggle(journalId: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(journalId);
      else next.delete(journalId);
      return next;
    });
  }

  /*
   * Shift-click ticks everything between the last box and this one.
   *
   * Reconciling a statement usually means ticking a contiguous run of dates,
   * and forty individual clicks is the difference between a tool people use and
   * one they abandon for Firefly's own screen. `lastToggled` is a ref rather
   * than state because it must not cause a render — it only matters at the
   * moment of the next click.
   */
  const lastToggled = React.useRef<string | null>(null);

  function onRowChange(row: ReconcileRow, on: boolean, shiftKey: boolean) {
    const anchor = lastToggled.current;
    lastToggled.current = row.journalId;

    if (!shiftKey || anchor === null || anchor === row.journalId) {
      toggle(row.journalId, on);
      return;
    }

    const from = rows.findIndex((candidate) => candidate.journalId === anchor);
    const to = rows.findIndex((candidate) => candidate.journalId === row.journalId);
    if (from < 0 || to < 0) {
      toggle(row.journalId, on);
      return;
    }

    const [lo, hi] = from <= to ? [from, to] : [to, from];
    setSelected((current) => {
      const next = new Set(current);
      for (const span of rows.slice(lo, hi + 1)) {
        if (on) next.add(span.journalId);
        else next.delete(span.journalId);
      }
      return next;
    });
  }

  const status = describeStatus({
    balanced: math.balanced,
    difference: math.difference,
    hasRows: rows.length > 0,
    allTicked,
    statementError: statement.error,
  });

  return (
    <form action={formAction} className="min-w-0 space-y-5">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="end" value={end} />
      <input type="hidden" name="statement" value={statementRaw} />
      {[...selected].map((journalId) => (
        <input key={journalId} type="hidden" name="journal" value={journalId} />
      ))}
      {wantsCorrection && !math.balanced && canCorrect ? (
        <input type="hidden" name="correct" value="on" />
      ) : null}

      {state.error ? (
        <Banner tone="bad" icon={TriangleAlert} title="That did not go through">
          {state.error}
        </Banner>
      ) : null}

      {state.ok && state.notice ? (
        <Banner
          tone={state.balanced ? 'good' : 'warn'}
          icon={state.balanced ? CircleCheck : Info}
          title={state.balanced ? 'Reconciled' : 'Saved'}
        >
          {state.notice}
        </Banner>
      ) : null}

      {/* --- the working ---------------------------------------------------- */}

      <Card className="min-w-0">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Figure
            label={`Opening balance on ${formatDate(start, { timezone })}`}
            help="What Firefly says this account held the day before this period began."
          >
            <Amount
              value={opening}
              currency={currency}
              locale={locale}
              decimalPlaces={decimals}
              tone="neutral"
              size="lg"
              describe={`balance of ${money(opening)}`}
            />
          </Figure>

          <Figure
            label="Cleared in this period"
            help={`The ${ticked} transaction${ticked === 1 ? '' : 's'} you have ticked, netted.`}
          >
            <Amount
              value={cleared}
              currency={currency}
              locale={locale}
              decimalPlaces={decimals}
              showSign
              size="lg"
            />
          </Figure>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="statement-balance" className="text-sm font-medium">
              Closing balance on your statement
            </label>
            <CurrencyInput
              id="statement-balance"
              currency={currency}
              value={statementRaw}
              onChange={(event) => setStatementRaw(event.target.value)}
              aria-describedby="statement-help"
              aria-invalid={statement.error ? true : undefined}
              className={cn('max-w-xs', statement.error && 'border-expense')}
            />
            <p id="statement-help" className="text-muted-foreground text-xs">
              {statement.error ? (
                <span className="text-expense font-medium">{statement.error}</span>
              ) : (
                <>
                  Prefilled with Firefly&rsquo;s own figure ({money(bookClosing)}). Replace it with
                  the balance printed on your statement.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- the list -------------------------------------------------------- */}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <ScaleIcon className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="text-sm font-medium">No transactions in {rangeLabel.toLowerCase()}</p>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              There is nothing to tick off. If your statement still disagrees with the opening
              balance, you can write a correction below to bring the account into line.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  lastToggled.current = null;
                  setSelected(allTicked ? new Set() : new Set(rows.map((row) => row.journalId)));
                }}
              >
                <ListChecks className="size-4" aria-hidden="true" />
                {allTicked ? 'Untick all' : 'Tick all'}
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {ticked} of {rows.length} ticked
              </span>
            </div>
            <p className="text-muted-foreground hidden text-xs sm:block">
              Shift-click to tick a run of rows
            </p>
          </div>

          <ul className="divide-y">
            {rows.map((row) => (
              <Row
                key={row.journalId}
                row={row}
                checked={selected.has(row.journalId)}
                onChange={onRowChange}
                currency={currency}
                locale={locale}
                decimals={decimals}
                timezone={timezone}
                unconvertible={unconvertible.has(row.journalId)}
              />
            ))}
          </ul>
        </Card>
      )}

      {unconvertibleIds.length > 0 ? (
        <Banner tone="warn" icon={TriangleAlert} title="Some amounts are in another currency">
          {unconvertibleIds.length} transaction{unconvertibleIds.length === 1 ? '' : 's'} here{' '}
          {unconvertibleIds.length === 1 ? 'is' : 'are'} recorded in a currency this account does
          not hold, so {unconvertibleIds.length === 1 ? 'it counts' : 'they count'} as nothing in
          the difference below. Ticking {unconvertibleIds.length === 1 ? 'it' : 'them'} is safe, but
          a correction cannot be written while{' '}
          {unconvertibleIds.length === 1 ? 'it is' : 'they are'} on screen.
        </Banner>
      ) : null}

      {/* --- the difference, and the commit ---------------------------------- */}

      {/*
        The guidance the sticky bar has no room for below `md`. In flow rather
        than in the bar, so it can wrap to three lines on a phone without
        costing the bar its height on every scroll.
      */}
      <p className="text-muted-foreground px-1 text-sm md:hidden">{status}</p>

      {/*
        The correction lives in normal flow, not in the sticky bar.

        It was inside it, and the bar came to 379px of a 780px phone screen —
        half the viewport, permanently, while the list underneath it is the
        thing being read. Measured, not guessed. It also does not belong there
        on its merits: the difference is watched continuously and the correction
        is decided once, at the end, so only the first earns a permanent seat.
      */}
      {!math.balanced && !statement.error ? (
        <CorrectionChoice
          enabled={wantsCorrection}
          onChange={setWantsCorrection}
          canCorrect={canCorrect && unconvertibleIds.length === 0}
          accountId={accountId}
          accountName={accountName}
          holdingAccountName={holdingAccountName}
          blockedByCurrency={unconvertibleIds.length > 0}
          amount={plan ? money(plan.amount) : ''}
          direction={plan?.direction ?? 'drain'}
          untickedCount={rows.length - ticked}
        />
      ) : null}

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-20 -mx-1 min-w-0 border-t px-1 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-muted-foreground text-[11px] font-medium">
              {math.balanced && !statement.error ? 'Balanced' : 'Difference'}
            </p>
            {/*
              An assertive live region would interrupt a screen-reader user on
              every single tick. Polite lets the running total be announced when
              they pause, which is when it is useful.
            */}
            <p aria-live="polite" className="min-w-0">
              {statement.error ? (
                <span className="text-muted-foreground text-lg font-semibold">—</span>
              ) : math.balanced ? (
                <span className="text-income inline-flex items-center gap-1.5 text-lg font-semibold">
                  <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
                  {money('0')}
                </span>
              ) : (
                <Amount
                  value={math.difference}
                  currency={currency}
                  locale={locale}
                  decimalPlaces={decimals}
                  showSign
                  size="lg"
                  describe={
                    math.difference.startsWith('-')
                      ? `your books are ${money(math.difference.slice(1))} short of the statement`
                      : `your books are ${money(math.difference)} ahead of the statement`
                  }
                />
              )}
            </p>
          </div>

          {/*
            The guidance sentence is the first thing to go when the bar is
            narrow: on a phone it is already above, under the difference tile in
            the working card, and repeating it here would cost the row its
            height. Hidden rather than wrapped, because a wrapping sentence is
            what made this bar tall in the first place.
          */}
          <p className="text-muted-foreground hidden min-w-0 flex-1 text-sm md:block">{status}</p>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href={`/accounts/${accountId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending || statement.error !== null || nothingToDo}>
              {isPending ? 'Saving…' : submitLabel(counts, willCorrect, ticked)}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

/**
 * What the button offers, in terms of what it will actually write.
 *
 * Counted by CHANGES, not by ticks: reopening a month that was reconciled last
 * week shows every row ticked, and "Reconcile 11 transactions" there promises
 * work the submit would not do. The nothing-to-do wording then splits on WHY
 * there is nothing — an untouched list needs an instruction, a fully reconciled
 * one needs reassurance, and "Nothing to save" served neither.
 */
function submitLabel(
  counts: { reconcile: number; unreconcile: number; total: number },
  withCorrection: boolean,
  ticked: number,
): string {
  if (withCorrection && counts.total === 0) return 'Write the correction';
  if (withCorrection) return `Save ${counts.total} and correct`;
  if (counts.total === 0) return ticked === 0 ? 'Tick some lines first' : 'Already reconciled';
  // Named for what the submit does. Unticking a month and reading "Reconcile 12
  // transactions" on the button that undoes them is the opposite of the truth.
  if (counts.reconcile > 0 && counts.unreconcile > 0)
    return `Save ${counts.total} change${counts.total === 1 ? '' : 's'}`;
  if (counts.unreconcile > 0)
    return `Unreconcile ${counts.unreconcile} transaction${counts.unreconcile === 1 ? '' : 's'}`;
  return `Reconcile ${counts.reconcile} transaction${counts.reconcile === 1 ? '' : 's'}`;
}

/**
 * The sentence under the difference.
 *
 * It changes with where you are in the job, because "Difference: €12.40" on its
 * own is a number without an instruction. Halfway through a statement a
 * difference is expected and means "keep going"; with every row ticked the same
 * number means something quite different — the statement has a line Firefly has
 * never heard of — and that is the moment to say so.
 */
function describeStatus({
  balanced,
  difference,
  hasRows,
  allTicked,
  statementError,
}: {
  balanced: boolean;
  difference: string;
  hasRows: boolean;
  allTicked: boolean;
  statementError: string | null;
}): string {
  if (statementError) return 'Enter a valid closing balance to see the difference.';
  if (balanced) return 'Your books match the statement. Save to lock these transactions in.';
  if (!hasRows)
    return 'Firefly holds no transactions for this period, so the whole difference is unaccounted for.';
  if (allTicked)
    return 'Everything is ticked and it still does not balance — your statement has a line Firefly does not, or an amount here is wrong.';
  return difference.startsWith('-')
    ? 'Tick the lines that appear on your statement; money is still missing from your books.'
    : 'Tick the lines that appear on your statement to work this down to zero.';
}

function Row({
  row,
  checked,
  onChange,
  currency,
  locale,
  decimals,
  timezone,
  unconvertible,
}: {
  row: ReconcileRow;
  checked: boolean;
  onChange: (row: ReconcileRow, on: boolean, shiftKey: boolean) => void;
  currency: string;
  locale: string;
  decimals: number;
  timezone: string;
  unconvertible: boolean;
}) {
  const inputId = `reconcile-${row.journalId}`;

  return (
    <li className={cn('min-w-0', checked && 'bg-muted/40')}>
      {/*
        The whole row is the label, so the hit target is the row rather than a
        16px box — the difference between a comfortable pass down a statement
        and a test of aim, and it matters most on the phone where the box is
        smallest.
      */}
      <label
        htmlFor={inputId}
        className="hover:bg-muted/60 has-[:focus-visible]:bg-muted/60 flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors"
      >
        <Checkbox
          id={inputId}
          checked={checked}
          onChange={(event) =>
            onChange(
              row,
              event.target.checked,
              // `nativeEvent` carries the modifier; React's change event does
              // not. Reading it here keeps the handler on the input, so the
              // keyboard path (space bar, no modifier) still works untouched.
              (event.nativeEvent as MouseEvent | undefined)?.shiftKey === true,
            )
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-sm font-medium">{row.description}</span>
            {row.system ? (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {row.type === 'reconciliation' ? 'Correction' : 'Opening'}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground min-w-0 truncate text-xs">
            {formatDate(row.date, { timezone })} · {row.counterparty}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {unconvertible ? (
            <span
              className="text-muted-foreground text-xs"
              title="Recorded in another currency; not counted in the difference"
            >
              other currency
            </span>
          ) : (
            <Amount
              value={row.effect}
              currency={currency}
              locale={locale}
              decimalPlaces={decimals}
              showSign
              className="font-semibold"
            />
          )}
          {row.reconciled ? (
            <p className="text-muted-foreground text-[10px]">already reconciled</p>
          ) : null}
        </div>
      </label>
    </li>
  );
}

function CorrectionChoice({
  enabled,
  onChange,
  canCorrect,
  accountId,
  accountName,
  holdingAccountName,
  blockedByCurrency,
  amount,
  direction,
  untickedCount,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  canCorrect: boolean;
  accountId: string;
  accountName: string;
  holdingAccountName: string;
  blockedByCurrency: boolean;
  amount: string;
  direction: 'drain' | 'fill';
  /** Rows still unticked — a correction written over them covers real money. */
  untickedCount: number;
}) {
  if (!canCorrect) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
        {blockedByCurrency ? (
          <>
            A correction cannot be written while transactions in another currency are in this range,
            because the difference above is not the whole story.
          </>
        ) : (
          <>
            {/*
              Firefly's API genuinely cannot create this account: POST /accounts
              accepts only asset/expense/revenue/cash/liability, and the two
              payload shapes that would have Firefly create it implicitly both
              fail on 6.5.5. Saying exactly what to do once beats a 500 nobody
              can act on.
            */}
            Firefly has not created its <strong>{holdingAccountName}</strong> holding account yet,
            and its API provides no way to create one. Reconcile this account once in Firefly itself
            — after that, corrections can be written from here. You can still save the transactions
            you have ticked.
          </>
        )}
      </p>
    );
  }

  return (
    <label className="hover:bg-muted/50 flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors">
      <span className="pt-0.5">
        <Checkbox checked={enabled} onChange={(event) => onChange(event.target.checked)} />
      </span>
      <span className="min-w-0">
        <span className="font-medium">Write a correction for the difference</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          Records a {amount} reconciliation{' '}
          {direction === 'drain' ? 'taking money out of' : 'adding money to'}{' '}
          <Link
            href={`/accounts/${accountId}`}
            className="underline underline-offset-2"
            onClick={(event) => event.stopPropagation()}
          >
            {accountName}
          </Link>
          , so its balance matches your statement. Firefly keeps it in a holding account and leaves
          it out of your spending reports.
        </span>
        {/*
          Offering this while lines are still unticked is offering to paper over
          money that is already recorded. It is not forbidden — a cheque that has
          not cleared is a real reason to leave a line unticked — but it is said
          out loud, because the difference on screen is the sum of the unticked
          lines plus whatever is genuinely missing, and only the second part
          belongs in a correction.
        */}
        {untickedCount > 0 ? (
          <span className="text-expense mt-1 block text-xs font-medium">
            {untickedCount} line{untickedCount === 1 ? ' is' : 's are'} still unticked. If any of
            them appear on your statement, tick {untickedCount === 1 ? 'it' : 'them'} first — the
            correction would otherwise cover money your books already have.
          </span>
        ) : null}
      </span>
    </label>
  );
}

function Figure({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {children}
      <p className="text-muted-foreground text-xs">{help}</p>
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'good' | 'warn' | 'bad';
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      // Server outcomes are announced; the running difference is not, because
      // that would talk over every keystroke.
      role={tone === 'bad' ? 'alert' : 'status'}
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-lg border p-3 text-sm',
        tone === 'good' && 'border-income/40 bg-income/5',
        tone === 'warn' && 'border-transfer/40 bg-transfer/5',
        tone === 'bad' && 'border-expense/40 bg-expense/5',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
