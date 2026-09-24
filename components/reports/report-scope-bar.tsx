'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Check, ChevronDown, Columns2, Wallet } from 'lucide-react';
import { RANGE_PRESETS } from '@/lib/date-range';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * E14-01 — the controls every report shares.
 *
 * Writes to the URL rather than to component state, so a report someone is
 * looking at can be linked, bookmarked and printed to the same thing. Marked
 * `data-print="hide"`: controls are noise on paper.
 */

export interface ScopeAccount {
  id: string;
  name: string;
  currency: string | null;
}

export function ReportScopeBar({
  accounts,
  currencies,
  defaultCurrency,
}: {
  accounts: ScopeAccount[];
  currencies: string[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  // Derived here rather than passed in: this bar lives in the reports LAYOUT,
  // and a Next.js layout is not given searchParams — only a page is. Reading
  // them on the client keeps one bar above every report instead of repeating
  // it in each one.
  const start = params.get('start');
  const end = params.get('end');
  const presetValue = params.get('range') ?? 'this-month';
  const rangeLabel =
    start && end
      ? `${start} → ${end}`
      : (RANGE_PRESETS.find((entry) => entry.value === presetValue)?.label ?? 'This month');

  const selectedAccounts = (params.get('accounts') ?? '')
    .split(',')
    .filter((entry) => /^\d+$/.test(entry));
  const currency = (params.get('currency') ?? defaultCurrency).toUpperCase();
  const compare = params.get('compare') === '1';

  const push = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      // A scope change invalidates any drill-down paging already in the URL.
      next.delete('page');
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  const selected = new Set(selectedAccounts);

  const toggleAccount = (id: string) =>
    push((next) => {
      const updated = new Set(selected);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      if (updated.size === 0) next.delete('accounts');
      else next.set('accounts', [...updated].join(','));
    });

  const accountLabel =
    selected.size === 0
      ? 'All accounts'
      : selected.size === 1
        ? (accounts.find((account) => selected.has(account.id))?.name ?? '1 account')
        : `${selected.size} accounts`;

  return (
    <div
      data-print="hide"
      className="flex flex-wrap items-center gap-2"
      aria-busy={pending || undefined}
    >
      {/* Period */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            <CalendarDays className="size-4" aria-hidden="true" />
            <span className="max-w-[12ch] truncate">{rangeLabel}</span>
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {RANGE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onSelect={() =>
                push((next) => {
                  next.set('range', preset.value);
                  next.delete('start');
                  next.delete('end');
                })
              }
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account scope */}
      {accounts.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              <Wallet className="size-4" aria-hidden="true" />
              <span className="max-w-[14ch] truncate">{accountLabel}</span>
              <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Scope to accounts</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                push((next) => next.delete('accounts'));
              }}
            >
              <Check
                className={cn('size-4', selected.size === 0 ? 'opacity-100' : 'opacity-0')}
                aria-hidden="true"
              />
              All accounts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {accounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                onSelect={(event) => {
                  // Keep the menu open so several can be picked in one go.
                  event.preventDefault();
                  toggleAccount(account.id);
                }}
              >
                <Check
                  className={cn('size-4', selected.has(account.id) ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
                <span className="truncate">{account.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Currency — only worth showing on a multi-currency ledger. */}
      {currencies.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              {currency}
              <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Report in</DropdownMenuLabel>
            {currencies.map((code) => (
              <DropdownMenuItem
                key={code}
                onSelect={() => push((next) => next.set('currency', code))}
              >
                <Check
                  className={cn('size-4', code === currency ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
                {code}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Button
        variant={compare ? 'secondary' : 'outline'}
        size="sm"
        disabled={pending}
        aria-pressed={compare}
        onClick={() =>
          push((next) => {
            if (compare) next.delete('compare');
            else next.set('compare', '1');
          })
        }
      >
        <Columns2 className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Compare</span>
      </Button>
    </div>
  );
}
