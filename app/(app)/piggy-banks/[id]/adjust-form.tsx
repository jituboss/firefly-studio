'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { adjustPiggyBankAction, type PiggyFormState } from '@/server/firefly/piggybank-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/auth/form-shell';

function Submit({ label, variant }: { label: string; variant: 'default' | 'outline' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/**
 * E9-03 — add or remove money.
 *
 * Two independent forms rather than one form with a client-toggled "direction"
 * field: relying on a click handler to flip state before the browser's native
 * form submission reads the DOM is timing-fragile. A static hidden input per
 * form has no such race.
 */
export function AdjustForm({ piggyId, accountId }: { piggyId: string; accountId: string }) {
  const [addState, addAction] = useActionState<PiggyFormState, FormData>(adjustPiggyBankAction, {});
  const [removeState, removeAction] = useActionState<PiggyFormState, FormData>(
    adjustPiggyBankAction,
    {},
  );

  const error = addState.error ?? removeState.error;

  return (
    <div className="space-y-3">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="flex flex-wrap items-end gap-3">
        <form action={addAction} className="flex items-end gap-2">
          <input type="hidden" name="id" value={piggyId} />
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="direction" value="add" />
          <div className="space-y-1.5">
            <Label htmlFor="add-amount" className="text-xs">
              Amount to add
            </Label>
            <Input
              id="add-amount"
              name="amount"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="w-32"
            />
          </div>
          <Submit label="Add" variant="default" />
        </form>

        <form action={removeAction} className="flex items-end gap-2">
          <input type="hidden" name="id" value={piggyId} />
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="direction" value="remove" />
          <div className="space-y-1.5">
            <Label htmlFor="remove-amount" className="text-xs">
              Amount to remove
            </Label>
            <Input
              id="remove-amount"
              name="amount"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="w-32"
            />
          </div>
          <Submit label="Remove" variant="outline" />
        </form>
      </div>
    </div>
  );
}
