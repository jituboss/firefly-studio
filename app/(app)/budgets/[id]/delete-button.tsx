'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deleteBudgetAction } from '@/server/firefly/budget-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete budget'}
    </Button>
  );
}

export function DeleteBudgetButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteBudgetAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${name}"? Transactions keep their history but lose this budget.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
