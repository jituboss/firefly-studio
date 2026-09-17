'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { deleteTagAction } from '@/server/firefly/tag-actions';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete tag'}
    </Button>
  );
}

export function DeleteTagButton({ tag }: { tag: string }) {
  return (
    <form
      action={deleteTagAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${tag}"? Transactions keep their history but lose this tag.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tag" value={tag} />
      <Submit />
    </form>
  );
}
