'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import {
  createSavedViewAction,
  deleteSavedViewAction,
  type SavedViewState,
} from '@/server/saved-views-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/auth/form-shell';
import type { savedViews } from '@/server/db/schema';

type SavedView = typeof savedViews.$inferSelect;

/** E5-04 — save, load and delete transaction filter presets. */
export function SavedViews({
  views,
  currentQuery,
}: {
  views: SavedView[];
  currentQuery: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [state, action] = React.useActionState<SavedViewState, FormData>(createSavedViewAction, {});

  const pinned = views.filter((v) => v.isPinned);
  const others = views.filter((v) => !v.isPinned);

  function apply(view: SavedView) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(view.query)) {
      if (typeof value === 'string' && value) next.set(key, value);
    }
    // Preserve the range if the view didn't set one.
    const range = params.get('range');
    if (range && !view.query.range) next.set('range', range);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pinned.map((view) => (
        <Button
          key={view.id}
          variant="outline"
          size="sm"
          onClick={() => apply(view)}
          className="h-8"
        >
          <Bookmark className="size-3.5" aria-hidden="true" />
          {view.name}
        </Button>
      ))}

      {open ? (
        <form
          action={action}
          onSubmit={() => {
            if (name.trim()) {
              setName('');
              setOpen(false);
            }
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="entity" value="transactions" />
          <input
            type="hidden"
            name="query"
            value={JSON.stringify({
              q: currentQuery.q,
              type: currentQuery.type,
              account: currentQuery.account,
            })}
          />
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name"
            className="h-8 w-40 text-sm"
            required
          />
          <Button type="submit" size="sm" className="h-8">
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        </form>
      ) : (
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Save view
        </Button>
      )}

      {others.length > 0 || pinned.length > 0 ? (
        <select
          aria-label="Load saved view"
          value=""
          onChange={(e) => {
            const view = views.find((v) => v.id === e.target.value);
            if (view) apply(view);
          }}
          className="border-input bg-background h-8 rounded-md border px-2 text-xs"
        >
          <option value="">Load view…</option>
          {others.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      ) : null}

      {views.length > 0 ? <DeleteViewMenu views={views} /> : null}
    </div>
  );
}

function DeleteViewMenu({ views }: { views: SavedView[] }) {
  const [state, action] = React.useActionState(deleteSavedViewAction, {});

  return (
    <form action={action} className="flex items-center gap-2">
      <select
        name="id"
        aria-label="Delete saved view"
        defaultValue=""
        required
        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
      >
        <option value="" disabled>
          Delete view…
        </option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="ghost" size="icon" className="text-expense h-8 w-8">
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
    </form>
  );
}
