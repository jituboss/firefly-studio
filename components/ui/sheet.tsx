'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap, useReturnFocus, useScrollLock } from './focus';
import { Button } from './button';

/**
 * E21-01 — the edge-anchored overlay.
 *
 * A Sheet is a Dialog that arrives from a side and is allowed to be tall: the
 * semantics are identical (`role="dialog"`, `aria-modal`, Escape, a focus trap,
 * focus returned to the opener), and only the geometry differs. It exists as
 * its own primitive rather than a Dialog prop because the two have genuinely
 * different layout contracts — a Dialog is centred and sized to its content, a
 * Sheet is pinned to an edge and sized to the viewport, and a single component
 * trying to be both grows a `side="center"` that means "not a sheet".
 *
 * The app shell's mobile navigation was the first of these, hand-built: it had
 * the backdrop and the Escape key, and none of the rest. Tab walked straight
 * out of the open drawer and onto the page behind it, which is still rendered
 * and still clickable, so a keyboard user could focus a link they could not
 * see. That is the bug this primitive exists to stop repeating.
 */

const SIDES = {
  left: 'inset-y-0 left-0 h-full w-72 max-w-[85vw] border-r',
  right: 'inset-y-0 right-0 h-full w-96 max-w-[90vw] border-l',
  bottom: 'inset-x-0 bottom-0 max-h-[85svh] w-full rounded-t-xl border-t',
} as const;

export function Sheet({
  open,
  onClose,
  side = 'right',
  title,
  description,
  /**
   * Render the title visually. Off for a navigation drawer, whose heading is
   * its own branding — but the accessible name is never optional, so the
   * heading is still in the tree, just visually hidden.
   */
  showTitle = true,
  header,
  footer,
  children,
  className,
  panelClassName,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  side?: keyof typeof SIDES;
  title: string;
  description?: string;
  showTitle?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Layout classes for the fixed root — e.g. `lg:hidden` for a mobile-only drawer. */
  className?: string;
  panelClassName?: string;
  contentClassName?: string;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useReturnFocus(open);
  useFocusTrap(open, panelRef, onClose);
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-50', className)}>
      {/*
        A div with a click handler, not a <button>. The backdrop is decoration:
        as a button it appears in the tab order and in the accessibility tree as
        a control the reader must consider, ahead of everything real inside the
        panel. Escape and the close control are the accessible ways out, and
        both are present.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        data-slot="sheet-backdrop"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-slot="sheet"
        className={cn(
          'bg-popover absolute flex flex-col overflow-hidden shadow-2xl outline-none',
          SIDES[side],
          panelClassName,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className={cn('text-base font-semibold tracking-tight', !showTitle && 'sr-only')}
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            ) : null}
            {header}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={`Close ${title}`}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', contentClassName)}>
          {children}
        </div>

        {footer ? <div className="shrink-0 border-t p-4">{footer}</div> : null}
      </div>
    </div>
  );
}
