'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { deleteTagAction } from '@/server/firefly/tag-actions';

export function DeleteTagButton({ tag }: { tag: string }) {
  return (
    <form action={deleteTagAction}>
      <input type="hidden" name="tag" value={tag} />
      <ConfirmButton
        message={`Delete "${tag}"? Transactions keep their history but lose this tag.`}
        confirmLabel="Delete tag"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete tag
      </ConfirmButton>
    </form>
  );
}
