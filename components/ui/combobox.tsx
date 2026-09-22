'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboOption {
  id: string;
  name: string;
  hint?: string;
}

/**
 * E5-17 — one debounced, cached picker over Firefly's 17 `/autocomplete/*`
 * endpoints. Allows a free-text value too, because Firefly creates expense and
 * revenue accounts, categories and tags on the fly when you name a new one.
 */
export function Combobox({
  endpoint,
  value,
  onChange,
  placeholder,
  id,
  allowFreeText = true,
  extraQuery,
  label,
}: {
  endpoint: string;
  value: string;
  onChange: (value: string, option?: ComboOption) => void;
  placeholder?: string;
  id?: string;
  allowFreeText?: boolean;
  extraQuery?: Record<string, string>;
  /**
   * Accessible name, where the surrounding form has no visible `<label>` for
   * this box. Optional so the callers that do have one are unaffected; a
   * placeholder is a hint, not a name, and it disappears the moment someone
   * types.
   */
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ComboOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Per-endpoint memo, so reopening a picker does not refetch.
  const cacheRef = React.useRef(new Map<string, ComboOption[]>());

  React.useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const key = `${endpoint}:${value}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      setOptions(cached);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ query: value, limit: '15', ...extraQuery });
        const response = await fetch(`/api/ff/v1/autocomplete/${endpoint}?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('lookup failed');
        const raw = (await response.json()) as Array<Record<string, unknown>>;
        const mapped: ComboOption[] = raw.map((row) => ({
          id: String(row.id ?? row.name ?? ''),
          name: String(row.name ?? row.title ?? row.value ?? ''),
          hint:
            typeof row.type === 'string'
              ? row.type
              : typeof row.currency_code === 'string'
                ? row.currency_code
                : undefined,
        }));
        cacheRef.current.set(key, mapped);
        setOptions(mapped);
        setActive(0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, value, endpoint, extraQuery]);

  function choose(option: ComboOption) {
    onChange(option.name, option);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          id={id}
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, options.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === 'Enter' && options[active]) {
              event.preventDefault();
              choose(options[active]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
          className="border-input bg-background focus-visible:outline-ring h-9 w-full rounded-md border px-3 pr-8 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        {loading ? (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
        ) : (
          <ChevronsUpDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50" />
        )}
      </div>

      {open && (options.length > 0 || (!allowFreeText && !loading)) ? (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="bg-popover absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-lg"
        >
          {options.map((option, index) => (
            <li key={`${option.id}-${option.name}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                  index === active ? 'bg-accent text-accent-foreground' : '',
                )}
              >
                <span className="flex-1 truncate">{option.name}</span>
                {option.hint ? (
                  <span className="text-muted-foreground text-xs">{option.hint}</span>
                ) : null}
                {option.name === value ? <Check className="size-3.5" /> : null}
              </button>
            </li>
          ))}
          {options.length === 0 && !loading ? (
            <li className="text-muted-foreground px-2 py-1.5 text-sm">No matches</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
