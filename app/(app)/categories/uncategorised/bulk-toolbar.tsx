'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { bulkSetCategoryAction, type BulkCategoryState } from '@/server/firefly/category-actions';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/auth/form-shell';

function Submit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || count === 0}>
      {pending ? 'Applying…' : `Set category on ${count}`}
    </Button>
  );
}

/**
 * E7-04 — sticky bulk-action bar: pick a category and apply it to every
 * selected transaction group.
 */
export function BulkToolbar({ selectedCount }: { selectedCount: number }) {
  const [category, setCategory] = React.useState('');
  const [state, action] = useActionState<BulkCategoryState, FormData>(bulkSetCategoryAction, {});

  React.useEffect(() => {
    if (state.ok) setCategory('');
  }, [state]);

  const formAction = (formData: FormData) => {
    formData.set('category_name', category);
    action(formData);
  };

  const count = selectedCount;

  return (
    <form action={formAction} className="bg-muted/50 sticky top-14 z-10 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[12rem] flex-1">
          <Combobox
            id="bulk-category"
            endpoint="categories"
            value={category}
            onChange={setCategory}
            placeholder="Pick or type a category…"
            allowFreeText
          />
        </div>
        <Submit count={count} />
        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      </div>
      <input type="hidden" name="category_name" value={category} />
    </form>
  );
}
