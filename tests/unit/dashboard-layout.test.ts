import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  PRESETS,
  WIDGETS,
  isPresetId,
  moveWidget,
  parseLayout,
  presetLayout,
  sameLayout,
  setHidden,
  stepWidget,
  visibleWidgets,
} from '@/lib/dashboard-layout';

describe('parseLayout', () => {
  it('falls back to the default for anything that is not an object', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('kpis')).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout(42)).toEqual(DEFAULT_LAYOUT);
  });

  it('drops unknown ids and duplicates', () => {
    const layout = parseLayout({ order: ['recent', 'nope', 'recent', 'kpis'], hidden: ['x'] });
    expect(layout.order.slice(0, 2)).toEqual(['recent', 'kpis']);
    expect(new Set(layout.order).size).toBe(layout.order.length);
    expect(layout.hidden).toEqual([]);
  });

  it('appends a widget the stored layout has never heard of, visible', () => {
    const layout = parseLayout({ order: ['recent'], hidden: [] });
    expect(layout.order).toHaveLength(WIDGETS.length);
    expect(layout.order[0]).toBe('recent');
    expect(visibleWidgets(layout)).toHaveLength(WIDGETS.length);
  });

  it('keeps hidden widgets in the order so they can be switched back on in place', () => {
    const layout = parseLayout({ order: ['kpis', 'recent'], hidden: ['recent'] });
    expect(layout.order).toContain('recent');
    expect(visibleWidgets(layout)).not.toContain('recent');
  });
});

describe('moveWidget', () => {
  it('moves to an index and clamps out-of-range targets', () => {
    const start = parseLayout({ order: ['kpis', 'net-worth', 'accounts'] });
    expect(moveWidget(start, 'accounts', 0).order.slice(0, 3)).toEqual([
      'accounts',
      'kpis',
      'net-worth',
    ]);
    expect(moveWidget(start, 'kpis', 999).order.at(-1)).toBe('kpis');
    expect(moveWidget(start, 'kpis', -5).order[0]).toBe('kpis');
  });
});

describe('stepWidget', () => {
  const start = parseLayout({
    order: ['kpis', 'net-worth', 'accounts', 'recent'],
    hidden: ['net-worth'],
  });

  it('steps over hidden widgets, because the user cannot see them', () => {
    const moved = stepWidget(start, 'accounts', -1);
    expect(visibleWidgets(moved).slice(0, 2)).toEqual(['accounts', 'kpis']);
  });

  it('moves down one visible place', () => {
    const moved = stepWidget(start, 'kpis', 1);
    expect(visibleWidgets(moved).slice(0, 2)).toEqual(['accounts', 'kpis']);
  });

  it('is a no-op at either end', () => {
    expect(stepWidget(start, 'kpis', -1)).toBe(start);
    const last = visibleWidgets(start).at(-1)!;
    expect(stepWidget(start, last, 1)).toBe(start);
  });
});

describe('setHidden / sameLayout', () => {
  it('toggles without duplicating', () => {
    let layout = setHidden(DEFAULT_LAYOUT, 'bills', true);
    layout = setHidden(layout, 'bills', true);
    expect(layout.hidden).toEqual(['bills']);
    expect(setHidden(layout, 'bills', false).hidden).toEqual([]);
  });

  it('ignores the order of the hidden list', () => {
    const a = { order: DEFAULT_LAYOUT.order, hidden: ['bills', 'recent'] as const };
    const b = { order: DEFAULT_LAYOUT.order, hidden: ['recent', 'bills'] as const };
    expect(sameLayout(parseLayout(a), parseLayout(b))).toBe(true);
    expect(sameLayout(parseLayout(a), DEFAULT_LAYOUT)).toBe(false);
  });
});

describe('presets', () => {
  it('every preset lists every widget exactly once', () => {
    for (const preset of PRESETS) {
      expect([...preset.order].sort()).toEqual(WIDGETS.map((w) => w.id).sort());
      for (const id of preset.hidden) expect(preset.order).toContain(id);
    }
  });

  it('blank keeps only the headline figures and pinned reports visible', () => {
    expect(visibleWidgets(presetLayout('blank'))).toEqual(['kpis', 'pinned']);
  });

  it('recognises preset ids', () => {
    expect(isPresetId('saver')).toBe(true);
    expect(isPresetId('everything')).toBe(false);
  });
});
