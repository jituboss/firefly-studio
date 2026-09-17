'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * E21 — the top-of-page navigation progress bar.
 *
 * The App Router removed `router.events`, so both ends of a navigation have to
 * be detected here:
 *
 *  **Start** comes from three places, because no single one covers everything.
 *  A capture-phase click on an internal `<a>` fires before any network work,
 *  which is what makes the bar feel immediate for ordinary `<Link>` clicks. A
 *  patched `fetch` catches the RSC request itself, which is the only signal
 *  that covers programmatic `router.push` — how every filter, date picker and
 *  search box in this app navigates. `popstate` catches back and forward.
 *
 *  `history.pushState` is deliberately NOT used. Measured against this app, the
 *  App Router calls it *after* the navigation resolves — 132 ms after the click
 *  on a fast route, and not at all until completion on a slow one — so a bar
 *  driven by it never appeared for programmatic navigation at all.
 *
 *  A navigation RSC request carries `RSC: 1` and no `Next-Router-Prefetch`.
 *  Prefetches carry both, and are ignored: hovering the Reports link fires nine
 *  prefetches, and a bar that ran on those would never be still.
 *
 *  **Completion** is the route key (pathname + query) changing, then one more
 *  paint. Waiting for the paint is why the bar finishes as the new page appears
 *  rather than a frame before it, which otherwise reads as a stutter.
 *
 * Two behaviours worth keeping:
 *
 *  - Nothing renders for the first {@link SHOW_DELAY_MS}. A cached route
 *    commits in a few milliseconds, and a bar that flashes on every instant
 *    navigation is worse than no bar.
 *  - The trickle never reaches 100% on its own. It decays towards a ceiling, so
 *    a slow page keeps showing movement without ever claiming to be finished —
 *    only a real completion closes it.
 */

/**
 * Hold off before showing, so ordinary navigations never flash.
 *
 * Measured on this app with routes already prefetched: 45, 45, 59, 112 and
 * 126 ms. 180 ms clears that range with margin, and a page slow enough to need
 * a progress bar is slow enough that 180 ms is imperceptible.
 */
const SHOW_DELAY_MS = 180;
/**
 * Once the bar is up, keep it up for at least this long before completing.
 *
 * A bar that appears and vanishes inside a couple of frames reads as a glitch,
 * not as feedback. This is what stops a navigation landing just past
 * SHOW_DELAY_MS from blinking.
 */
const MIN_VISIBLE_MS = 320;
/** How often the trickle advances while waiting. */
const TRICKLE_INTERVAL_MS = 220;
/** The trickle asymptote. Reaching 100% is reserved for actual completion. */
const CEILING = 92;
/** Fade-out duration; must match the CSS transition below. */
const FADE_MS = 240;
/**
 * Backstop. A navigation that never commits — a same-URL click, an aborted
 * route, a thrown error boundary — must not leave the bar stuck at 92% forever.
 */
const SAFETY_TIMEOUT_MS = 8_000;

/** Does this request target the route already on screen? */
function isCurrentRoute(input: RequestInfo | URL): boolean {
  const href =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : typeof Request !== 'undefined' && input instanceof Request
          ? input.url
          : null;
  if (!href) return false;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    // Next appends a cache-busting `_rsc` param that the address bar never has,
    // so it has to come off before the comparison.
    url.searchParams.delete('_rsc');
    return (
      url.pathname === window.location.pathname &&
      url.searchParams.toString() === new URL(window.location.href).searchParams.toString()
    );
  } catch {
    return false;
  }
}

/**
 * Is this fetch the RSC request behind a navigation?
 *
 * Next marks a navigation with `RSC: 1` and a prefetch with `RSC: 1` plus
 * `Next-Router-Prefetch: 1`. Both header sets were read off the wire against
 * this app rather than taken from documentation. Headers can arrive on `init`
 * or on a `Request` instance, so both are checked.
 */
function isRscNavigation(input: RequestInfo | URL, init?: RequestInit): boolean {
  // A request for the route already on screen produces no route-key change, so
  // nothing would ever complete the bar — it would sit at the ceiling until the
  // safety timeout. That covers clicking the current page's own nav link and
  // `router.refresh()` after a Server Action, both of which have their own
  // in-place feedback anyway.
  if (isCurrentRoute(input)) return false;

  const read = (headers: HeadersInit | undefined, name: string): string | null => {
    if (!headers) return null;
    if (headers instanceof Headers) return headers.get(name);
    if (Array.isArray(headers)) {
      return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null;
    }
    const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
    return match ? String(match[1]) : null;
  };

  let rsc = read(init?.headers, 'RSC');
  let prefetch = read(init?.headers, 'Next-Router-Prefetch');

  if (rsc === null && typeof Request !== 'undefined' && input instanceof Request) {
    rsc = input.headers.get('RSC');
    prefetch = input.headers.get('Next-Router-Prefetch');
  }

  return rsc === '1' && prefetch !== '1';
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams}`;

  const [value, setValue] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  const timers = React.useRef<{ show?: number; trickle?: number; fade?: number; safety?: number }>(
    {},
  );
  const running = React.useRef(false);
  /** Mirrors `visible` so `finish` can read it without depending on state. */
  const shown = React.useRef(false);
  /** When the bar became visible, for the minimum-visible rule. */
  const shownAt = React.useRef(0);

  const clearTimers = React.useCallback(() => {
    const current = timers.current;
    if (current.show) window.clearTimeout(current.show);
    if (current.trickle) window.clearInterval(current.trickle);
    if (current.fade) window.clearTimeout(current.fade);
    if (current.safety) window.clearTimeout(current.safety);
    timers.current = {};
  }, []);

  const finish = React.useCallback(() => {
    if (!running.current) return;
    running.current = false;
    clearTimers();

    // Completed before the bar ever appeared: cancel silently, no flash.
    if (!shown.current) return;

    const complete = () => {
      setValue(100);
      // Hold at 100% for the fade, then reset out of sight. Resetting width and
      // opacity together would animate the bar back to the left edge.
      timers.current.fade = window.setTimeout(() => {
        shown.current = false;
        setVisible(false);
        setValue(0);
      }, FADE_MS);
    };

    // Honour the minimum visible time. `shown.current` alone is not enough:
    // the show timer can win the race by a few milliseconds, which is how a
    // 112 ms navigation still produced a visible bar at 129 ms.
    const visibleFor = performance.now() - shownAt.current;
    if (visibleFor >= MIN_VISIBLE_MS) complete();
    else timers.current.fade = window.setTimeout(complete, MIN_VISIBLE_MS - visibleFor);
  }, [clearTimers]);

  const start = React.useCallback(() => {
    // A second navigation while one is in flight keeps the existing bar rather
    // than snapping it back to zero.
    if (running.current) return;
    running.current = true;
    clearTimers();

    timers.current.show = window.setTimeout(() => {
      shown.current = true;
      shownAt.current = performance.now();
      setVisible(true);
      // Jump straight to a visible fraction: starting from 0 looks like nothing
      // happened for the first few hundred milliseconds.
      setValue(18);

      timers.current.trickle = window.setInterval(() => {
        setValue((current) => {
          if (current >= CEILING) return current;
          // Decaying step — fast early, crawling near the ceiling, so the bar
          // stays honest about not knowing how long is left.
          const remaining = CEILING - current;
          return current + Math.max(0.4, remaining * 0.12);
        });
      }, TRICKLE_INTERVAL_MS);
    }, SHOW_DELAY_MS);

    timers.current.safety = window.setTimeout(finish, SAFETY_TIMEOUT_MS);
  }, [clearTimers, finish]);

  // --- completion: the route committed, then one more paint -----------------
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Two frames: the first is scheduled before the new tree paints, the second
    // lands after it.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(finish);
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [routeKey, finish]);

  // --- start: clicks, programmatic pushes, and history -----------------------
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Anything but an unmodified left click is the browser's to handle.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (event.defaultPrevented) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External links leave the app; the browser shows its own progress.
      if (destination.origin !== window.location.origin) return;
      // A hash change on the current page is not a navigation, and would never
      // produce the route-key change that completes the bar.
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash !== window.location.hash
      ) {
        return;
      }
      // Same URL entirely: Next does not re-navigate, so nothing would finish it.
      if (destination.href === window.location.href) return;

      start();
    };

    // A navigation issues an RSC request. That is the only signal available for
    // `router.push`, which produces no click. Restored on unmount so a hot
    // reload cannot stack wrappers.
    const originalFetch = window.fetch;
    window.fetch = function patchedFetch(input, init) {
      if (isRscNavigation(input, init)) start();
      return originalFetch.call(this, input as RequestInfo, init);
    };

    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener('popstate', start);

    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('popstate', start);
      window.fetch = originalFetch;
      clearTimers();
      running.current = false;
      shown.current = false;
    };
  }, [start, clearTimers]);

  if (!visible) return null;

  return (
    /*
     * Decorative on purpose. The App Router ships a route announcer that reads
     * the new page to assistive technology; a second live region here would
     * announce the same navigation twice.
     *
     * The transitions are neutralised automatically for anyone who asks for
     * reduced motion — globals.css caps every transition-duration under
     * `prefers-reduced-motion`, so the bar steps instead of sliding.
     */
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="bg-primary relative h-full transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${value}%`,
          opacity: value >= 100 ? 0 : 1,
          transitionDuration: value >= 100 ? `${FADE_MS}ms` : undefined,
        }}
      >
        {/* The leading glow is what makes the bar read as motion rather than a
            static rule while the trickle crawls. */}
        <div className="bg-primary absolute top-0 right-0 h-full w-24 opacity-60 blur-[3px]" />
      </div>
    </div>
  );
}
