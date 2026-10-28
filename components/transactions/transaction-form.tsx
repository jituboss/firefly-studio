'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import {
  createTransactionAction,
  updateTransactionAction,
  type SplitInput,
  type TransactionFormState,
} from '@/server/firefly/transaction-actions';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { AccountPicker } from '@/components/transactions/account-picker';
import { FormMessage } from '@/components/auth/form-shell';
import { Amount } from '@/components/ui/amount';
import { add } from '@/lib/money';
import {
  FLOW_LABELS,
  KIND_LABELS,
  destinationKinds,
  kindFromFirefly,
  pairProblem,
  sourceKinds,
  type AccountKind,
} from '@/lib/account-matrix';
import { cn } from '@/lib/utils';

type TxType = 'withdrawal' | 'deposit' | 'transfer';

const EMPTY: SplitInput = {
  description: '',
  amount: '',
  source_name: '',
  source_id: '',
  source_kind: '',
  destination_name: '',
  destination_id: '',
  destination_kind: '',
  category_name: '',
  budget_name: '',
  bill_name: '',
  tags: '',
  notes: '',
  foreign_amount: '',
  foreign_currency_code: '',
  reconciled: false,
};

/**
 * Which kinds each side may hold comes from Firefly's own pair table
 * (`lib/account-matrix.ts`), narrowed by whatever the other side already
 * holds. This used to be a three-row map — asset→expense, revenue→asset,
 * asset→asset — which left every loan, debt, mortgage and the cash account out
 * of the pickers, so a withdrawal paid from a loan could not even be edited.
 *
 * When the other side holds something that cannot pair with this type at all,
 * the narrowing would leave nothing to pick; the side falls back to everything
 * the type allows and the form explains the mismatch instead.
 */
function sideKinds(type: TxType, split: SplitInput) {
  const sourceKind = kindFromFirefly(split.source_kind);
  const destinationKind = kindFromFirefly(split.destination_kind);
  const narrowedSource = sourceKinds(type, destinationKind);
  const narrowedDestination = destinationKinds(type, sourceKind);
  return {
    sourceKind,
    destinationKind,
    source: narrowedSource.length > 0 ? narrowedSource : sourceKinds(type),
    destination: narrowedDestination.length > 0 ? narrowedDestination : destinationKinds(type),
  };
}

function kindsHint(kinds: AccountKind[]): string {
  return kinds.map((kind) => KIND_LABELS[kind].toLowerCase()).join(', ');
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E5-06 / E5-07 / E5-08 — create and edit, including the split editor. */
export function TransactionForm({
  transactionId,
  initialType = 'withdrawal',
  initialDate,
  initialTime = '12:00',
  initialCurrency = 'EUR',
  initialGroupTitle = '',
  initialSplits,
}: {
  transactionId?: string;
  initialType?: TxType;
  initialDate: string;
  initialTime?: string;
  initialCurrency?: string;
  initialGroupTitle?: string;
  initialSplits?: SplitInput[];
}) {
  const editing = Boolean(transactionId);
  const [state, action] = useActionState<TransactionFormState, FormData>(
    editing ? updateTransactionAction : createTransactionAction,
    {},
  );

  const [type, setType] = React.useState<TxType>(initialType);
  const [splits, setSplits] = React.useState<SplitInput[]>(
    initialSplits && initialSplits.length > 0 ? initialSplits : [{ ...EMPTY }],
  );
  const [currency, setCurrency] = React.useState(initialCurrency);
  const [showForeign, setShowForeign] = React.useState(
    (initialSplits ?? []).some((split) => split.foreign_amount),
  );

  const total = add(...splits.map((split) => split.amount));

  function patch(index: number, changes: Partial<SplitInput>) {
    setSplits((current) =>
      current.map((split, i) => (i === index ? { ...split, ...changes } : split)),
    );
  }

  function addSplit() {
    // A new split inherits the accounts, which are almost always the same.
    const last = splits[splits.length - 1];
    setSplits((current) => [
      ...current,
      {
        ...EMPTY,
        source_name: last?.source_name ?? '',
        source_id: last?.source_id ?? '',
        source_kind: last?.source_kind ?? '',
        destination_name: last?.destination_name ?? '',
        destination_id: last?.destination_id ?? '',
        destination_kind: last?.destination_kind ?? '',
      },
    ]);
  }

  return (
    <form action={action} className="space-y-5">
      {transactionId ? <input type="hidden" name="id" value={transactionId} /> : null}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency_code" value={currency} />

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div
        role="tablist"
        aria-label="Transaction type"
        className="bg-muted flex gap-1 rounded-lg p-1"
      >
        {(['withdrawal', 'deposit', 'transfer'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={type === option}
            onClick={() => setType(option)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              type === option
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {/*
        Changing the type while editing is a conversion, and Firefly only
        performs one when both accounts fit the new type — otherwise it answers
        200 and changes nothing. The pickers below re-narrow to the new type and
        the action verifies the result, so this is safe to offer here rather
        than only behind the detail page's "Change type" dialog.
      */}
      {editing && type !== initialType ? (
        <p className="text-muted-foreground -mt-3 text-xs">
          Changing from {FLOW_LABELS[initialType].toLowerCase()} to{' '}
          {FLOW_LABELS[type].toLowerCase()}. Both accounts must fit the new type.
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required defaultValue={initialDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" defaultValue={initialTime} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                maxLength={3}
                className="uppercase"
              />
            </div>
          </div>

          {splits.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="group_title">Group title</Label>
              <Input
                id="group_title"
                name="group_title"
                defaultValue={initialGroupTitle}
                placeholder="What ties these splits together?"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {splits.map((split, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            {splits.length > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Split {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-expense"
                  onClick={() => setSplits((c) => c.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <div className="space-y-1.5">
                <Label htmlFor={`desc-${index}`}>Description</Label>
                <Input
                  id={`desc-${index}`}
                  name={`splits[${index}][description]`}
                  required
                  value={split.description}
                  onChange={(event) => patch(index, { description: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`amount-${index}`}>Amount</Label>
                <CurrencyInput
                  id={`amount-${index}`}
                  name={`splits[${index}][amount]`}
                  required
                  placeholder="0.00"
                  value={split.amount}
                  onChange={(event) => patch(index, { amount: event.target.value })}
                  className="text-right"
                />
              </div>
            </div>

            <SplitAccounts
              index={index}
              type={type}
              split={split}
              editing={editing}
              onPatch={(changes) => patch(index, changes)}
              onSwitchType={setType}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`cat-${index}`}>Category</Label>
                <Combobox
                  id={`cat-${index}`}
                  endpoint="categories"
                  value={split.category_name}
                  onChange={(value) => patch(index, { category_name: value })}
                />
                <input
                  type="hidden"
                  name={`splits[${index}][category_name]`}
                  value={split.category_name}
                />
              </div>
              {type === 'withdrawal' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor={`budget-${index}`}>Budget</Label>
                    <Combobox
                      id={`budget-${index}`}
                      endpoint="budgets"
                      value={split.budget_name}
                      onChange={(value) => patch(index, { budget_name: value })}
                    />
                    <input
                      type="hidden"
                      name={`splits[${index}][budget_name]`}
                      value={split.budget_name}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`bill-${index}`}>Subscription</Label>
                    <Combobox
                      id={`bill-${index}`}
                      endpoint="bills"
                      value={split.bill_name}
                      onChange={(value) => patch(index, { bill_name: value })}
                    />
                    <input
                      type="hidden"
                      name={`splits[${index}][bill_name]`}
                      value={split.bill_name}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`tags-${index}`}>Tags</Label>
              <Input
                id={`tags-${index}`}
                name={`splits[${index}][tags]`}
                value={split.tags}
                onChange={(event) => patch(index, { tags: event.target.value })}
                placeholder="Comma separated"
              />
            </div>

            {showForeign ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                <div className="space-y-1.5">
                  <Label htmlFor={`famount-${index}`}>Foreign amount</Label>
                  <CurrencyInput
                    id={`famount-${index}`}
                    name={`splits[${index}][foreign_amount]`}
                    value={split.foreign_amount}
                    onChange={(event) => patch(index, { foreign_amount: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`fcur-${index}`}>Currency</Label>
                  <Input
                    id={`fcur-${index}`}
                    name={`splits[${index}][foreign_currency_code]`}
                    maxLength={3}
                    className="uppercase"
                    value={split.foreign_currency_code}
                    onChange={(event) =>
                      patch(index, { foreign_currency_code: event.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor={`notes-${index}`}>Notes</Label>
              <textarea
                id={`notes-${index}`}
                name={`splits[${index}][notes]`}
                rows={2}
                value={split.notes}
                onChange={(event) => patch(index, { notes: event.target.value })}
                className="border-input bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`splits[${index}][reconciled]`}
                checked={split.reconciled}
                onChange={(event) => patch(index, { reconciled: event.target.checked })}
                className="size-4"
              />
              Reconciled
            </label>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addSplit}>
          <Plus className="size-4" aria-hidden="true" />
          Add split
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForeign((v) => !v)}>
          {showForeign ? 'Hide' : 'Add'} foreign currency
        </Button>

        {splits.length > 1 ? (
          <span className="text-muted-foreground ml-auto text-sm">
            Total{' '}
            <Amount value={total} currency={currency} showSign={false} tone="neutral" size="sm" />
          </span>
        ) : null}
      </div>

      <Submit label={editing ? 'Save changes' : 'Create transaction'} />
    </form>
  );
}

/**
 * The two account pickers of one split, plus the explanation when the pair
 * does not fit the chosen type — with a one-click way out when the pair IS
 * valid, just for another type, or would be with the sides swapped.
 */
function SplitAccounts({
  index,
  type,
  split,
  editing,
  onPatch,
  onSwitchType,
}: {
  index: number;
  type: TxType;
  split: SplitInput;
  editing: boolean;
  onPatch: (changes: Partial<SplitInput>) => void;
  onSwitchType: (type: TxType) => void;
}) {
  const kinds = sideKinds(type, split);
  const problem =
    kinds.sourceKind && kinds.destinationKind
      ? pairProblem(type, kinds.sourceKind, kinds.destinationKind)
      : null;
  const swapFixes =
    kinds.sourceKind && kinds.destinationKind
      ? pairProblem(type, kinds.destinationKind, kinds.sourceKind) === null
      : false;

  function swap() {
    onPatch({
      source_name: split.destination_name,
      source_id: split.destination_id,
      source_kind: split.destination_kind,
      destination_name: split.source_name,
      destination_id: split.source_id,
      destination_kind: split.source_kind,
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`source-${index}`}>From</Label>
          <AccountPicker
            id={`source-${index}`}
            kinds={kinds.source}
            value={{
              name: split.source_name,
              id: split.source_id,
              kind: kinds.sourceKind,
            }}
            onChange={(next) =>
              onPatch({ source_name: next.name, source_id: next.id, source_kind: next.kind ?? '' })
            }
          />
          <p className="text-muted-foreground text-xs">{kindsHint(kinds.source)}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`dest-${index}`}>To</Label>
          <AccountPicker
            id={`dest-${index}`}
            kinds={kinds.destination}
            value={{
              name: split.destination_name,
              id: split.destination_id,
              kind: kinds.destinationKind,
            }}
            onChange={(next) =>
              onPatch({
                destination_name: next.name,
                destination_id: next.id,
                destination_kind: next.kind ?? '',
              })
            }
          />
          <p className="text-muted-foreground text-xs">{kindsHint(kinds.destination)}</p>
        </div>
      </div>

      {/* The form posts ids when an account was picked from the list. */}
      {editing && split.transaction_journal_id ? (
        <input
          type="hidden"
          name={`splits[${index}][transaction_journal_id]`}
          value={split.transaction_journal_id}
        />
      ) : null}
      <input type="hidden" name={`splits[${index}][source_name]`} value={split.source_name} />
      <input type="hidden" name={`splits[${index}][source_id]`} value={split.source_id} />
      <input type="hidden" name={`splits[${index}][source_kind]`} value={split.source_kind} />
      <input
        type="hidden"
        name={`splits[${index}][destination_name]`}
        value={split.destination_name}
      />
      <input type="hidden" name={`splits[${index}][destination_id]`} value={split.destination_id} />
      <input
        type="hidden"
        name={`splits[${index}][destination_kind]`}
        value={split.destination_kind}
      />

      {problem ? (
        <div
          role="status"
          className="border-warning/40 bg-warning/10 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <span className="min-w-0 flex-1">{problem.message}</span>
          {problem.suggest ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSwitchType(problem.suggest as TxType)}
            >
              Make it a {FLOW_LABELS[problem.suggest].toLowerCase()}
            </Button>
          ) : null}
          {swapFixes ? (
            <Button type="button" size="sm" variant="outline" onClick={swap}>
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Swap sides
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
