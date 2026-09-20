'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

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
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const restoreTo = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  // Capture the opener before the panel mounts and takes focus.
  React.useEffect(() => {
    if (open) restoreTo.current = document.activeElement as HTMLElement | null;
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    // The first control, or the panel itself if it has none.
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (focusable.length === 0) return;
      const firstEl = focusable[0]!;
      const lastEl = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  // Restore focus on the way out, not on every render.
  React.useEffect(() => {
    if (open) return;
    const target = restoreTo.current;
    restoreTo.current = null;
    target?.focus?.();
  }, [open]);

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
