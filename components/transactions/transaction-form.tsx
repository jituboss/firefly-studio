'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
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
import { FormMessage } from '@/components/auth/form-shell';
import { Amount } from '@/components/ui/amount';
import { add } from '@/lib/money';
import { cn } from '@/lib/utils';

type TxType = 'withdrawal' | 'deposit' | 'transfer';

const EMPTY: SplitInput = {
  description: '',
  amount: '',
  source_name: '',
  destination_name: '',
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
 * Firefly types each side of a transaction by its kind: a withdrawal leaves an
 * asset account for an expense account, a deposit is the reverse, a transfer
 * moves between two asset accounts. The autocomplete is filtered accordingly.
 */
const ACCOUNT_TYPES: Record<TxType, { source: string; destination: string }> = {
  withdrawal: { source: 'Asset account', destination: 'Expense account' },
  deposit: { source: 'Revenue account', destination: 'Asset account' },
  transfer: { source: 'Asset account', destination: 'Asset account' },
};

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
  const labels = ACCOUNT_TYPES[type];

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
        destination_name: last?.destination_name ?? '',
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
            disabled={editing}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              type === option
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              editing && 'cursor-not-allowed opacity-60',
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {editing ? (
        <p className="text-muted-foreground -mt-3 text-xs">
          Firefly III does not allow changing a transaction&apos;s type after creation.
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`source-${index}`}>From ({labels.source})</Label>
                <Combobox
                  id={`source-${index}`}
                  endpoint="accounts"
                  extraQuery={{ types: labels.source }}
                  value={split.source_name}
                  onChange={(value) => patch(index, { source_name: value })}
                  placeholder="Search accounts…"
                />
                <input
                  type="hidden"
                  name={`splits[${index}][source_name]`}
                  value={split.source_name}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`dest-${index}`}>To ({labels.destination})</Label>
                <Combobox
                  id={`dest-${index}`}
                  endpoint="accounts"
                  extraQuery={{ types: labels.destination }}
                  value={split.destination_name}
                  onChange={(value) => patch(index, { destination_name: value })}
                  placeholder="Search or type a new name…"
                />
                <input
                  type="hidden"
                  name={`splits[${index}][destination_name]`}
                  value={split.destination_name}
                />
              </div>
            </div>

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
