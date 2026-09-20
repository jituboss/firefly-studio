'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteRuleGroupAction } from '@/server/firefly/rule-actions';

export function DeleteRuleGroupButton({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count: number;
}) {
  return (
    <form action={deleteRuleGroupAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={
          count > 0
            ? `Delete "${title}" and the ${count} rule${count === 1 ? '' : 's'} inside it?`
            : `Delete "${title}"?`
        }
        confirmLabel="Delete group"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete group
      </ConfirmButton>
    </form>
  );
}
