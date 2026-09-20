'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

/**
 * E21-01 — the replacement for `window.confirm`, which guarded nineteen
 * destructive actions in this app.
 *
 * Native confirm is not inaccessible — it is the browser's own dialog — but it
 * is unstyleable, it blocks the main thread, and inside an installed PWA it
 * renders as an alien system sheet that names the origin, which reads like the
 * page is doing something it should not be. This one carries the destructive
 * wording in its own voice.
 *
 * Two shapes, because the call sites have two:
 *
 *   <ConfirmButton message="…">Delete</ConfirmButton>
 *       inside a <form>, submits that form on confirm.
 *
 *   <ConfirmButton message="…" onConfirm={fn}>Delete</ConfirmButton>
 *       calls fn instead.
 *
 * The form case uses `requestSubmit()` rather than `submit()` on purpose:
 * `submit()` skips validation AND skips React's onSubmit, so a Server Action
 * bound through `action={}` would never run — the button would silently do
 * nothing, which on a delete button reads as "it worked".
 */
export function ConfirmButton({
  message,
  title = 'Are you sure?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  pendingLabel,
  variant = 'destructive',
  size = 'sm',
  className,
  disabled,
  'aria-label': ariaLabel,
  children,
}: {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Omit inside a form: the enclosing form is submitted instead. */
  onConfirm?: () => void;
  /**
   * Shown while the enclosing form is submitting. The call sites this replaced
   * each had their own `useFormStatus` wrapper for exactly this, and losing it
   * would make a slow delete look like a dead button.
   */
  pendingLabel?: string;
  variant?: 'destructive' | 'outline' | 'ghost' | 'secondary' | 'default';
  size?: 'sm' | 'default' | 'icon';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // Safe outside a form too, where it simply reports not-pending.
  const { pending } = useFormStatus();

  function accept() {
    setOpen(false);
    if (onConfirm) {
      onConfirm();
      return;
    }
    triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <Button
        ref={triggerRef}
        // `button` inside a form: without this it is a submit button and
        // clicking it would fire the very action it is meant to ask about.
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || pending}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {pending && pendingLabel ? pendingLabel : children}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={message}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'ghost' ? 'destructive' : variant}
              size="sm"
              onClick={accept}
            >
              {confirmLabel}
            </Button>
          </>
        }
      />
    </>
  );
}
