'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createAccountAction,
  updateAccountAction,
  type AccountFormState,
} from '@/server/firefly/account-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Account } from '@/server/firefly/types';

const SELECT =
  'border-input bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-60';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E4-04 — one form for create and edit. */
export function AccountForm({ account }: { account?: Account }) {
  const editing = Boolean(account);
  const [state, action] = useActionState<AccountFormState, FormData>(
    editing ? updateAccountAction : createAccountAction,
    {},
  );
  const [type, setType] = useState(account?.attributes.type ?? 'asset');
  const [role, setRole] = useState(account?.attributes.account_role ?? 'defaultAsset');

  const a = account?.attributes;

  return (
    <form action={action} className="space-y-5">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={a?.name} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={type}
                disabled={editing}
                onChange={(event) => setType(event.target.value as typeof type)}
                className={SELECT}
              >
                <option value="asset">Asset</option>
                <option value="expense">Expense</option>
                <option value="revenue">Revenue</option>
                <option value="liabilities">Liability</option>
              </select>
              {editing ? (
                <p className="text-muted-foreground text-xs">
                  Firefly III does not allow changing an account&apos;s type.
                </p>
              ) : null}
            </div>

            {type === 'asset' ? (
              <div className="space-y-1.5">
                <Label htmlFor="account_role">Role</Label>
                <select
                  id="account_role"
                  name="account_role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className={SELECT}
                >
                  <option value="defaultAsset">Default asset</option>
                  <option value="sharedAsset">Shared asset</option>
                  <option value="savingAsset">Savings</option>
                  <option value="ccAsset">Credit card</option>
                  <option value="cashWalletAsset">Cash wallet</option>
                </select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Currency</Label>
              <Input
                id="currency_code"
                name="currency_code"
                maxLength={3}
                placeholder="EUR"
                defaultValue={a?.currency_code ?? ''}
                className="uppercase"
              />
            </div>
          </div>

          {type === 'asset' && role === 'ccAsset' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="credit_card_type">Credit card type</Label>
                <select
                  id="credit_card_type"
                  name="credit_card_type"
                  defaultValue="monthlyFull"
                  className={SELECT}
                >
                  <option value="monthlyFull">Paid in full monthly</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly_payment_date">Monthly payment date</Label>
                <Input id="monthly_payment_date" name="monthly_payment_date" type="date" required />
                <p className="text-muted-foreground text-xs">
                  Firefly III requires both fields for credit-card accounts.
                </p>
              </div>
            </div>
          ) : null}

          {!editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="opening_balance">Opening balance</Label>
                <Input
                  id="opening_balance"
                  name="opening_balance"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opening_balance_date">Opening balance date</Label>
                <Input id="opening_balance_date" name="opening_balance_date" type="date" />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" name="iban" defaultValue={a?.iban ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bic">BIC</Label>
              <Input id="bic" name="bic" defaultValue={a?.bic ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_number">Account number</Label>
              <Input
                id="account_number"
                name="account_number"
                defaultValue={a?.account_number ?? ''}
              />
            </div>
          </div>

          {type === 'liabilities' ? (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="liability_type">Liability type</Label>
                <select
                  id="liability_type"
                  name="liability_type"
                  defaultValue={a?.liability_type ?? 'loan'}
                  className={SELECT}
                >
                  <option value="loan">Loan</option>
                  <option value="debt">Debt</option>
                  <option value="mortgage">Mortgage</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="liability_direction">Direction</Label>
                <select
                  id="liability_direction"
                  name="liability_direction"
                  defaultValue={a?.liability_direction ?? 'credit'}
                  className={SELECT}
                >
                  <option value="credit">I owe it</option>
                  <option value="debit">I am owed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interest">Interest %</Label>
                <Input
                  id="interest"
                  name="interest"
                  inputMode="decimal"
                  defaultValue={a?.interest ?? '0'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interest_period">Period</Label>
                <select
                  id="interest_period"
                  name="interest_period"
                  defaultValue={a?.interest_period ?? 'monthly'}
                  className={SELECT}
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
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

          <div className="flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={a?.active ?? true}
                className="size-4"
              />
              Active
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="include_net_worth"
                defaultChecked={a?.include_net_worth ?? true}
                className="size-4"
              />
              Include in net worth
            </label>
          </div>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save changes' : 'Create account'} />
    </form>
  );
}
