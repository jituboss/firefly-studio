'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import {
  saveExchangeRateAction,
  deleteExchangeRateAction,
  type RateFormState,
} from '@/server/firefly/currency-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Record rate'}
    </Button>
  );
}

const selectClass = 'border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm';

/** E13-03 / E13-04 — record a rate for a pair on a date. */
export function RateForm({
  currencies,
  today,
  primary,
}: {
  currencies: Array<{ code: string; name: string }>;
  today: string;
  primary: string;
}) {
  const [state, action] = useActionState<RateFormState, FormData>(saveExchangeRateAction, {});

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Record a rate</p>
          <p className="text-muted-foreground text-sm">
            What one unit of the first currency was worth in the second, on that date.
          </p>
        </div>

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok ? <FormMessage tone="notice">Saved.</FormMessage> : null}

        <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="from">From</Label>
            <select id="from" name="from" defaultValue={primary} className={selectClass}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <select id="to" name="to" className={selectClass}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate">Rate</Label>
            <Input id="rate" name="rate" inputMode="decimal" placeholder="1.0850" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate-date">Date</Label>
            <Input id="rate-date" name="date" type="date" defaultValue={today} required />
          </div>
          <div className="flex items-end">
            <Submit />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteRateButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteExchangeRateAction}
      onSubmit={(event) => {
        if (!confirm(`Delete the ${label} rate?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" title="Delete this rate">
        <Trash2 className="size-4" aria-hidden="true" />
        <span className="sr-only">Delete</span>
      </Button>
    </form>
  );
}
