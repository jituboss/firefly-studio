'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteAccountAction } from '@/server/firefly/account-actions';

export function DeleteAccountButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteAccountAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${name}" and all of its transactions? This cannot be undone.`}
        confirmLabel="Delete account"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete account
      </ConfirmButton>
    </form>
  );
}
