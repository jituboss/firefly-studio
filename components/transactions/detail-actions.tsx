'use client';

import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import {
  deleteTransactionAction,
  duplicateTransactionAction,
} from '@/server/firefly/transaction-actions';
import { Button } from '@/components/ui/button';
import { ConvertDialog } from '@/app/(app)/transactions/[id]/convert-dialog';
import type { SplitLike } from '@/lib/transaction-convert';

function Pending({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending ? 'Working…' : children}
    </Button>
  );
}

/** E5-09 / E5-10 / E5-19 — edit, duplicate, change type, delete. */
export function TransactionDetailActions({
  id,
  description,
  splits,
}: {
  id: string;
  description: string;
  splits: SplitLike[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/transactions/${id}/edit`}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Link>
      </Button>

      <form action={duplicateTransactionAction}>
        <input type="hidden" name="id" value={id} />
        <Pending variant="outline" size="sm">
          <Copy className="size-4" aria-hidden="true" />
          Duplicate
        </Pending>
      </form>

      <ConvertDialog id={id} splits={splits} />

      <form action={deleteTransactionAction} className="ml-auto">
        <input type="hidden" name="id" value={id} />
        <ConfirmButton
          message={`Delete "${description}"? This cannot be undone.`}
          confirmLabel="Delete transaction"
          pendingLabel="Deleting…"
          variant="ghost"
          size="sm"
          className="text-expense"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </ConfirmButton>
      </form>
    </div>
  );
}
