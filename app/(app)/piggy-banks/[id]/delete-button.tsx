'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deletePiggyBankAction } from '@/server/firefly/piggybank-actions';

export function DeletePiggyButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deletePiggyBankAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${name}"? This cannot be undone.`}
        confirmLabel="Delete piggy bank"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete piggy bank
      </ConfirmButton>
    </form>
  );
}
