'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarDays, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { RANGE_PRESETS, selectableYears, yearRange } from '@/lib/date-range';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * E3-02 — writes the choice to the URL; every page reads it from there.
 *
 * The preset list stops at "last year", and for a long time that was the whole
 * picker — which meant a two-year-old ledger had two thirds of itself
 * unreachable from the interface. `?start=&end=` resolved correctly the entire
 * time (`resolveRangeFromParams` has always handled it), so the data was never
 * the problem; there was simply no control that produced those parameters.
 * Anyone wanting 2023 had to hand-write a query string.
 *
 * So: the presets, then the calendar years the presets do not cover, then an
 * explicit range. The years are there because "show me 2023" is what people
 * actually want when they say "further back", and making them type two ISO
 * dates for it would be answering the letter of the request.
 */
export function DateRangePicker({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = React.useState(false);

  const push = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      // Any range change invalidates the page cursor: staying on page 7 of a
      // range that now has two pages shows an empty list and looks like data
      // loss.
      next.delete('page');
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  const selectPreset = (value: string) =>
    push((next) => {
      next.set('range', value);
      next.delete('start');
      next.delete('end');
    });

  const selectDates = (start: string, end: string) =>
    push((next) => {
      next.set('start', start);
      next.set('end', end);
      // `range` would win over the pair on the next read, pinning the view to
      // a preset while the URL claims otherwise.
      next.delete('range');
    });

  // Computed per render rather than memoised: it is five integers, and a stale
  // list on New Year's Eve would offer a year that has become "last year".
  const years = selectableYears(new Date());

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/*
            The visible label is `hidden sm:inline` and both icons are
            aria-hidden, so below `sm` this button had NO accessible name at
            all — a screen reader announced "button", and the only control for
            the period every figure on the page depends on was unidentifiable
            on a phone. The name carries the current range either way, so it
            answers "what am I looking at?" as well as "what does this do?".
          */}
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`Date range: ${label}`}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto">
          {RANGE_PRESETS.map((preset) => (
            <DropdownMenuItem key={preset.value} onSelect={() => selectPreset(preset.value)}>
              {preset.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground">Earlier years</DropdownMenuLabel>
          {years.map((year) => {
            const { start, end } = yearRange(year);
            return (
              <DropdownMenuItem key={year} onSelect={() => selectDates(start, end)}>
                {year}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCustomOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Custom range…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {customOpen ? (
        <CustomRangeDialog
          onClose={() => setCustomOpen(false)}
          onApply={(start, end) => {
            setCustomOpen(false);
            selectDates(start, end);
          }}
          initialStart={params.get('start') ?? ''}
          initialEnd={params.get('end') ?? ''}
        />
      ) : null}
    </>
  );
}

function CustomRangeDialog({
  onClose,
  onApply,
  initialStart,
  initialEnd,
}: {
  onClose: () => void;
  onApply: (start: string, end: string) => void;
  initialStart: string;
  initialEnd: string;
}) {
  const [start, setStart] = React.useState(initialStart);
  const [end, setEnd] = React.useState(initialEnd);

  // Ordered here as well as in resolveRangeFromParams. The server-side ordering
  // is the guarantee; this is so the person never sees a range they did not
  // ask for appear in the header after they pressed Apply.
  const ordered = start && end && start > end ? { start: end, end: start } : { start, end };
  const valid = Boolean(start && end);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Custom range"
      description="Any two dates. Everything on the page — figures, charts and reports — follows this range."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => onApply(ordered.start, ordered.end)}>
            Apply
          </Button>
        </>
      }
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onApply(ordered.start, ordered.end);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="range-start">From</Label>
          <Input
            id="range-start"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="range-end">To</Label>
          <Input
            id="range-end"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
        {/* Submits on Enter without a visible second button next to Apply. */}
        <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
        {start && end && start > end ? (
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Those are the wrong way round — they will be swapped.
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
