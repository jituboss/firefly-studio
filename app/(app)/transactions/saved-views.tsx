'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, BookmarkCheck, Check, Plus, Trash2 } from 'lucide-react';
import {
  createSavedViewAction,
  deleteSavedViewAction,
  type SavedViewState,
} from '@/server/saved-views-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover } from '@/components/ui/popover';
import { ConfirmButton } from '@/components/ui/confirm';
import { FormMessage } from '@/components/auth/form-shell';
import { cn } from '@/lib/utils';
import type { savedViews } from '@/server/db/schema';

type SavedView = typeof savedViews.$inferSelect;

/**
 * E5-04 — save, load and delete transaction filter presets.
 *
 * **One control, not four.** This used to render a chip per pinned view, a
 * "Save view" button, a "Load view…" `<select>` and a "Delete view…" `<select>`
 * with its own bin icon — five controls for a feature most people use twice a
 * month, laid out across the filter bar and wrapping onto a second and third
 * row on a phone. Two bare selects sitting in a toolbar also read as filters
 * rather than as a menu, which is what made the bar look unfinished.
 *
 * Everything lives behind a single labelled button now. The button names the
 * view in effect when one matches the current filters, so the thing the row
 * used to shout is still answerable at a glance — "am I looking at a saved
 * view, and which?" — in one control's worth of space.
 */
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

  /**
   * The view whose filters are the ones on screen, if any.
   *
   * Compared on the three keys a view stores rather than on the whole URL: the
   * date range and the page number are not part of a view, and treating them as
   * part of it would mean paging to page 2 stopped calling it "EBL Visa".
   */
  const active = views.find((view) =>
    (['q', 'type', 'account'] as const).every((key) => {
      const saved = typeof view.query[key] === 'string' ? (view.query[key] as string) : '';
      return (currentQuery[key] ?? '') === saved;
    }),
  );

  const savable = Boolean(currentQuery.q || currentQuery.type || currentQuery.account);

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
    <Popover
      align="end"
      label="Saved views"
      contentClassName="w-72"
      trigger={(props) => (
        <Button
          {...props}
          type="button"
          variant={active ? 'secondary' : 'outline'}
          size="sm"
          className="h-9 max-w-[10rem] shrink-0 max-sm:w-9 max-sm:px-0"
        >
          {active ? (
            <BookmarkCheck className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Bookmark className="size-4 shrink-0" aria-hidden="true" />
          )}
          {/* The label is the one thing worth ~60px on a phone's toolbar, and
              it is not: the glyph is the same one every app uses for this. */}
          <span className="truncate max-sm:sr-only">{active ? active.name : 'Views'}</span>
        </Button>
      )}
    >
      {(close) => (
        <ViewsPanel
          views={views}
          activeId={active?.id}
          savable={savable}
          currentQuery={currentQuery}
          onApply={(view) => {
            apply(view);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function ViewsPanel({
  views,
  activeId,
  savable,
  currentQuery,
  onApply,
}: {
  views: SavedView[];
  activeId?: string;
  savable: boolean;
  currentQuery: Record<string, string | undefined>;
  onApply: (view: SavedView) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState('');
  const [created, createAction] = React.useActionState<SavedViewState, FormData>(
    createSavedViewAction,
    {},
  );
  const [removed, deleteAction] = React.useActionState<SavedViewState, FormData>(
    deleteSavedViewAction,
    {},
  );

  // A saved view revalidates the page and arrives in `views` on the next
  // render; leaving the form open would invite saving it twice.
  React.useEffect(() => {
    if (!created.error) {
      setSaving(false);
      setName('');
    }
  }, [created]);

  return (
    <div className="text-sm">
      <p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
        Saved views
      </p>

      {views.length === 0 ? (
        <p className="text-muted-foreground px-3 pb-2 text-xs leading-relaxed">
          Filter the list, then save it here to come back to it in one click.
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto p-1">
          {views.map((view) => (
            <li key={view.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onApply(view)}
                className={cn(
                  'hover:bg-accent flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left',
                  view.id === activeId && 'font-medium',
                )}
              >
                <Check
                  className={cn('size-3.5 shrink-0', view.id !== activeId && 'invisible')}
                  aria-hidden="true"
                />
                <span className="truncate">{view.name}</span>
              </button>
              {/* Inside the row rather than behind a second "Delete view…"
                  picker: the thing being deleted is the row you are pointing
                  at, which is the only unambiguous way to say it. */}
              <form action={deleteAction} className="shrink-0">
                <input type="hidden" name="id" value={view.id} />
                <ConfirmButton
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-expense size-8"
                  aria-label={`Delete view ${view.name}`}
                  message={`Delete the saved view “${view.name}”? The transactions it shows are not affected.`}
                  title="Delete saved view"
                  confirmLabel="Delete"
                  pendingLabel="Deleting…"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t p-1">
        {saving ? (
          <form action={createAction} className="space-y-2 p-2">
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
            <label className="sr-only" htmlFor="saved-view-name">
              View name
            </label>
            <Input
              id="saved-view-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name this view"
              autoFocus
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={!name.trim()}>
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSaving(false)}>
                Cancel
              </Button>
            </div>
            {created.error ? <FormMessage tone="error">{created.error}</FormMessage> : null}
          </form>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start"
              disabled={!savable}
              onClick={() => setSaving(true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              Save current filters
            </Button>
            {/* Only when there is a list above to contrast it with. On an
                empty panel the sentence above already says to filter first,
                and saying it twice reads as an error. */}
            {savable || views.length === 0 ? null : (
              <p className="text-muted-foreground px-2 pb-1.5 text-xs">
                Nothing to save — search or filter the list first.
              </p>
            )}
          </>
        )}
      </div>

      {removed.error ? (
        <div className="px-3 pb-2">
          <FormMessage tone="error">{removed.error}</FormMessage>
        </div>
      ) : null}
    </div>
  );
}
