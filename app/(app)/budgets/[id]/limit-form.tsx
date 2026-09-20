'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus } from 'lucide-react';
import { saveBudgetLimitAction, type BudgetFormState } from '@/server/firefly/budget-actions';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/auth/form-shell';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E6-03 — create or edit one budget-limit period. */
export function LimitForm({
  budgetId,
  currency,
  limit,
  onDone,
}: {
  budgetId: string;
  currency: string;
  limit?: { id: string; start: string; end: string; amount: string };
  onDone?: () => void;
}) {
  const [state, action] = useActionState<BudgetFormState, FormData>(saveBudgetLimitAction, {});

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="space-y-3 rounded-lg border p-4"
    >
      <input type="hidden" name="budget_id" value={budgetId} />
      {limit ? <input type="hidden" name="limit_id" value={limit.id} /> : null}
      <input type="hidden" name="currency_code" value={currency} />
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor={`start-${limit?.id ?? 'new'}`} className="text-xs">
            Start
          </Label>
          <Input
            id={`start-${limit?.id ?? 'new'}`}
            name="start"
            type="date"
            required
            defaultValue={limit?.start.slice(0, 10)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`end-${limit?.id ?? 'new'}`} className="text-xs">
            End
          </Label>
          <Input
            id={`end-${limit?.id ?? 'new'}`}
            name="end"
            type="date"
            required
            defaultValue={limit?.end.slice(0, 10)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`amount-${limit?.id ?? 'new'}`} className="text-xs">
            Amount
          </Label>
          <CurrencyInput
            id={`amount-${limit?.id ?? 'new'}`}
            name="amount"
            required
            defaultValue={limit?.amount}
          />
        </div>
      </div>

      <Submit label={limit ? 'Save' : 'Add limit'} />
    </form>
  );
}

export function AddLimitButton({ budgetId, currency }: { budgetId: string; currency: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <LimitForm budgetId={budgetId} currency={currency} onDone={() => setOpen(false)} />;
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="size-4" aria-hidden="true" />
      Add a limit for another period
    </Button>
  );
}
