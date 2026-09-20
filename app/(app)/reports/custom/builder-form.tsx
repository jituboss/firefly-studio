'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Pin, PinOff, Save, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import {
  CHART_TYPES,
  DIMENSIONS,
  METRICS,
  insightPathFor,
  type CustomReportConfig,
} from '@/lib/custom-report';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input, Label } from '@/components/ui/input';
import { FormMessage } from '@/components/auth/form-shell';
import {
  deleteReportAction,
  saveReportAction,
  toggleReportPinAction,
  type SavedReportState,
} from '@/server/reports-actions';

/**
 * E14-10 — the builder controls.
 *
 * The selection lives in the URL like every other report scope, so a built
 * report is shareable before it is saved and the period picker above keeps
 * working unchanged. Saving is what writes it to `saved_reports`.
 */
export function BuilderForm({ config }: { config: CustomReportConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div
      className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy={pending || undefined}
    >
      <Field label="Measure" htmlFor="metric">
        <Select
          id="metric"
          value={config.metric}
          disabled={pending}
          onChange={(event) => set('metric', event.target.value)}
        >
          {METRICS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Grouped by" htmlFor="dimension">
        <Select
          id="dimension"
          value={config.dimension}
          disabled={pending}
          onChange={(event) => set('dimension', event.target.value)}
        >
          {DIMENSIONS.map((option) => {
            // Budgets and subscriptions only describe spending — Firefly has no
            // income equivalent — so they are disabled rather than silently
            // returning an empty report.
            const available = insightPathFor(config.metric, option.value) !== null;
            return (
              <option key={option.value} value={option.value} disabled={!available}>
                {option.label}
                {available ? '' : ' (spending only)'}
              </option>
            );
          })}
        </Select>
      </Field>

      <Field label="Shown as" htmlFor="chart">
        <Select
          id="chart"
          value={config.chart}
          disabled={pending}
          onChange={(event) => set('chart', event.target.value)}
        >
          {CHART_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rows" htmlFor="limit">
        <Select
          id="limit"
          value={String(config.limit)}
          disabled={pending}
          onChange={(event) => set('limit', event.target.value)}
        >
          {[5, 10, 15, 20, 30].map((option) => (
            <option key={option} value={option}>
              Top {option}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SubmitButton({
  children,
  variant = 'default',
  size = 'sm',
  label,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'icon';
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} aria-label={label}>
      {children}
    </Button>
  );
}

/** Save the current selection under a name, optionally pinned. */
export function SaveReportForm({ config }: { config: CustomReportConfig }) {
  const [state, action] = useActionState<SavedReportState, FormData>(saveReportAction, {});

  return (
    <form action={action} className="space-y-3" data-print="hide">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.saved ? <FormMessage tone="notice">{`Saved “${state.saved}”.`}</FormMessage> : null}

      {/* The selection travels with the form so what is saved is exactly what
          is on screen, not whatever the URL happens to say when it lands. */}
      <input type="hidden" name="metric" value={config.metric} />
      <input type="hidden" name="dimension" value={config.dimension} />
      <input type="hidden" name="chart" value={config.chart} />
      <input type="hidden" name="limit" value={String(config.limit)} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="report-name">Name</Label>
          <Input
            id="report-name"
            name="name"
            required
            maxLength={80}
            placeholder="Groceries by month"
          />
        </div>
        <label className="text-muted-foreground flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name="pin" className="accent-primary size-4" />
          Pin
        </label>
        <SubmitButton>
          <Save className="size-4" aria-hidden="true" />
          Save
        </SubmitButton>
      </div>
    </form>
  );
}

export interface SavedReportSummary {
  id: string;
  name: string;
  description: string;
  href: string;
  isPinned: boolean;
}

export function SavedReportList({ reports }: { reports: SavedReportSummary[] }) {
  const [, pinAction] = useActionState<SavedReportState, FormData>(toggleReportPinAction, {});
  const [, removeAction] = useActionState<SavedReportState, FormData>(deleteReportAction, {});

  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No saved reports yet. Build one above and give it a name.
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {reports.map((report) => (
        <li key={report.id} className="flex min-w-0 items-center gap-2 py-2">
          <a href={report.href} className="min-w-0 flex-1">
            <p
              className={cn('truncate text-sm', report.isPinned && 'font-medium')}
              title={report.name}
            >
              {report.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">{report.description}</p>
          </a>

          <form action={pinAction} data-print="hide">
            <input type="hidden" name="id" value={report.id} />
            <input type="hidden" name="pinned" value={String(report.isPinned)} />
            <SubmitButton
              variant="ghost"
              size="icon"
              label={report.isPinned ? `Unpin ${report.name}` : `Pin ${report.name}`}
            >
              {report.isPinned ? (
                <Pin className="text-primary size-4" aria-hidden="true" />
              ) : (
                <PinOff className="text-muted-foreground size-4" aria-hidden="true" />
              )}
            </SubmitButton>
          </form>

          <form action={removeAction} data-print="hide">
            <input type="hidden" name="id" value={report.id} />
            <ConfirmButton
              message={`Delete “${report.name}”? The report definition goes; nothing in your ledger changes.`}
              title="Delete saved report"
              confirmLabel="Delete report"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${report.name}`}
            >
              <Trash2 className="text-expense size-4" aria-hidden="true" />
            </ConfirmButton>
          </form>
        </li>
      ))}
    </ul>
  );
}
