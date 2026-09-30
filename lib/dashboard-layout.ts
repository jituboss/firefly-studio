/**
 * E3-12 / E2-19 — the dashboard's layout: which widgets show, in what order.
 *
 * Stored as JSON on `user_preferences.dashboard_layout`, so everything read
 * back from there is untrusted. `parseLayout` is the one way in: it drops ids
 * it does not know, removes duplicates, and appends any widget the stored
 * layout has never heard of. That last rule is what lets a release add a
 * widget without it being invisible to everyone who customised their
 * dashboard before it existed.
 *
 * Pure, so the page, the Server Action and the onboarding wizard all read one
 * definition.
 */

export const WIDGETS = [
  { id: 'kpis', label: 'Headline figures', span: 'full' },
  { id: 'net-worth', label: 'Net worth over time', span: 'full' },
  { id: 'accounts', label: 'Accounts', span: 'half' },
  { id: 'recent', label: 'Recent transactions', span: 'half' },
  { id: 'categories', label: 'Top spending categories', span: 'half' },
  { id: 'bills', label: 'Upcoming bills', span: 'half' },
  { id: 'savings', label: 'Savings goals', span: 'half' },
  { id: 'budgets', label: 'Budget progress', span: 'half' },
  { id: 'pinned', label: 'Pinned reports', span: 'half' },
] as const;

export type WidgetId = (typeof WIDGETS)[number]['id'];
export type WidgetSpan = (typeof WIDGETS)[number]['span'];

const WIDGET_IDS: readonly WidgetId[] = WIDGETS.map((widget) => widget.id);

export interface DashboardLayout {
  /** Every known widget exactly once, in display order. */
  order: WidgetId[];
  /** Widgets the user has switched off. A subset of `order`. */
  hidden: WidgetId[];
}

export const PRESETS = [
  {
    id: 'everyday',
    label: 'Everyday spender',
    description: 'Recent transactions, budgets and bills first.',
    order: [
      'kpis',
      'recent',
      'budgets',
      'bills',
      'categories',
      'accounts',
      'net-worth',
      'savings',
      'pinned',
    ],
    hidden: [],
  },
  {
    id: 'saver',
    label: 'Saver',
    description: 'Savings goals and net worth up top, day-to-day below.',
    order: [
      'kpis',
      'savings',
      'net-worth',
      'budgets',
      'accounts',
      'categories',
      'recent',
      'bills',
      'pinned',
    ],
    hidden: [],
  },
  {
    id: 'investor',
    label: 'Investor',
    description: 'Net worth and balances. Budgets and bills are hidden.',
    order: [
      'net-worth',
      'kpis',
      'accounts',
      'savings',
      'pinned',
      'categories',
      'recent',
      'budgets',
      'bills',
    ],
    hidden: ['budgets', 'bills'],
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Just the headline figures. Add widgets as you need them.',
    order: [
      'kpis',
      'net-worth',
      'accounts',
      'recent',
      'categories',
      'bills',
      'savings',
      'budgets',
      'pinned',
    ],
    hidden: ['net-worth', 'accounts', 'recent', 'categories', 'bills', 'savings', 'budgets'],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  order: readonly WidgetId[];
  hidden: readonly WidgetId[];
}>;

export type PresetId = (typeof PRESETS)[number]['id'];

/** The layout before anyone chooses one — the order the dashboard always had. */
export const DEFAULT_LAYOUT: DashboardLayout = {
  order: [...WIDGET_IDS],
  hidden: [],
};

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === 'string' && (WIDGET_IDS as readonly string[]).includes(value);
}

export function widgetSpan(id: WidgetId): WidgetSpan {
  return WIDGETS.find((widget) => widget.id === id)?.span ?? 'half';
}

export function widgetLabel(id: WidgetId): string {
  return WIDGETS.find((widget) => widget.id === id)?.label ?? id;
}

export function isPresetId(value: unknown): value is PresetId {
  return PRESETS.some((preset) => preset.id === value);
}

export function presetLayout(id: PresetId): DashboardLayout {
  const preset = PRESETS.find((entry) => entry.id === id) ?? PRESETS[0];
  return parseLayout({ order: preset.order, hidden: preset.hidden });
}

/**
 * Anything → a valid layout. Never throws: a corrupt row must not take the
 * dashboard down with it, so the worst case is the default layout.
 */
export function parseLayout(raw: unknown): DashboardLayout {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LAYOUT, order: [...WIDGET_IDS] };

  const record = raw as { order?: unknown; hidden?: unknown };
  const order: WidgetId[] = [];
  for (const id of Array.isArray(record.order) ? record.order : []) {
    if (isWidgetId(id) && !order.includes(id)) order.push(id);
  }
  // A widget added after this layout was saved goes on the end, visible.
  for (const id of WIDGET_IDS) {
    if (!order.includes(id)) order.push(id);
  }

  const hidden: WidgetId[] = [];
  for (const id of Array.isArray(record.hidden) ? record.hidden : []) {
    if (isWidgetId(id) && !hidden.includes(id)) hidden.push(id);
  }

  return { order, hidden };
}

/** Move one widget to `toIndex` in the full order. Out-of-range indexes clamp. */
export function moveWidget(
  layout: DashboardLayout,
  id: WidgetId,
  toIndex: number,
): DashboardLayout {
  const from = layout.order.indexOf(id);
  if (from === -1) return layout;
  const order = layout.order.filter((entry) => entry !== id);
  const target = Math.max(0, Math.min(order.length, toIndex));
  order.splice(target, 0, id);
  return { ...layout, order };
}

/**
 * Move a widget one place among the VISIBLE widgets. The up/down buttons act
 * on what the user can see: stepping past a hidden widget would look like a
 * press that did nothing.
 */
export function stepWidget(
  layout: DashboardLayout,
  id: WidgetId,
  direction: -1 | 1,
): DashboardLayout {
  const visible = visibleWidgets(layout);
  const at = visible.indexOf(id);
  const neighbour = visible[at + direction];
  if (at === -1 || !neighbour) return layout;
  // Both directions land on the neighbour's current index: moving down, taking
  // `id` out shifts the neighbour left by one, so its old index is now just
  // past it; moving up, the neighbour does not shift and `id` goes before it.
  return moveWidget(layout, id, layout.order.indexOf(neighbour));
}

export function setHidden(layout: DashboardLayout, id: WidgetId, hidden: boolean): DashboardLayout {
  const rest = layout.hidden.filter((entry) => entry !== id);
  return { ...layout, hidden: hidden ? [...rest, id] : rest };
}

export function visibleWidgets(layout: DashboardLayout): WidgetId[] {
  return layout.order.filter((id) => !layout.hidden.includes(id));
}

export function sameLayout(a: DashboardLayout, b: DashboardLayout): boolean {
  return (
    a.order.join() === b.order.join() && [...a.hidden].sort().join() === [...b.hidden].sort().join()
  );
}
