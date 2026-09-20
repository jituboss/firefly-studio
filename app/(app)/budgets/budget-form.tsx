'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createBudgetAction,
  updateBudgetAction,
  type BudgetFormState,
} from '@/server/firefly/budget-actions';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Budget } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E6-02 — one form for create and edit. */
export function BudgetForm({
  budget,
  defaultCurrency,
}: {
  budget?: Budget;
  defaultCurrency: string;
}) {
  const editing = Boolean(budget);
  const [state, action] = useActionState<BudgetFormState, FormData>(
    editing ? updateBudgetAction : createBudgetAction,
    {},
  );
  const a = budget?.attributes;
  const [autoType, setAutoType] = useState(a?.auto_budget_type ?? 'none');

  return (
    <form action={action} className="space-y-5">
      {budget ? <input type="hidden" name="id" value={budget.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={a?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auto_budget_type">Auto-budget</Label>
            <Select
              id="auto_budget_type"
              name="auto_budget_type"
              value={autoType ?? 'none'}
              onChange={(event) => setAutoType(event.target.value)}
            >
              <option value="none">None — set limits manually</option>
              <option value="reset">Reset each period</option>
              <option value="rollover">Rollover unused amount</option>
            </Select>
          </div>

          {autoType && autoType !== 'none' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="auto_budget_amount">Amount per period</Label>
                <CurrencyInput
                  id="auto_budget_amount"
                  name="auto_budget_amount"
                  defaultValue={a?.auto_budget_amount ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auto_budget_period">Period</Label>
                <Select
                  id="auto_budget_period"
                  name="auto_budget_period"
                  defaultValue={a?.auto_budget_period ?? 'monthly'}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>
              <input type="hidden" name="auto_budget_currency_code" value={defaultCurrency} />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={a?.notes ?? ''}
              className="border-input bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={a?.active ?? true}
              className="size-4"
            />
            Active
          </label>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save changes' : 'Create budget'} />
    </form>
  );
}
