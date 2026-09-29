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
 * Positioning is CSS, not measurement — with TWO exceptions. The admin page
 * puts this on every row of a long table, and a menu opened on the last row
 * rendered below the fold: reaching "Delete account" meant scrolling the page
 * while the menu was open. So the panel now flips above its trigger when it
 * does not fit below and there is more room above. The second exception is
 * horizontal: the reports scope bar wraps its controls on mobile, so a trigger
 * on the left side of the card with `align="end"` produced a panel whose
 * `right-0` edge sat at the trigger's right edge — 320px wide, extending past
 * the viewport. The panel now measures whether it fits to the right or left
 * and shifts accordingly, falling back to centering under the trigger when
 * neither side fits.
 */

const ALIGN = {
  start: 'left-0',
  end: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
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
  const [hAlign, setHAlign] = React.useState<'start' | 'end' | 'center'>('end');
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
      setHAlign('end');
      return;
    }
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = panel.offsetWidth;
    const gap = 8;

    // Vertical flip — same logic as before.
    const height = panel.offsetHeight;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    setPlacement(below < height + gap && above > below ? 'top' : 'bottom');

    // Horizontal collision detection.
    //
    // The panel is absolutely positioned with left-0 (align=start) or
    // right-0 (align=end) relative to the trigger's `relative` parent. On a
    // wide screen the trigger sits nowhere near a viewport edge. On mobile,
    // the trigger can be on the left side of the card (after flex-wrap), so
    // a right-0 panel of 320px extends past the viewport. Shift to the
    // alignment that keeps the panel on-screen, falling back to centering
    // under the trigger when neither side fits cleanly.
    const leftEdge = rect.left;
    const rightEdge = rect.right;
    const viewportW = window.innerWidth;
    const padding = 8;

    // `end` = right-0: panel's right edge at trigger, extends leftward.
    // `start` = left-0: panel's left edge at trigger, extends rightward.
    // Pick whichever side has room; fall back to centering under the trigger.
    const fitsEnd = leftEdge - panelWidth >= padding;
    const fitsStart = rightEdge + panelWidth <= viewportW - padding;

    if (align === 'end' && fitsEnd) {
      setHAlign('end');
    } else if (align === 'start' && fitsStart) {
      setHAlign('start');
    } else if (fitsStart) {
      setHAlign('start');
    } else if (fitsEnd) {
      setHAlign('end');
    } else {
      setHAlign('center');
    }
  }, [open, align]);

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
            ALIGN[hAlign],
            contentClassName,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}
