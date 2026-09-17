'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deleteRuleGroupAction } from '@/server/firefly/rule-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete group'}
    </Button>
  );
}

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
    <form
      action={deleteRuleGroupAction}
      onSubmit={(event) => {
        const warning =
          count > 0
            ? `Delete "${title}" and the ${count} rule${count === 1 ? '' : 's'} inside it?`
            : `Delete "${title}"?`;
        if (!confirm(warning)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
