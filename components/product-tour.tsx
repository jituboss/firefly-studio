'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOUR_STEPS, nextTourState, type TourState } from '@/lib/tour';
import { tourAction } from '@/server/dashboard-actions';

export const START_TOUR_EVENT = 'fs:start-tour';

/** Where the tour's anchors live. Starting it from elsewhere goes here first. */
const TOUR_HOME = '/dashboard';

const CARD_WIDTH = 320;
const GAP = 12;
const MARGIN = 12;

function findTarget(targets: readonly string[]): HTMLElement | null {
  for (const name of targets) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
      const rect = element.getBoundingClientRect();
      // A `display: none` ancestor (the desktop sidebar on a phone) gives an
      // empty rect; skip it so the next alternative gets a chance.
      if (rect.width > 0 && rect.height > 0) return element;
    }
  }
  return null;
}

interface Placement {
  highlight: DOMRect | null;
  top: number;
  left: number;
}

function place(target: HTMLElement | null, cardHeight: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - MARGIN * 2);
  if (!target) {
    return {
      highlight: null,
      top: Math.max(MARGIN, (vh - cardHeight) / 2),
      left: (vw - width) / 2,
    };
  }
  const rect = target.getBoundingClientRect();
  const below = rect.bottom + GAP;
  const above = rect.top - GAP - cardHeight;
  // A tall target (the sidebar) has room neither above nor below; put the card
  // beside it instead.
  if (below + cardHeight > vh && above < MARGIN && rect.right + GAP + width < vw) {
    return {
      highlight: rect,
      top: Math.max(MARGIN, Math.min(rect.top, vh - cardHeight - MARGIN)),
      left: rect.right + GAP,
    };
  }
  const top = below + cardHeight <= vh - MARGIN || above < MARGIN ? below : above;
  // Centre on the target, then clamp into the viewport — measured, not an
  // alignment class, for the reason in docs/LEARNING.md §7c.
  const centred = rect.left + rect.width / 2 - width / 2;
  const left = Math.max(MARGIN, Math.min(centred, vw - width - MARGIN));
  return { highlight: rect, top: Math.max(MARGIN, top), left };
}

/**
 * E2-20 — the first-run tour. Offered once, to accounts that finish onboarding
 * after it shipped; dismissible at any step, and resumable from Help, which
 * picks up at the step it was dismissed on.
 *
 * Progress is saved server-side on every step, so a tour started on a laptop
 * resumes where it stopped on a phone.
 */
export function ProductTour({ initialState }: { initialState: TourState | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = React.useState(initialState);
  const [placement, setPlacement] = React.useState<Placement | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const queue = React.useRef<Promise<unknown>>(Promise.resolve());

  const active = state?.status === 'active' && pathname === TOUR_HOME;
  const step = active ? TOUR_STEPS[state.step] : undefined;

  const send = React.useCallback((action: Parameters<typeof tourAction>[0]) => {
    setState((current) => nextTourState(current, action));
    // Serialised, so a quick double "Next" reaches the server in order. A
    // failed save is not worth interrupting the tour for: the worst case is
    // that it resumes one step early next time.
    queue.current = queue.current.then(() => tourAction(action)).catch(() => undefined);
  }, []);

  React.useEffect(() => {
    const start = () => {
      send('start');
      if (window.location.pathname !== TOUR_HOME) router.push(TOUR_HOME);
    };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, [router, send]);

  React.useLayoutEffect(() => {
    if (!step) {
      setPlacement(null);
      return;
    }
    const target = findTarget(step.targets);
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const update = () =>
      setPlacement(place(findTarget(step.targets), cardRef.current?.offsetHeight ?? 180));
    update();
    // Once more after paint, when the card has its real height.
    const frame = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);

  // Move focus to the card on each step so a screen reader announces it and
  // the keyboard is already where the buttons are.
  React.useEffect(() => {
    if (step) cardRef.current?.focus();
  }, [step]);

  if (!step || !state) return null;

  const index = state.step;
  const last = index === TOUR_STEPS.length - 1;
  const highlight = placement?.highlight;

  return (
    <>
      {/* Dims the page and rings the target with one box: a transparent hole
          whose shadow covers everything else. Purely visual. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[60] rounded-lg transition-all duration-200 motion-reduce:transition-none"
        style={
          highlight
            ? {
                top: highlight.top - 6,
                left: highlight.left - 6,
                width: highlight.width + 12,
                height: highlight.height + 12,
                boxShadow: '0 0 0 3px var(--color-primary), 0 0 0 9999px rgb(0 0 0 / 0.45)',
              }
            : { inset: 0, background: 'rgb(0 0 0 / 0.45)' }
        }
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') send('dismiss');
        }}
        className="bg-popover text-popover-foreground fixed z-[61] rounded-xl border p-4 shadow-2xl outline-none"
        style={{
          top: placement?.top ?? -9999,
          left: placement?.left ?? 0,
          width: `min(${CARD_WIDTH}px, calc(100vw - ${MARGIN * 2}px))`,
        }}
      >
        <div className="flex items-start gap-2">
          <h2 id="tour-title" className="min-w-0 flex-1 text-sm font-semibold">
            {step.title}
          </h2>
          <button
            type="button"
            onClick={() => send('dismiss')}
            aria-label="Close the tour"
            className="text-muted-foreground hover:text-foreground focus-visible:outline-ring -m-1 rounded p-1 focus-visible:outline-2"
          >
            <X className="size-4" />
          </button>
        </div>
        <p id="tour-body" className="text-muted-foreground mt-1.5 text-sm">
          {step.body}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-muted-foreground flex-1 text-xs tabular-nums">
            {index + 1} of {TOUR_STEPS.length}
          </span>
          {index > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => send('back')}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => send('dismiss')}>
              Skip
            </Button>
          )}
          <Button size="sm" onClick={() => send(last ? 'finish' : 'next')}>
            {last ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </>
  );
}
