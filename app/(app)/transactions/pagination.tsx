'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * E5-03 — pagination over Firefly's `meta.pagination` contract.
 *
 * Split into three exports because the same pager is rendered TWICE: once
 * directly above the grid and once below it. Nobody should have to scroll a
 * fifty-row list back to the top to reach page two, and nobody should have to
 * scroll to the bottom to find out there is a page two at all.
 *
 * The pieces are separate so the top bar can interleave them with the export
 * control on one line instead of stacking a second band above the table — the
 * whole point of this pass was to spend fewer rows on chrome before the first
 * transaction.
 */

/** Move to a page, preserving every other filter in the URL. */
function usePager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const goTo = (next: number) => {
    const search = new URLSearchParams(params.toString());
    search.set('page', String(next));
    startTransition(() => router.push(`${pathname}?${search.toString()}`));
  };

  return { goTo, pending };
}

/**
 * Prev/next, icon-only on a phone.
 *
 * The words cost ~120px of a 360px line to say what two chevrons beside a
 * "2 / 7" already say, and that line also carries the count and the export
 * button. The accessible name stays the full word either way.
 */
export function PaginationButtons({
  page,
  totalPages,
  className,
}: {
  page: number;
  totalPages: number;
  className?: string;
}) {
  const { goTo, pending } = usePager();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="sm"
        className="max-sm:size-8 max-sm:p-0"
        disabled={page <= 1 || pending}
        onClick={() => goTo(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="max-sm:sr-only">Previous</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="max-sm:size-8 max-sm:p-0"
        disabled={page >= totalPages || pending}
        onClick={() => goTo(page + 1)}
        aria-label="Next page"
      >
        <span className="max-sm:sr-only">Next</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

/**
 * "Page 2 of 7 · 331 transactions", shortened to "2 / 7" on a phone.
 *
 * The long form is 190px at text-sm, which on a 360px line left the two pager
 * buttons nowhere to go but a second row.
 */
export function PaginationSummary({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  return (
    <p className="text-muted-foreground tabular min-w-0 truncate text-xs sm:text-sm">
      <span className="max-sm:sr-only">Page </span>
      {page}
      <span className="sm:hidden"> / </span>
      <span className="max-sm:sr-only"> of </span>
      {totalPages}
      <span className="max-sm:hidden"> · {total.toLocaleString()} transactions</span>
    </p>
  );
}

/**
 * The composed pager.
 *
 * `label` is not decoration: two `<nav>` landmarks with the same accessible
 * name is an axe `landmark-unique` violation, and this renders above AND below
 * the same table.
 */
export function Pagination({
  page,
  totalPages,
  total,
  label = 'Pagination',
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  label?: string;
  className?: string;
}) {
  return (
    <nav className={cn('flex items-center justify-between gap-3', className)} aria-label={label}>
      <PaginationSummary page={page} totalPages={totalPages} total={total} />
      <PaginationButtons page={page} totalPages={totalPages} />
    </nav>
  );
}
