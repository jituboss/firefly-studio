'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createPiggyBankAction,
  updatePiggyBankAction,
  type PiggyFormState,
} from '@/server/firefly/piggybank-actions';
import { Input, Label } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { FormMessage } from '@/components/auth/form-shell';
import type { PiggyBank } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E9-02 — one form for create and edit. */
export function PiggyForm({
  piggy,
  defaultCurrency = 'EUR',
  today,
}: {
  piggy?: PiggyBank;
  defaultCurrency?: string;
  /** Today in the user's timezone, resolved on the server. */
  today?: string;
}) {
  const editing = Boolean(piggy);
  const [state, action] = useActionState<PiggyFormState, FormData>(
    editing ? updatePiggyBankAction : createPiggyBankAction,
    {},
  );
  const a = piggy?.attributes;
  const account = a?.accounts[0];
  const [accountName, setAccountName] = useState(account?.name ?? '');
  const [accountId, setAccountId] = useState(account?.account_id ?? '');

  return (
    <form action={action} className="space-y-5">
      {piggy ? <input type="hidden" name="id" value={piggy.id} /> : null}
      {!piggy ? <input type="hidden" name="currency_code" value={defaultCurrency} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={a?.name} />
          </div>

          {!editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="account_id">Asset account</Label>
              <Combobox
                id="account_id"
                endpoint="accounts"
                extraQuery={{ types: 'Asset account' }}
                value={accountName}
                onChange={(value, option) => {
                  setAccountName(value);
                  setAccountId(option?.id ?? '');
                }}
                allowFreeText={false}
                placeholder="Search accounts…"
              />
              <input type="hidden" name="account_id" value={accountId} />
              <p className="text-muted-foreground text-xs">
                Which account holds this money. Firefly III does not allow changing this later.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="target_amount">Target amount</Label>
            <CurrencyInput
              id="target_amount"
              name="target_amount"
              required
              defaultValue={a?.target_amount ?? ''}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start date</Label>
              {/* Firefly rejects a piggy bank with no start date. */}
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                defaultValue={a?.start_date?.slice(0, 10) ?? today ?? ''}
              />
              <p className="text-muted-foreground text-xs">When you started saving.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Target date</Label>
              <Input
                id="target_date"
                name="target_date"
                type="date"
                defaultValue={a?.target_date?.slice(0, 10) ?? ''}
              />
              <p className="text-muted-foreground text-xs">Optional deadline.</p>
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

      <Submit label={editing ? 'Save changes' : 'Create piggy bank'} />
    </form>
  );
}
