'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteBudgetAction } from '@/server/firefly/budget-actions';

export function DeleteBudgetButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteBudgetAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${name}"? Transactions keep their history but lose this budget.`}
        confirmLabel="Delete budget"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete budget
      </ConfirmButton>
    </form>
  );
}
