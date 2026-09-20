'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteBillAction } from '@/server/firefly/bill-actions';

export function DeleteBillButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteBillAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${name}"?`}
        confirmLabel="Delete subscription"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete subscription
      </ConfirmButton>
    </form>
  );
}
