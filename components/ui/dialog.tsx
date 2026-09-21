'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFocusTrap, useReturnFocus } from './focus';

/**
 * E21-01 — the modal primitive.
 *
 * Everything here is a lesson from the command palette, which shipped as a
 * `fixed inset-0` div with no role, no name, no focus management and an "ESC"
 * hint wired to nothing. Each of those is a line in this file now:
 *
 *   - `role="dialog"` + `aria-modal` on the PANEL, not the backdrop. The
 *     backdrop is decoration; naming it as the dialog would put the whole
 *     dimmed page inside the dialog's boundary.
 *   - Escape closes. A modal opened by keyboard and closable only by clicking
 *     the backdrop is a trap.
 *   - Focus moves in on open and goes back where it came from on close.
 *     Captured in the opener's event handler, NOT in an effect: an autofocused
 *     child steals focus before any effect runs, so the effect would store the
 *     dialog's own input, restore focus to an unmounted node, and leave it on
 *     <body> — looking correct while doing the opposite.
 *   - Tab cycles inside. Without it, tabbing leaves the dialog and lands on
 *     the page behind, which is still rendered.
 *
 * The trap itself now lives in `./focus`, shared with Sheet. It used to be
 * duplicated here, and the copy carried a bug this dialog never happened to
 * show: `onClose` in the effect's dependency array, which re-runs the effect on
 * every render and re-steals focus each time. Every dialog in this app ends its
 * action in a `redirect()`, so the navigation hid it. A Sheet holding a form
 * that returns state instead did not — read the comment on `useFocusTrap`.
 */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useReturnFocus(open);
  useFocusTrap(open, panelRef, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'bg-popover w-full max-w-md rounded-xl border p-5 shadow-2xl outline-none',
          className,
        )}
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="text-muted-foreground mt-1.5 text-sm">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
