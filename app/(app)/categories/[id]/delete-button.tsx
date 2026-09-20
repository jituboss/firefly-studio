'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteCategoryAction } from '@/server/firefly/category-actions';

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteCategoryAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${name}"? Transactions keep their history but lose this category.`}
        confirmLabel="Delete category"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete category
      </ConfirmButton>
    </form>
  );
}
