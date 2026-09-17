'use client';

import * as React from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { FormMessage } from '@/components/auth/form-shell';
import {
  quickAddTransactionAction,
  type QuickAddState,
} from '@/server/firefly/transaction-actions';

/**
 * E5-13 — the quick-add bar.
 *
 * For entering a run of simple transactions without a round trip through the
 * full form. It stays open and clears itself after each save, and focus returns
 * to the description, because the whole point is typing several in a row.
 *
 * It does NOT grow to cover splits, foreign amounts or attachments. A quick-add
 * that accretes fields until it matches the full form is just a worse copy of
 * it; those cases go to /transactions/new.
 */

const TYPES = [
  { value: 'withdrawal', label: 'Spent', source: 'Asset account', destination: 'Payee' },
  { value: 'deposit', label: 'Received', source: 'Payer', destination: 'Asset account' },
  { value: 'transfer', label: 'Moved', source: 'From account', destination: 'To account' },
] as const;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Adding…' : 'Add'}
    </Button>
  );
}

export function QuickAdd({ today }: { today: string }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState<QuickAddState, FormData>(quickAddTransactionAction, {});

  const [type, setType] = React.useState<string>('withdrawal');
  const [source, setSource] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [category, setCategory] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const descriptionRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!state.ok) return;
    // Keep the accounts: the next entry is usually from the same account. Clear
    // what is genuinely per-transaction.
    formRef.current?.reset();
    setCategory('');
    descriptionRef.current?.focus();
  }, [state]);

  const shape = TYPES.find((entry) => entry.value === type) ?? TYPES[0];

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Quick add
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formData.set('type', type);
        formData.set('source_name', source);
        formData.set('destination_name', destination);
        formData.set('category_name', category);
        action(formData);
      }}
      className="bg-card min-w-0 space-y-3 rounded-xl border p-3"
    >
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.notice ? <FormMessage tone="notice">{state.notice}</FormMessage> : null}

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="qa-type">Kind</Label>
          <select
            id="qa-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            {TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-description">Description</Label>
          <Input id="qa-description" name="description" ref={descriptionRef} required autoFocus />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-amount">Amount</Label>
          <Input
            id="qa-amount"
            name="amount"
            required
            inputMode="decimal"
            placeholder="12.50"
            className="tabular"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-date">Date</Label>
          <Input id="qa-date" name="date" type="date" required defaultValue={today} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-source">{shape.source}</Label>
          <Combobox
            id="qa-source"
            endpoint="accounts"
            value={source}
            onChange={setSource}
            placeholder={shape.source}
            allowFreeText
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-destination">{shape.destination}</Label>
          <Combobox
            id="qa-destination"
            endpoint="accounts"
            value={destination}
            onChange={setDestination}
            placeholder={shape.destination}
            allowFreeText
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qa-category">Category (optional)</Label>
          <Combobox
            id="qa-category"
            endpoint="categories"
            value={category}
            onChange={setCategory}
            placeholder="Category"
            allowFreeText
          />
        </div>

        <div className="flex items-end gap-2">
          <Submit />
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="size-4" aria-hidden="true" />
            Close
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Accounts stay filled in after saving, so a run of entries from the same account is quick.
        Splits, foreign amounts and receipts need the{' '}
        <Link href="/transactions/new" className="hover:text-primary underline underline-offset-2">
          full form
        </Link>
        .
      </p>
    </form>
  );
}
