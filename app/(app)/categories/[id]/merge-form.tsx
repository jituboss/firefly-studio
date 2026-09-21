'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Merge } from 'lucide-react';
import { mergeCategoryAction } from '@/server/firefly/category-actions';
import type { CategoryFormState } from '@/server/firefly/category-actions';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { FormMessage } from '@/components/auth/form-shell';

/**
 * E7-05 — fold this category into another one.
 *
 * Duplicate categories are the commonest mess in an imported ledger
 * ("Groceries", "groceries", "Food shopping") and until now the app could not
 * fix one: you could rename or delete, and deleting left every transaction
 * uncategorised.
 *
 * Behind a confirmation because it is not reversible — there is no unmerge, and
 * the count is stated rather than implied so the consequence is a number rather
 * than a word.
 */
export function MergeCategoryForm({
  id,
  name,
  transactionCount,
}: {
  id: string;
  name: string;
  /** What the detail page already counted, so the dialog can be specific. */
  transactionCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState('');
  const [state, action] = useActionState<CategoryFormState, FormData>(mergeCategoryAction, {});

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Merge className="size-4" aria-hidden="true" />
        Merge into…
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Merge ${name}`}
        description="Every transaction filed here moves to the category you choose, and this one is deleted. There is no undo."
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="sourceId" value={id} />
          <input type="hidden" name="sourceName" value={name} />
          <input type="hidden" name="targetName" value={target} />

          {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

          <div className="space-y-1.5">
            <Label htmlFor="merge-target">Merge into</Label>
            <Combobox
              id="merge-target"
              endpoint="categories"
              value={target}
              onChange={setTarget}
              placeholder="Pick a category"
              /* The target has to exist. Creating a category by typo while
                 merging away another one would leave two messes. */
              allowFreeText={false}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            {transactionCount > 0
              ? `${transactionCount} transaction${transactionCount === 1 ? '' : 's'} in the period shown will be re-filed. Transactions outside it move too.`
              : 'No transactions in the period shown, but any outside it move too.'}
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Submit disabled={!target.trim()} name={name} />
          </div>
        </form>
      </Dialog>
    </>
  );
}

function Submit({ disabled, name }: { disabled: boolean; name: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? 'Merging…' : `Merge ${name}`}
    </Button>
  );
}
