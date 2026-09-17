'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createCurrencyAction,
  updateCurrencyAction,
  type CurrencyFormState,
} from '@/server/firefly/currency-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Currency } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function CurrencyForm({ currency }: { currency?: Currency }) {
  const editing = Boolean(currency);
  const [state, action] = useActionState<CurrencyFormState, FormData>(
    editing ? updateCurrencyAction : createCurrencyAction,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      {currency ? <input type="hidden" name="original" value={currency.attributes.code} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                required
                maxLength={12}
                defaultValue={currency?.attributes.code}
                placeholder="NOK"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                required
                maxLength={8}
                defaultValue={currency?.attributes.symbol}
                placeholder="kr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={currency?.attributes.name}
              placeholder="Norwegian krone"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decimal_places">Decimal places</Label>
            <Input
              id="decimal_places"
              name="decimal_places"
              type="number"
              min={0}
              max={12}
              defaultValue={currency?.attributes.decimal_places ?? 2}
            />
            <p className="text-muted-foreground text-xs">
              2 for most currencies, 0 for yen, 3 for dinar.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={currency ? currency.attributes.enabled : true}
              className="size-4"
            />
            Available to use
          </label>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save currency' : 'Create currency'} />
    </form>
  );
}
