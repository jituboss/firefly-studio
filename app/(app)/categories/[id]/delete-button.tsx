'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deleteCategoryAction } from '@/server/firefly/category-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete category'}
    </Button>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${name}"? Transactions keep their history but lose this category.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
