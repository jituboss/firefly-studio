'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster';
import {
  DEFAULT_LAYOUT,
  PRESETS,
  isPresetId,
  moveWidget,
  presetLayout,
  sameLayout,
  setHidden,
  stepWidget,
  visibleWidgets,
  widgetLabel,
  widgetSpan,
  type DashboardLayout,
  type WidgetId,
} from '@/lib/dashboard-layout';
import { saveDashboardLayoutAction } from '@/server/dashboard-actions';

const CUSTOMIZE_EVENT = 'fs:dashboard-customize';

/**
 * E3-12 — the button that opens customize mode. It sits in the page header
 * with the other controls, which the grid does not render, so the two talk
 * through a window event rather than a context that would force the whole
 * header to become a client component.
 */
export function CustomizeDashboardButton() {
  return (
    <span data-tour="customize" className="inline-flex">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.dispatchEvent(new Event(CUSTOMIZE_EVENT))}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        <span className="max-sm:sr-only">Customize</span>
      </Button>
    </span>
  );
}

export interface DashboardWidget {
  id: WidgetId;
  node: React.ReactNode;
}

/**
 * E3-12 — the dashboard's widgets, in the user's order, with an edit mode that
 * reorders them (drag on a pointer device, arrow buttons everywhere) and hides
 * or shows them. Nothing is saved until "Done", so "Cancel" is a real undo.
 *
 * Widgets arrive already rendered by the Server Component. A widget with
 * nothing to show (no pinned reports) is simply absent from `widgets`; it keeps
 * its place in the layout so it appears where it was once it has content.
 */
export function DashboardGrid({
  widgets,
  initialLayout,
}: {
  widgets: DashboardWidget[];
  initialLayout: DashboardLayout;
}) {
  const [saved, setSaved] = React.useState(initialLayout);
  const [layout, setLayout] = React.useState(initialLayout);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dragging, setDragging] = React.useState<WidgetId | null>(null);
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    const open = () => {
      setLayout(saved);
      setEditing(true);
    };
    window.addEventListener(CUSTOMIZE_EVENT, open);
    return () => window.removeEventListener(CUSTOMIZE_EVENT, open);
  }, [saved]);

  const rendered = new Map(widgets.map((widget) => [widget.id, widget.node]));
  const visible = visibleWidgets(layout).filter((id) => rendered.has(id) || editing);
  const hidden = layout.hidden;

  function update(next: DashboardLayout, message?: string) {
    setLayout(next);
    if (message) setAnnouncement(message);
  }

  async function save() {
    if (sameLayout(layout, saved)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await saveDashboardLayoutAction(layout);
      setSaved(result.layout);
      setLayout(result.layout);
      setEditing(false);
      toast.success('Dashboard layout saved');
    } catch {
      toast.error('Could not save the layout. Your changes are still here — try again.');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setLayout(saved);
    setEditing(false);
  }

  function onDrop(target: WidgetId) {
    if (!dragging || dragging === target) return;
    update(
      moveWidget(layout, dragging, layout.order.indexOf(target)),
      `${widgetLabel(dragging)} moved.`,
    );
    setDragging(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      {editing ? (
        <div className="bg-muted/60 border-border flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-medium">Customizing.</span>{' '}
            <span className="text-muted-foreground">
              Drag a widget or use its arrows to reorder. Changes save when you press Done.
            </span>
          </p>
          <Select
            aria-label="Start from a preset"
            containerClassName="w-auto"
            className="h-8 text-xs"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (isPresetId(value)) {
                update(
                  presetLayout(value),
                  `${PRESETS.find((p) => p.id === value)?.label} applied.`,
                );
              }
            }}
          >
            <option value="" disabled>
              Apply a preset…
            </option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ ...DEFAULT_LAYOUT }, 'Default layout restored.')}
          >
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Done'}
          </Button>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {visible.length === 0 && !editing ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Every widget is hidden. Use Customize to bring some back.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {visible.map((id, index) => {
          const node = rendered.get(id);
          const full = widgetSpan(id) === 'full';
          if (!editing) {
            return (
              <div key={id} className={cn('min-w-0', full && 'lg:col-span-2')}>
                {node}
              </div>
            );
          }
          return (
            <div
              key={id}
              draggable
              onDragStart={(event) => {
                setDragging(id);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', id);
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => {
                if (dragging) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(id);
              }}
              className={cn(
                'border-primary/40 bg-background min-w-0 rounded-xl border-2 border-dashed p-2',
                full && 'lg:col-span-2',
                dragging === id && 'opacity-50',
              )}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <GripVertical
                  className="text-muted-foreground size-4 shrink-0 cursor-grab"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {widgetLabel(id)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${widgetLabel(id)} up`}
                  disabled={index === 0}
                  onClick={() => update(stepWidget(layout, id, -1), `${widgetLabel(id)} moved up.`)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${widgetLabel(id)} down`}
                  disabled={index === visible.length - 1}
                  onClick={() =>
                    update(stepWidget(layout, id, 1), `${widgetLabel(id)} moved down.`)
                  }
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Hide ${widgetLabel(id)}`}
                  onClick={() => update(setHidden(layout, id, true), `${widgetLabel(id)} hidden.`)}
                >
                  <EyeOff className="size-4" />
                </Button>
              </div>
              {/* `inert`: links and buttons inside a widget must not fire while
                  it is being arranged, and must not be tab stops either. */}
              <div inert className="pointer-events-none opacity-80 select-none">
                {node ?? (
                  <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
                    Nothing to show yet — this appears once it has content.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && hidden.length > 0 ? (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Hidden widgets</p>
          <ul className="flex flex-wrap gap-2">
            {layout.order
              .filter((id) => hidden.includes(id))
              .map((id) => (
                <li key={id}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update(setHidden(layout, id, false), `${widgetLabel(id)} shown.`)
                    }
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    {widgetLabel(id)}
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
