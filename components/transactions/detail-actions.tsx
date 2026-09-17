'use client';

import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import {
  deleteTransactionAction,
  duplicateTransactionAction,
} from '@/server/firefly/transaction-actions';
import { Button } from '@/components/ui/button';

function Pending({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending ? 'Working…' : children}
    </Button>
  );
}

/** E5-09 / E5-10 — edit, duplicate, delete. */
export function TransactionDetailActions({ id, description }: { id: string; description: string }) {
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

      <form
        action={deleteTransactionAction}
        onSubmit={(event) => {
          if (!confirm(`Delete "${description}"? This cannot be undone.`)) event.preventDefault();
        }}
        className="ml-auto"
      >
        <input type="hidden" name="id" value={id} />
        <Pending variant="ghost" size="sm" className="text-expense">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Pending>
      </form>
    </div>
  );
}
