'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from '@/server/firefly/category-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Category } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E7-02 — one form for create and edit. */
export function CategoryForm({ category }: { category?: Category }) {
  const editing = Boolean(category);
  const [state, action] = useActionState<CategoryFormState, FormData>(
    editing ? updateCategoryAction : createCategoryAction,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={category?.attributes.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={category?.attributes.notes ?? ''}
              className="border-input bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save changes' : 'Create category'} />
    </form>
  );
}
