'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createRecurrenceAction,
  updateRecurrenceAction,
  type RecurrenceFormState,
} from '@/server/firefly/recurrence-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Recurrence } from '@/server/firefly/types';

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

const REPETITIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'ndom', label: 'Nth weekday of the month' },
  { value: 'yearly', label: 'Every year' },
] as const;

const WEEKDAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
] as const;

/** Firefly's weekend handling codes. */
const WEEKEND = [
  { value: '1', label: 'Do nothing special' },
  { value: '2', label: 'Skip it entirely' },
  { value: '3', label: 'Move it to the Friday before' },
  { value: '4', label: 'Move it to the Monday after' },
] as const;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

const selectClass = 'border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm';

/** E10-02 — the most complex form in the app. */
export function RecurrenceForm({
  recurrence,
  assetAccounts,
  expenseAccounts,
  revenueAccounts,
  currencies,
}: {
  recurrence?: Recurrence;
  assetAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  revenueAccounts: AccountOption[];
  currencies: Array<{ code: string; name: string }>;
}) {
  const editing = Boolean(recurrence);
  const [state, action] = useActionState<RecurrenceFormState, FormData>(
    editing ? updateRecurrenceAction : createRecurrenceAction,
    {},
  );

  const existingRepetition = recurrence?.attributes.repetitions[0];
  const existingTransaction = recurrence?.attributes.transactions[0];

  const [type, setType] = useState<'withdrawal' | 'deposit' | 'transfer'>(
    recurrence?.attributes.type ?? 'withdrawal',
  );
  const [repetitionType, setRepetitionType] = useState<string>(
    existingRepetition?.type ?? 'monthly',
  );
  // Firefly has no "runs forever": it requires exactly one of a repetition
  // count or an end date, and rejects both together as firmly as neither. So
  // the choice here is between the two, never none.
  const [endMode, setEndMode] = useState<'count' | 'date'>(
    recurrence?.attributes.repeat_until ? 'date' : 'count',
  );

  // A withdrawal leaves an asset account for an expense account; a deposit
  // arrives from a revenue account; a transfer moves between asset accounts.
  const sources = type === 'deposit' ? revenueAccounts : assetAccounts;
  const destinations =
    type === 'withdrawal' ? expenseAccounts : type === 'transfer' ? assetAccounts : assetAccounts;

  return (
    <form action={action} className="space-y-5">
      {recurrence ? <input type="hidden" name="id" value={recurrence.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={recurrence?.attributes.title}
              placeholder="Rent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Kind</Label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className={selectClass}
              >
                <option value="withdrawal">Money going out</option>
                <option value="deposit">Money coming in</option>
                <option value="transfer">Between my accounts</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="first_date">First date</Label>
              <Input
                id="first_date"
                name="first_date"
                type="date"
                required
                defaultValue={recurrence?.attributes.first_date?.slice(0, 10)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-medium">How often</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="repetition_type">Repeats</Label>
              <select
                id="repetition_type"
                name="repetition_type"
                value={repetitionType}
                onChange={(event) => setRepetitionType(event.target.value)}
                className={selectClass}
              >
                {REPETITIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moment">
                {repetitionType === 'monthly'
                  ? 'Day of the month'
                  : repetitionType === 'weekly'
                    ? 'Day of the week'
                    : repetitionType === 'yearly'
                      ? 'Date each year'
                      : repetitionType === 'ndom'
                        ? 'Which weekday (e.g. 2,3 = 2nd Wednesday)'
                        : 'Nothing to set'}
              </Label>
              {repetitionType === 'weekly' ? (
                <select
                  id="moment"
                  name="moment"
                  defaultValue={existingRepetition?.moment ?? '1'}
                  className={selectClass}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              ) : repetitionType === 'daily' ? (
                <p className="text-muted-foreground px-1 py-2 text-xs">
                  Daily repeats have nothing more to set.
                </p>
              ) : (
                <Input
                  id="moment"
                  name="moment"
                  defaultValue={existingRepetition?.moment ?? '1'}
                  placeholder={repetitionType === 'yearly' ? '2026-01-31' : '1'}
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="skip">Skip every</Label>
              <Input
                id="skip"
                name="skip"
                type="number"
                min={0}
                defaultValue={existingRepetition?.skip ?? 0}
              />
              <p className="text-muted-foreground text-xs">
                0 means never skip. 1 makes a weekly repeat fortnightly.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekend">If it lands on a weekend</Label>
              <select
                id="weekend"
                name="weekend"
                defaultValue={String(existingRepetition?.weekend ?? '1')}
                className={selectClass}
              >
                {WEEKEND.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_mode">Until</Label>
            <select
              id="end_mode"
              name="end_mode"
              value={endMode}
              onChange={(event) => setEndMode(event.target.value as typeof endMode)}
              className={selectClass}
            >
              <option value="count">A set number of times</option>
              <option value="date">A date</option>
            </select>
            <p className="text-muted-foreground text-xs">
              Firefly needs one or the other — a recurring transaction cannot run forever. Set a
              far-off date if you want it effectively open ended.
            </p>
            {/* Rejects both together and rejects neither, so only the chosen
                one is rendered and therefore only it is posted. */}
            {endMode === 'count' ? (
              <Input
                name="nr_of_repetitions"
                type="number"
                min={1}
                defaultValue={recurrence?.attributes.nr_of_repetitions ?? 12}
                aria-label="Number of times"
              />
            ) : null}
            {endMode === 'date' ? (
              <Input
                name="repeat_until"
                type="date"
                defaultValue={recurrence?.attributes.repeat_until?.slice(0, 10) ?? ''}
                aria-label="Repeat until"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-medium">What it creates</p>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={existingTransaction?.description ?? ''}
              placeholder="Monthly rent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                required
                inputMode="decimal"
                defaultValue={existingTransaction?.amount ?? ''}
                placeholder="1200.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Currency</Label>
              <select
                id="currency_code"
                name="currency_code"
                defaultValue={existingTransaction?.currency_code ?? ''}
                className={selectClass}
              >
                <option value="">Default</option>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="source_id">From</Label>
              <select
                id="source_id"
                name="source_id"
                defaultValue={existingTransaction?.source_id ?? ''}
                className={selectClass}
              >
                <option value="">Pick an account</option>
                {sources.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination_id">To</Label>
              <select
                id="destination_id"
                name="destination_id"
                defaultValue={existingTransaction?.destination_id ?? ''}
                className={selectClass}
              >
                <option value="">Pick an account</option>
                {destinations.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category_name">Category</Label>
              <Input
                id="category_name"
                name="category_name"
                defaultValue={existingTransaction?.category_name ?? ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={existingTransaction?.tags?.join(', ') ?? ''}
                placeholder="comma, separated"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={recurrence ? recurrence.attributes.active : true}
              className="size-4"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="apply_rules"
              defaultChecked={recurrence ? recurrence.attributes.apply_rules : true}
              className="size-4"
            />
            Run my rules against each transaction it creates
          </label>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save changes' : 'Create'} />
    </form>
  );
}
