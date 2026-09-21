'use client';

import * as React from 'react';
import { useOptimistic, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { bulkUpdateTransactionsAction } from '@/server/firefly/transaction-actions';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { useDismissOnOutside } from '@/components/ui/focus';

/**
 * E5-12 / E22-06 — change a transaction's category from the list, and see it
 * change immediately.
 *
 * Filing a month of transactions meant opening each one, editing, saving and
 * coming back — four navigations per row. The category cell is the edit now.
 *
 * **Optimistic, with a real rollback.** `useOptimistic` shows the new category
 * the moment it is picked, and the value reverts if the write is refused —
 * which is the whole point, and the part that makes optimism honest rather
 * than a lie that usually gets away with it. The error is surfaced too: a
 * silent revert looks like the click missed.
 *
 * It reuses `bulkUpdateTransactionsAction` with a single id rather than
 * growing a second write path. That action sends every split with its journal
 * id, because a bare `{category_name}` is a silent no-op on a split
 * transaction — 200, nothing changed. Worth knowing before "simplifying" this
 * back to a one-line PUT.
 */
export function InlineCategory({
  groupId,
  category,
  className,
}: {
  groupId: string;
  category: string | null;
  className?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(category);
  const boxRef = React.useRef<HTMLSpanElement>(null);

  /*
   * An open editor has to be dismissable, and by more than picking a value.
   * Without this, clicking a second row's category left the first editor open
   * — two live comboboxes in one list — and Escape did nothing, so a cell
   * opened by mistake could only be closed by committing a change to it.
   */
  const cancel = React.useCallback(() => setEditing(false), []);
  useDismissOnOutside(editing, [boxRef], cancel);
  React.useEffect(() => {
    if (!editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // The combobox's own list closes on Escape first; this closes the cell.
        event.stopPropagation();
        cancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, cancel]);

  const save = (next: string) => {
    setEditing(false);
    setError(null);
    startTransition(async () => {
      setOptimistic(next || null);
      const form = new FormData();
      form.append('ids', groupId);
      form.set('field', 'category');
      form.set('value', next);
      const result = await bulkUpdateTransactionsAction({}, form);
      // A refused write drops the optimistic value when the transition ends;
      // saying why is what stops that reading as a missed click.
      if (result.error) setError(result.error);
    });
  };

  if (editing) {
    return (
      <span
        ref={boxRef}
        className={cn('flex min-w-0 items-center gap-1', className)}
        // The cell sits inside a row-wide <Link>; without this, picking an
        // option navigates to the transaction instead of filing it.
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <Combobox
          endpoint="categories"
          value={optimistic ?? ''}
          onChange={(value) => save(value)}
          placeholder="Category"
          allowFreeText
        />
        <button
          type="button"
          aria-label="Cancel"
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => setEditing(false)}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      title={error ?? 'Change category'}
      /*
       * The visible text is the category alone, so a screen reader announced
       * "Housing, button" — a name that never says the control does anything.
       * The accessible name STARTS with the visible text so speech input still
       * matches what is on screen (WCAG 2.5.3 label in name).
       */
      aria-label={`${optimistic ?? 'No category'}, change category`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        'group/cat inline-flex max-w-full min-w-0 items-center gap-1 rounded text-left',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      {optimistic ? (
        <span
          className={cn(
            'bg-muted/70 text-muted-foreground group-hover/cat:bg-muted truncate rounded px-2 py-0.5 text-[0.6875rem] transition-colors',
            pending && 'opacity-60',
            error && 'text-expense',
          )}
        >
          {optimistic}
        </span>
      ) : (
        <span className="text-muted-foreground/50 group-hover/cat:text-muted-foreground text-xs transition-colors">
          {pending ? '…' : '—'}
        </span>
      )}
      {pending ? null : (
        <Check
          className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover/cat:opacity-60"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
