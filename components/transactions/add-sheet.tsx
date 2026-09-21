'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import {
  quickAddTransactionAction,
  type QuickAddState,
} from '@/server/firefly/transaction-actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Combobox } from '@/components/ui/combobox';
import { Select } from '@/components/ui/select';
import { FormMessage } from '@/components/auth/form-shell';

/**
 * E3-16 / E5-13 — record a transaction without leaving the page you are on.
 *
 * Used by the dashboard, which was read-only (every number on it comes from
 * transactions and there was no way to add one without navigating away), and by
 * the transactions list, where it replaced an inline quick-add bar that pushed
 * the whole list down whenever it opened.
 *
 * A Sheet rather than an inline form, because on both pages the content behind
 * it is the thing the reader came for: an inline form shoves the KPI tiles — or
 * the first four rows of the list — down the moment it opens, so what you were
 * looking at moves while you are looking at it. A sheet leaves the page where
 * it is, and on a phone it arrives from the bottom, next to the thumb that
 * opened it.
 *
 * WHY THE ACTION DOES NOT REVALIDATE — this panel's one hard-won detail.
 *
 * `quickAddTransactionAction` deliberately calls no `revalidatePath`; this
 * component calls `router.refresh()` once the result has been applied instead.
 *
 * Revalidating from inside the action makes Next append the re-rendered
 * current route to the action's POST response. On /transactions the browser
 * applied that happily. On /dashboard it applied 31 DOM mutations and stopped:
 * the POST answered 200 in ~230ms with a clean server log, the browser then
 * aborted the response body, the action's return value never arrived, and the
 * button sat on "Adding…" indefinitely over a transaction that HAD been
 * written. Refreshing afterwards is an ordinary navigation request that cannot
 * take the action's own result down with it.
 *
 * That took a long time to find because it looked like a component bug. It was
 * documented here for two releases as "only happens inside a Sheet", which was
 * wrong — every test run at the time happened to be on the dashboard. Putting
 * the identical sheet on /transactions is what disproved it.
 *
 * It deliberately does NOT grow to cover splits, foreign amounts, attachments
 * or piggy-bank links. A quick-add that accretes fields until it matches the
 * full form is a worse copy of the full form, so the panel ends in a link to
 * the real one — a control, not a footnote at the end of a sentence.
 */

const TYPES = [
  {
    value: 'withdrawal',
    label: 'Spent',
    icon: ArrowUpRight,
    source: 'From account',
    destination: 'Paid to',
    tone: 'data-[on=true]:bg-expense-muted data-[on=true]:text-expense',
  },
  {
    value: 'deposit',
    label: 'Received',
    icon: ArrowDownLeft,
    source: 'Received from',
    destination: 'Into account',
    tone: 'data-[on=true]:bg-income-muted data-[on=true]:text-income',
  },
  {
    value: 'transfer',
    label: 'Moved',
    icon: ArrowLeftRight,
    source: 'From account',
    destination: 'To account',
    tone: 'data-[on=true]:bg-transfer-muted data-[on=true]:text-transfer',
  },
] as const;

export interface AddSheetAccount {
  id: string;
  name: string;
}

export function AddTransactionSheet({
  today,
  currency,
  assetAccounts,
  label = 'Add transaction',
  floating = true,
}: {
  today: string;
  currency: string;
  /** The user's own accounts, so the common case needs no lookup at all. */
  assetAccounts: AddSheetAccount[];
  /** The desktop button's text. "Add" where the heading already says what of. */
  label?: string;
  /**
   * Render the mobile floating button. On the dashboard it is the only way in;
   * on the transactions page the toolbar button is always on screen, and a
   * second trigger floating over the list would cover rows to duplicate a
   * control three centimetres away.
   */
  floating?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className={cn(floating && 'max-sm:hidden')}>
        <Plus className="size-4" aria-hidden="true" />
        {label}
      </Button>

      {/*
        The mobile trigger. `sm:hidden` rather than a second component: one
        state, one panel, and no chance of the two drifting apart.

        Bottom-right, above the safe-area inset so it clears the home indicator
        on a notched phone, and `data-print="hide"` because a floating button
        printed onto a statement is nonsense.
      */}
      {floating ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add transaction"
          data-print="hide"
          className={cn(
            'bg-primary text-primary-foreground fixed right-4 z-40 flex size-14 items-center justify-center',
            'rounded-full shadow-lg transition-transform active:scale-95 sm:hidden',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          )}
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      ) : null}

      <AddSheet
        open={open}
        onClose={() => setOpen(false)}
        today={today}
        currency={currency}
        assetAccounts={assetAccounts}
      />
    </>
  );
}

function AddSheet({
  open,
  onClose,
  today,
  currency,
  assetAccounts,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  currency: string;
  assetAccounts: AddSheetAccount[];
}) {
  /*
   * The third element. `useFormStatus` in a child reads the enclosing form's
   * submission, which is only the same thing when the form's `action` IS the
   * dispatcher — and it was not: an inline wrapper was setting the derived
   * fields before calling it, so React was tracking the wrapper, which returns
   * undefined, while the real action ran inside it. The button stuck on
   * "Adding…" forever even though the transaction had been written and the
   * POST had answered 200 in 233ms.
   *
   * The derived fields are hidden inputs now and the dispatcher is the form's
   * action, which is the shape React documents.
   */
  const [state, formAction, isPending] = useActionState<QuickAddState, FormData>(
    quickAddTransactionAction,
    {},
  );
  const [type, setType] = React.useState<string>('withdrawal');
  // Pre-filled with the first of the user's own accounts. Most entries come
  // from the same one, and an empty picker means a lookup before every single
  // transaction — the friction this whole panel exists to remove.
  const [account, setAccount] = React.useState(assetAccounts[0]?.name ?? '');
  const [counterparty, setCounterparty] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [saved, setSaved] = React.useState(0);

  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const amountRef = React.useRef<HTMLInputElement>(null);

  const shape = TYPES.find((entry) => entry.value === type) ?? TYPES[0];
  // A withdrawal leaves your account; a deposit arrives in it. So the field
  // holding YOUR account swaps sides, and the labels have to swap with it or
  // the form quietly asks for the wrong thing.
  const yourAccountIsSource = type !== 'deposit';

  React.useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    setCounterparty('');
    setCategory('');
    setSaved((n) => n + 1);
    // Back to the amount, not the description: the next entry starts with a
    // number, and this is the field a second entry begins in.
    amountRef.current?.focus();
    /*
     * The refresh the action deliberately no longer does — see the comment on
     * `quickAddTransactionAction`. It runs AFTER the result has been applied,
     * so a slow or aborted page re-render can no longer swallow the
     * confirmation of a write that already succeeded.
     */
    router.refresh();
  }, [state, router]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title="Add transaction"
      description="Recorded straight into your ledger."
      /*
       * A bottom sheet on a phone, a side panel from sm up.
       *
       * `sm:max-h-none` is load-bearing and was missed first time round: the
       * bottom variant caps at `max-h-[85svh]`, and without overriding it the
       * desktop panel stopped 15% short of the bottom of the window — a white
       * column ending in mid-air with the page showing through beneath it.
       * Every measurement passed; only the screenshot showed it.
       */
      panelClassName="sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-96 sm:max-w-[90vw] sm:rounded-none sm:border-t-0 sm:border-l"
      contentClassName="px-4 pb-4"
    >
      <form ref={formRef} action={formAction} className="space-y-4">
        {/* The derived values, as inputs rather than set in a wrapper — see the
            comment on useActionState above for what the wrapper cost. */}
        <input type="hidden" name="type" value={type} />
        <input
          type="hidden"
          name="source_name"
          value={yourAccountIsSource ? account : counterparty}
        />
        <input
          type="hidden"
          name="destination_name"
          value={yourAccountIsSource ? counterparty : account}
        />
        <input type="hidden" name="category_name" value={category} />
        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok && state.notice ? (
          <FormMessage tone="notice">
            {saved > 1 ? `${state.notice} · ${saved} added` : state.notice}
          </FormMessage>
        ) : null}

        {/* A segmented control, not a select: three options that change the
            rest of the form deserve to be visible rather than hidden behind a
            tap, and the colour is the same one the amount will be shown in. */}
        <div
          role="group"
          aria-label="Kind"
          className="bg-muted/60 grid grid-cols-3 gap-1 rounded-lg p-1"
        >
          {TYPES.map((entry) => {
            const Icon = entry.icon;
            const on = entry.value === type;
            return (
              <button
                key={entry.value}
                type="button"
                data-on={on}
                aria-pressed={on}
                onClick={() => setType(entry.value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  'data-[on=true]:shadow-sm',
                  entry.tone,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {entry.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qe-amount">Amount</Label>
          <CurrencyInput
            id="qe-amount"
            name="amount"
            ref={amountRef}
            required
            autoFocus
            currency={currency}
            placeholder="0.00"
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qe-description">Description</Label>
          <Input id="qe-description" name="description" required placeholder="Coffee" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qe-counterparty">{shape.destination}</Label>
          <Combobox
            id="qe-counterparty"
            endpoint="accounts"
            value={counterparty}
            onChange={setCounterparty}
            placeholder={shape.destination}
            allowFreeText
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qe-account">{shape.source}</Label>
            {/* A plain select when the accounts are already known — a lookup
                for a list of four is a spinner in place of an answer. Falls
                back to the picker if this connection has none loaded. */}
            {assetAccounts.length > 0 ? (
              <Select
                id="qe-account"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
              >
                {assetAccounts.map((entry) => (
                  <option key={entry.id} value={entry.name}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Combobox
                id="qe-account"
                endpoint="accounts"
                extraQuery={{ types: 'Asset account' }}
                value={account}
                onChange={setAccount}
                placeholder={shape.source}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qe-date">Date</Label>
            <Input id="qe-date" name="date" type="date" required defaultValue={today} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qe-category">Category</Label>
          <Combobox
            id="qe-category"
            endpoint="categories"
            value={category}
            onChange={setCategory}
            placeholder="Optional"
            allowFreeText
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <SaveButton pending={isPending} />
          <Button type="button" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>

        {/*
          The way out, not a footnote. This panel deliberately does not grow to
          cover splits, foreign amounts, attachments or a piggy-bank link — a
          quick-add that accretes fields until it matches the full form is just
          a worse copy of it — so the escape hatch has to be a control someone
          can find, not a sentence they read to the end of.
        */}
        <div className="space-y-3 border-t pt-3">
          <p className="text-muted-foreground text-xs">
            The panel stays open, so you can add another straight away.
          </p>
          <Link
            href="/transactions/new"
            className="hover:border-border hover:bg-accent/40 flex items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">Need splits or a receipt?</span>
              <span className="text-muted-foreground text-xs">Open the full form instead</span>
            </span>
            <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </form>
    </Sheet>
  );
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? 'Adding…' : 'Add transaction'}
    </Button>
  );
}
