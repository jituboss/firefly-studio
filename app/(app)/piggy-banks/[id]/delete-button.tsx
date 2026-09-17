'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deletePiggyBankAction } from '@/server/firefly/piggybank-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete piggy bank'}
    </Button>
  );
}

export function DeletePiggyButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deletePiggyBankAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
