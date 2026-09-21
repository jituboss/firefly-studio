'use client';

import * as React from 'react';

/**
 * E21-01 — the focus behaviour shared by every overlay primitive.
 *
 * This was Dialog's, verbatim, until Sheet needed the same three rules and
 * Popover needed two of them. Copying a focus trap is how you end up with two
 * that disagree, so it lives here once. Read the comments in `dialog.tsx` for
 * why each rule exists — every one of them is a bug that shipped.
 */

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Remember who opened the overlay, and put focus back there when it closes.
 *
 * The capture runs in an effect keyed on `open` going true, which fires before
 * the panel's own effects have moved focus anywhere — but AFTER React has
 * committed the panel, so an `autoFocus` child would already hold focus if the
 * caller mounted one. Callers that autofocus must capture in the opener's
 * click handler instead and pass the element in as `openerOverride`; that is
 * the trap Dialog documents, and it is why this takes an override at all.
 */
export function useReturnFocus(open: boolean, openerOverride?: HTMLElement | null) {
  const restoreTo = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    restoreTo.current = openerOverride ?? (document.activeElement as HTMLElement | null);
  }, [open, openerOverride]);

  React.useEffect(() => {
    if (open) return;
    const target = restoreTo.current;
    restoreTo.current = null;
    target?.focus?.();
  }, [open]);
}

/**
 * Keep a callback reachable from an effect without making the effect depend on
 * it.
 *
 * Callers write `onClose={() => setOpen(false)}`, which is a new function on
 * every render. An effect that lists it as a dependency therefore re-runs on
 * every render — see the warning on `useFocusTrap` for what that cost.
 */
function useEvent<T extends (...args: never[]) => unknown>(callback: T) {
  const ref = React.useRef(callback);
  React.useEffect(() => {
    ref.current = callback;
  });
  return React.useCallback((...args: Parameters<T>) => ref.current(...args), []);
}

/**
 * Move focus into `ref` on open, cycle Tab inside it, and close on Escape.
 *
 * `capture: true` on the listener so a nested control that stops propagation
 * (a combobox swallowing Escape to close its own list, say) cannot leave the
 * overlay uncloseable.
 *
 * **The effect depends on `open`, never on `onClose`.** That is not a
 * micro-optimisation, it is the whole correctness of this hook.
 *
 * An overlay is opened with `onClose={() => setOpen(false)}` — a new function
 * identity on every render. With that in the dependency array the effect tears
 * down and re-runs on EVERY render, and its first act is to move focus to the
 * panel's first control. So every re-render silently yanked focus off whatever
 * the user was using and put it back on the close button.
 *
 * That is worse than a cosmetic annoyance. A form inside the overlay re-renders
 * the moment it is submitted (the pending state), the effect re-ran, focus left
 * the submit button mid-submission, and Chrome aborted the in-flight request:
 * `net::ERR_ABORTED` on a POST that the server had already answered 200 in
 * 233ms. The write succeeded, the result never arrived, and the button sat on
 * "Adding…" forever — a success the UI reported as still working.
 *
 * It took a while to find because everything about it looks right, and because
 * the two overlays that shipped first happened to be immune: a Dialog whose
 * action ends in `redirect()` navigates regardless, and the app's other
 * quick-add form is not inside an overlay at all.
 */
export function useFocusTrap(
  open: boolean,
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const close = useEvent(onClose);

  React.useEffect(() => {
    if (!open) return;

    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
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
  }, [open, ref, close]);
}

/**
 * Lock the page behind an overlay.
 *
 * Both axes: locking only `overflow-y` leaves the page scrollable sideways
 * behind the drawer, which is what clipped the app's content off the left edge
 * the first time the mobile nav shipped.
 */
export function useScrollLock(open: boolean) {
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

/**
 * Close when a pointer goes down anywhere outside `ref` and `anchorRef`.
 *
 * `pointerdown`, not `click`: a click fires after mouseup, so a drag that
 * starts inside the panel and ends outside it would close the panel on the
 * release — and a click listener misses a touch that scrolls the page away
 * underneath. The anchor is excluded because the trigger's own handler
 * toggles; without this exclusion the two fire in sequence and the panel
 * closes and reopens in the same gesture, which reads as "the button does
 * nothing".
 */
export function useDismissOnOutside(
  open: boolean,
  refs: Array<React.RefObject<HTMLElement | null>>,
  onClose: () => void,
) {
  // Same reason as useFocusTrap: an unstable `onClose` would reinstall this
  // listener on every render. Less damaging here — re-adding a pointerdown
  // listener steals nothing — but the churn is pointless and the rule is
  // easier to keep than to remember the exception to.
  const close = useEvent(onClose);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      close();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close, ...refs]);
}
