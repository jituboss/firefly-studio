'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Clock, Search, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  GROUP_LABELS,
  quoteIfNeeded,
  suggestAt,
  unknownOperators,
  type SearchOperator,
} from '@/lib/search-operators';

/**
 * E15-02 / E15-03 — search with operator autocomplete, a typo warning and
 * recent searches.
 *
 * The warning is the point. Firefly answers an unrecognised operator by
 * treating it as literal text, so `catagory_is:Food` returns zero results that
 * are indistinguishable from "you have no food spending" (verified live). This
 * says so before the search runs.
 *
 * Recent searches live in localStorage: they are a per-viewer convenience, not
 * account state, and they contain query fragments that should not be synced
 * anywhere. Saved searches — the durable, named kind — are the existing saved
 * views, which already persist server-side.
 */

const RECENT_KEY = 'fs:recent-searches';
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    // Private windows, blocked site data, and quota errors all land here.
    return [];
  }
}

function writeRecent(entries: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, RECENT_MAX)));
  } catch {
    // Not being able to remember a search is not worth an error.
  }
}

export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [value, setValue] = React.useState(initialQuery);
  const [caret, setCaret] = React.useState(initialQuery.length);
  const [open, setOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [highlight, setHighlight] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setRecent(readRecent()), []);
  React.useEffect(() => setValue(initialQuery), [initialQuery]);

  const suggestion = React.useMemo(() => suggestAt(value, caret), [value, caret]);
  const unknown = React.useMemo(() => unknownOperators(value), [value]);
  const showRecent = open && value.trim() === '' && recent.length > 0;
  const showOperators = open && suggestion.matches.length > 0 && value.trim() !== '';

  const submit = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      setRecent((current) => {
        const next = [trimmed, ...current.filter((entry) => entry !== trimmed)];
        writeRecent(next);
        return next.slice(0, RECENT_MAX);
      });
    }

    const next = new URLSearchParams(params.toString());
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    next.delete('page');
    setOpen(false);
    router.push(`${pathname}?${next.toString()}`);
  };

  /** Replace the token under the caret with `name:` and leave the caret after it. */
  const applyOperator = (operator: SearchOperator) => {
    const before = value.slice(0, suggestion.start);
    const after = value.slice(suggestion.end);
    const inserted = `${operator.name}:`;
    const next = `${before}${inserted}${after}`;
    setValue(next);
    setOpen(true);

    const position = before.length + inserted.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
      setCaret(position);
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (showOperators) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((index) => (index + 1) % suggestion.matches.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight(
          (index) => (index - 1 + suggestion.matches.length) % suggestion.matches.length,
        );
        return;
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && highlight > 0)) {
        const chosen = suggestion.matches[highlight];
        if (chosen) {
          event.preventDefault();
          applyOperator(chosen);
          return;
        }
      }
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      submit(value);
    }
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    /* `flex-1` at every width, not just from `sm`. Full-width on a phone is
       what forced every control after it onto a second row. */
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setCaret(event.target.selectionStart ?? event.target.value.length);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyUp={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          onClick={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          onFocus={() => setOpen(true)}
          // A click on a suggestion would otherwise blur first and unmount it.
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search, or type an operator…"
          aria-label="Search transactions"
          aria-expanded={showOperators || showRecent}
          role="combobox"
          aria-controls="search-suggestions"
          className={cn('pr-8 pl-8', unknown.length > 0 && 'border-warning')}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('');
              submit('');
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {unknown.length > 0 ? (
        <p className="text-warning mt-1 flex items-start gap-1.5 text-xs" role="status">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Firefly does not know {unknown.map((name) => `${name}:`).join(', ')} — it will be
            searched as plain text, which usually finds nothing.
          </span>
        </p>
      ) : null}

      {showOperators || showRecent ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="bg-popover absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border p-1 shadow-md"
        >
          {showRecent
            ? recent.map((entry) => (
                <li key={entry}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setValue(entry);
                      submit(entry);
                    }}
                    className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                  >
                    <Clock className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{entry}</span>
                  </button>
                </li>
              ))
            : suggestion.matches.map((operator, index) => (
                <li key={operator.name} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyOperator(operator)}
                    className={cn(
                      'flex w-full items-baseline gap-2 rounded px-2 py-1.5 text-left',
                      index === highlight ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                  >
                    <code className="shrink-0 font-mono text-xs">{operator.name}:</code>
                    <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                      {operator.hint}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[0.625rem] uppercase">
                      {GROUP_LABELS[operator.group]}
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      ) : null}

      {value.includes(':') && /\s/.test(value.split(':').pop() ?? '') ? (
        <p className="text-muted-foreground mt-1 text-xs">
          A value with a space needs quotes:{' '}
          <code className="font-mono">budget_is:{quoteIfNeeded('Everyday spending')}</code>
        </p>
      ) : null}
    </div>
  );
}
