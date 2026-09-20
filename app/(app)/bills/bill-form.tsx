'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createBillAction,
  updateBillAction,
  type BillFormState,
} from '@/server/firefly/bill-actions';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Bill } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E8-02 — one form for create and edit. */
export function BillForm({ bill, defaultCurrency }: { bill?: Bill; defaultCurrency: string }) {
  const editing = Boolean(bill);
  const [state, action] = useActionState<BillFormState, FormData>(
    editing ? updateBillAction : createBillAction,
    {},
  );
  const a = bill?.attributes;

  return (
    <form action={action} className="space-y-5">
      {bill ? <input type="hidden" name="id" value={bill.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={a?.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount_min">Min amount</Label>
              <CurrencyInput
                id="amount_min"
                name="amount_min"
                required
                defaultValue={a?.amount_min}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount_max">Max amount</Label>
              <CurrencyInput
                id="amount_max"
                name="amount_max"
                required
                defaultValue={a?.amount_max}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Currency</Label>
              <Input
                id="currency_code"
                name="currency_code"
                maxLength={3}
                className="uppercase"
                defaultValue={a?.currency_code ?? defaultCurrency}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">First due date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={a?.date.slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repeat_freq">Repeats</Label>
              <Select
                id="repeat_freq"
                name="repeat_freq"
                defaultValue={a?.repeat_freq ?? 'monthly'}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-year">Half-yearly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End date (optional)</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={a?.end_date?.slice(0, 10) ?? ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skip">Skip every N occurrences</Label>
              <Input id="skip" name="skip" type="number" min={0} defaultValue={a?.skip ?? 0} />
            </div>
          </div>

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

      <Submit label={editing ? 'Save changes' : 'Create subscription'} />
    </form>
  );
}
