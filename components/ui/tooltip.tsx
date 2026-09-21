'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * E21-01 — a hint on hover and on focus.
 *
 * Three rules, and the first is the one that matters:
 *
 * 1. **A tooltip is never the only place the information lives.** It does not
 *    exist on a touch device — there is no hover, and a tap is a click — and a
 *    screen-reader user navigating by button gets the accessible name, not
 *    this. So the trigger keeps its `aria-label` and the tooltip is
 *    `aria-hidden`: it repeats the name for a sighted mouse user who cannot
 *    read an icon, which is the entire job. Anything a user MUST know goes in
 *    visible text or in the accessible name, not here.
 *
 *    That is also why this takes no `aria-describedby` route. Wiring one makes
 *    the tooltip authoritative, and then it is carrying information that a
 *    phone cannot show at all.
 *
 * 2. **Focus shows it too.** A tooltip that only answers a mouse is invisible
 *    to a keyboard, and icon-only controls are exactly where a keyboard user is
 *    most lost.
 *
 * 3. **Escape dismisses it.** WCAG 1.4.13: content that appears on hover must
 *    be dismissable without moving the pointer, because on a magnified screen
 *    the tooltip can be sitting on top of what you were trying to read.
 *
 * The open delay is on the way in only. Instant tooltips fire while the cursor
 * is merely crossing a toolbar; a delay on the way OUT means a row of icons
 * leaves a trail of them.
 */

const SIDES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
} as const;

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 250,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: keyof typeof SIDES;
  delay?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = React.useCallback(
    (immediate: boolean) => {
      cancel();
      if (immediate) {
        setOpen(true);
        return;
      }
      timer.current = setTimeout(() => setOpen(true), delay);
    },
    [cancel, delay],
  );

  const hide = React.useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);

  React.useEffect(() => cancel, [cancel]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') hide();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, hide]);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={(event) => {
        // A touch "hover" fires once on tap and never leaves, stranding the
        // tooltip over the page until something else is tapped.
        if (event.pointerType === 'touch') return;
        show(false);
      }}
      onPointerLeave={hide}
      // Focus, not focus-visible: a control focused by click is about to be
      // used, and re-showing a tooltip under the cursor that is already there
      // is noise. `onFocus` fires for both, so the pointer handlers above own
      // the mouse case and this is left to cover the keyboard — the delay is
      // skipped because a Tab press is already a deliberate stop.
      onFocus={() => show(true)}
      onBlur={hide}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          aria-hidden="true"
          data-slot="tooltip"
          className={cn(
            'bg-foreground text-background pointer-events-none absolute z-50 w-max max-w-56',
            'rounded-md px-2 py-1 text-xs font-medium shadow-md',
            SIDES[side],
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
