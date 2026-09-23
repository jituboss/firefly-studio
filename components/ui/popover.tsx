'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FOCUSABLE, useDismissOnOutside, useReturnFocus } from './focus';

/**
 * E21-01 — a non-modal panel anchored to its trigger.
 *
 * Deliberately NOT built on Dialog, and deliberately not a DropdownMenu.
 *
 *   - Not a Dialog, because a popover does not take the page hostage. There is
 *     no backdrop and no scroll lock: the content behind stays readable and
 *     usable, which is the whole reason to reach for one.
 *   - Not a DropdownMenu, because `role="menu"` promises menu semantics — a
 *     screen reader announces an item count and arrow keys are expected to move
 *     between items. The notification inbox has forms, links and a heading
 *     inside it. Announcing that as a five-item menu describes something the
 *     user cannot operate the way they were just told to.
 *
 * So it is a labelled `<div>` with the three behaviours a panel actually owes:
 * Escape closes, a pointer outside closes, and focus goes back to the trigger.
 * The inbox this replaced had none of them — it opened on click and the only
 * way to close it was to click the bell again, which is not discoverable and
 * is impossible to guess from the keyboard.
 *
 * Positioning is CSS, not measurement — with ONE exception, added when a call
 * site finally needed it. The admin page puts this on every row of a long
 * table, and a menu opened on the last row rendered below the fold: reaching
 * "Delete account" meant scrolling the page while the menu was open. So the
 * panel now flips above its trigger when it does not fit below and there is
 * more room above. That is a dozen lines of measurement rather than a
 * positioning library, because flipping on one axis is the whole of the problem
 * anyone here has actually had — horizontal alignment is still `left-0` or
 * `right-0`, and no call site anchors near enough to a side edge for that to
 * matter.
 */

const ALIGN = {
  start: 'left-0',
  end: 'right-0',
} as const;

export function Popover({
  trigger,
  children,
  label,
  align = 'end',
  className,
  contentClassName,
}: {
  /**
   * Given the props that make the trigger accessible, render the control.
   * A render prop rather than a cloned child: cloning means silently
   * overwriting an `onClick` or an `aria-expanded` the caller already set, and
   * the failure is invisible until someone wonders why their handler stopped
   * firing.
   */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'dialog';
    'aria-controls': string | undefined;
  }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** The panel's accessible name. */
  label: string;
  align?: keyof typeof ALIGN;
  className?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [placement, setPlacement] = React.useState<'bottom' | 'top'>('bottom');
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();

  const close = React.useCallback(() => setOpen(false), []);

  useReturnFocus(open, triggerRef.current);
  useDismissOnOutside(open, [panelRef, triggerRef], close);

  // Escape from anywhere, including from a control inside the panel.
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, close]);

  /*
   * Move focus in, but only on a keyboard open.
   *
   * A mouse user who clicks the bell wants to read the panel; yanking focus to
   * its first button scrolls nothing and helps nobody. A keyboard user who
   * presses Enter has no other way to reach the contents — Tab from the trigger
   * goes to the next control in the header, past the panel entirely, because
   * the panel is later in the DOM only by accident of absolute positioning.
   * `:focus-visible` on the trigger is the signal that distinguishes them, and
   * it is the browser's own heuristic rather than one invented here.
   */
  React.useEffect(() => {
    if (!open) return;
    if (!triggerRef.current?.matches(':focus-visible')) return;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

  /*
   * Flip above the trigger when the panel does not fit below it.
   *
   * `useLayoutEffect` so the decision is made before the browser paints —
   * measuring in a passive effect shows the panel in the wrong place for a
   * frame, which on a menu reads as a flicker.
   *
   * It re-measures on every open rather than caching: the same row's menu fits
   * below when the page is scrolled to the top and does not when it is scrolled
   * to the bottom, and the panel's own height changes with its contents (a
   * refusal line adds ~30px).
   */
  React.useLayoutEffect(() => {
    if (!open) {
      setPlacement('bottom');
      return;
    }
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    const height = panel.offsetHeight;
    const gap = 8;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;

    // Only flip when it genuinely helps: no room below AND more room above.
    setPlacement(below < height + gap && above > below ? 'top' : 'bottom');
  }, [open]);

  return (
    <div className={cn('relative', className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((current) => !current),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': open ? panelId : undefined,
      })}

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={label}
          data-slot="popover"
          className={cn(
            'bg-popover text-popover-foreground absolute z-50 w-80 max-w-[calc(100vw-2rem)]',
            'overflow-hidden rounded-lg border shadow-lg',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            ALIGN[align],
            contentClassName,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}
