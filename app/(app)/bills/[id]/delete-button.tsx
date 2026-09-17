'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deleteBillAction } from '@/server/firefly/bill-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete subscription'}
    </Button>
  );
}

export function DeleteBillButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteBillAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${name}"?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
