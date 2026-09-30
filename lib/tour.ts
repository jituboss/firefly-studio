/**
 * E2-20 — the first-run product tour: its steps and its stored state.
 *
 * Each step points at an element carrying `data-tour="<target>"`. A target can
 * list alternatives, first match wins — the sidebar is hidden on a phone,
 * where the menu button stands in for it. A step whose target is not on the
 * page renders centred rather than being skipped, so the tour never jumps
 * past something without saying it.
 */

export interface TourStep {
  /** `data-tour` values to anchor to, in order of preference. Empty = centred. */
  targets: readonly string[];
  title: string;
  body: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    targets: [],
    title: 'Welcome to Firefly Studio',
    body: 'A minute-long look around. Your data stays in your Firefly III; this app only reads and writes it for you. Leave whenever you like and pick it up again from Help.',
  },
  {
    targets: ['nav', 'bottom-nav', 'nav-mobile'],
    title: 'Everything is one click away',
    body: 'Accounts, transactions, budgets, reports and automation live here, grouped by what you are trying to do.',
  },
  {
    targets: ['date-range'],
    title: 'Pick the period',
    body: 'Every figure on the page follows this range — this month, last year, or any dates you choose.',
  },
  {
    targets: ['add-transaction', 'nav-add'],
    title: 'Record a transaction',
    body: 'Add spending or income from the dashboard without leaving it. The full form, with splits, is on the Transactions page.',
  },
  {
    targets: ['customize'],
    title: 'Make the dashboard yours',
    body: 'Reorder widgets, hide the ones you do not use, or start from a preset. It is saved to your account, on every device.',
  },
  {
    targets: ['hide-balances'],
    title: 'Hide balances',
    body: 'Blurs every amount — handy on a shared screen. Hover or focus a figure to peek.',
  },
  {
    targets: [],
    title: 'Search and jump with ⌘K',
    body: 'Press ⌘K (Ctrl+K on Windows and Linux) anywhere to search transactions or jump to a page.',
  },
  {
    targets: ['help', 'nav-more'],
    title: 'That is the tour',
    body: 'Help is where to restart it — under More on a phone. Everything else is yours to explore.',
  },
];

export type TourStatus = 'active' | 'dismissed' | 'done';

export interface TourState {
  status: TourStatus;
  /** Index into TOUR_STEPS of the step to show next. */
  step: number;
}

const STATUSES: readonly TourStatus[] = ['active', 'dismissed', 'done'];

/** Untrusted JSON → a tour state, or null for "never offered". */
export function parseTourState(raw: unknown): TourState | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as { status?: unknown; step?: unknown };
  if (!STATUSES.includes(record.status as TourStatus)) return null;
  const step = typeof record.step === 'number' && Number.isInteger(record.step) ? record.step : 0;
  return {
    status: record.status as TourStatus,
    step: Math.max(0, Math.min(TOUR_STEPS.length - 1, step)),
  };
}

/**
 * The next state after an action. Resuming picks up where a dismissed tour
 * stopped; restarting after finishing goes back to the start, because someone
 * who finished and asks again wants the whole thing.
 */
export function nextTourState(
  current: TourState | null,
  action: 'start' | 'next' | 'back' | 'dismiss' | 'finish',
): TourState {
  const step = current?.step ?? 0;
  switch (action) {
    case 'start':
      return {
        status: 'active',
        step: current?.status === 'dismissed' ? step : 0,
      };
    case 'next':
      return step + 1 >= TOUR_STEPS.length
        ? { status: 'done', step: 0 }
        : { status: 'active', step: step + 1 };
    case 'back':
      return { status: 'active', step: Math.max(0, step - 1) };
    case 'dismiss':
      return { status: 'dismissed', step };
    case 'finish':
      return { status: 'done', step: 0 };
  }
}
