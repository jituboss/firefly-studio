'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useTheme } from 'next-themes';
import {
  ArrowLeftRight,
  ChartPie,
  Compass,
  LayoutDashboard,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import {
  COMMAND_GROUPS,
  highlight,
  matchText,
  searchCommands,
  type CommandGroup,
  type Range,
} from '@/lib/command-catalog';
import { START_TOUR_EVENT } from '@/components/product-tour';

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const GROUP_ICON: Record<CommandGroup, React.ComponentType<{ className?: string }>> = {
  Pages: LayoutDashboard,
  Create: Plus,
  Reports: ChartPie,
  Settings: Settings,
};

const THEME_OPTIONS = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'System theme', icon: Monitor },
] as const;

const ITEM_CLASS =
  'data-[selected=true]:bg-accent text-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm';
const GROUP_CLASS =
  'text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium';

/** A label with the matched letters marked, so it is visible WHY a row matched. */
function Highlighted({ text, ranges }: { text: string; ranges: Range[] }) {
  return (
    <>
      {highlight(text, ranges).map((part, index) =>
        part.hit ? (
          <mark key={index} className="text-foreground bg-primary/20 rounded-sm font-semibold">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * E3-03 — ⌘K palette: every page, create action, report and setting, the
 * themes and the tour, plus live transaction search.
 *
 * cmdk's own filtering stays OFF (`shouldFilter={false}`) because transaction
 * hits come from the server; the catalogue is filtered and ranked by
 * `lib/command-catalog.ts` instead, with the matched letters highlighted, and
 * the top result is selected so Enter goes straight to it.
 */
export function CommandPalette({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState('');

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (!openRef.current) returnFocusTo.current = document.activeElement as HTMLElement | null;
        setOpen((value) => !value);
      }
      // E21-06 — the panel has rendered an "ESC" hint since it was built and
      // nothing ever listened for the key. Clicking the backdrop was the only
      // way out, which is not a way out for anyone using a keyboard: opened by
      // keyboard, closable only by mouse, is a trap.
      if (event.key === 'Escape') {
        setOpen(false);
      }
      // `/` opens search, but not while typing in a field.
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        if (!openRef.current) returnFocusTo.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
      if ((event.key === 'n' || event.key === 'N') && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        router.push('/transactions/new');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  /**
   * E21-06 — put focus back where it came from. Without this, closing the
   * palette drops focus onto <body>, and the next Tab restarts from the top of
   * the page rather than from whatever the user was working on.
   *
   * The element is captured in the key handler, NOT in an effect on `open`.
   * The input carries `autoFocus`, so by the time an effect runs the active
   * element is already the palette's own search box — the effect version
   * dutifully stored that, tried to restore focus to a node that had just been
   * unmounted, and left focus on <body>. Which is exactly what it was written
   * to prevent, while looking correct.
   */
  const returnFocusTo = React.useRef<HTMLElement | null>(null);
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
    if (!open) {
      returnFocusTo.current?.focus?.();
      returnFocusTo.current = null;
    }
  }, [open]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ff/v1/search/transactions?query=${encodeURIComponent(query)}&limit=8`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('search failed');
        const payload = (await response.json()) as {
          data: Array<{
            id: string;
            attributes: {
              transactions: Array<{ description: string; amount: string; date: string }>;
            };
          }>;
        };
        setHits(
          payload.data.map((row) => ({
            id: row.id,
            title: row.attributes.transactions[0]?.description ?? '(no description)',
            subtitle: row.attributes.transactions[0]?.date?.slice(0, 10) ?? '',
            href: `/transactions/${row.id}`,
          })),
        );
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  const commands = searchCommands(query, isAdmin);
  const themes = THEME_OPTIONS.map((option) => ({
    option,
    match: matchText(query, option.label, 'appearance mode'),
  })).filter((entry) => entry.match);
  const tourMatch = matchText(query, 'Take the product tour', 'help guide onboarding');

  // The first row, in display order: commands first (they are instant), then
  // themes, the tour, and the transaction hits that arrive later.
  const firstValue =
    (commands[0] && `cmd:${commands[0].entry.id}`) ??
    (themes[0] && `theme:${themes[0].option.value}`) ??
    (tourMatch ? 'help:tour' : undefined) ??
    (hits[0] && `tx:${hits[0].id}`) ??
    '';

  // Re-select the top match whenever the query or the results change; without
  // this cmdk keeps the previous selection, which may no longer be on screen.
  React.useEffect(() => {
    setSelected(firstValue);
  }, [firstValue]);

  if (!open) return null;

  const searching = query.trim().length > 0;
  const grouped = searching
    ? // Ranked: one flat list, best first, so the highlight on row one is the answer.
      [{ group: 'Best matches' as const, items: commands }]
    : COMMAND_GROUPS.map((group) => ({
        group,
        items: commands.filter((result) => result.entry.group === group),
      }));
  const nothing = commands.length === 0 && themes.length === 0 && !tourMatch && hits.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh] sm:pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      {/*
        role/aria-modal go on the panel, not the backdrop: the backdrop is
        decoration, and naming it as the dialog would put the whole dimmed
        page inside the dialog's boundary. Without these the panel was an
        anonymous <div> — nothing announced that it had opened, and the page
        behind it stayed in the accessibility tree as if still reachable.
      */}
      <Command
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        label="Command palette"
        shouldFilter={false}
        value={selected}
        onValueChange={setSelected}
        onClick={(event) => event.stopPropagation()}
        className="bg-popover w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages and transactions…"
            className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-hidden"
          />
          <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 py-0.5 text-[10px] sm:block">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[min(64vh,34rem)] overflow-y-auto overscroll-contain p-2">
          {nothing ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {loading ? 'Searching…' : 'No matches.'}
            </p>
          ) : null}

          {grouped.map(({ group, items }) =>
            items.length === 0 ? null : (
              <Command.Group key={group} heading={group} className={GROUP_CLASS}>
                {items.map(({ entry, ranges }) => {
                  const Icon = GROUP_ICON[entry.group];
                  return (
                    <Command.Item
                      key={entry.id}
                      value={`cmd:${entry.id}`}
                      onSelect={() => go(entry.href)}
                      className={ITEM_CLASS}
                    >
                      <Icon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                      <span className="flex-1 truncate">
                        <Highlighted text={entry.label} ranges={ranges} />
                      </span>
                      {searching ? (
                        <span className="text-muted-foreground text-xs">{entry.group}</span>
                      ) : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ),
          )}

          {themes.length > 0 ? (
            <Command.Group heading="Theme" className={GROUP_CLASS}>
              {themes.map(({ option, match }) => (
                <Command.Item
                  key={option.value}
                  value={`theme:${option.value}`}
                  onSelect={() => {
                    setTheme(option.value);
                    setOpen(false);
                  }}
                  className={ITEM_CLASS}
                >
                  <option.icon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                  <Highlighted text={option.label} ranges={match!.ranges} />
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          {tourMatch ? (
            <Command.Group heading="Help" className={GROUP_CLASS}>
              <Command.Item
                value="help:tour"
                onSelect={() => {
                  setOpen(false);
                  window.dispatchEvent(new Event(START_TOUR_EVENT));
                }}
                className={ITEM_CLASS}
              >
                <Compass className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                <Highlighted text="Take the product tour" ranges={tourMatch.ranges} />
              </Command.Item>
            </Command.Group>
          ) : null}

          {hits.length > 0 || (searching && loading) ? (
            <Command.Group heading="Transactions" className={GROUP_CLASS}>
              {hits.length === 0 ? (
                <p className="text-muted-foreground px-2 py-2 text-sm">Searching…</p>
              ) : null}
              {hits.map((hit) => (
                <Command.Item
                  key={hit.id}
                  value={`tx:${hit.id}`}
                  onSelect={() => go(hit.href)}
                  className={ITEM_CLASS}
                >
                  <ArrowLeftRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                  <span className="flex-1 truncate">
                    <Highlighted
                      text={hit.title}
                      ranges={matchText(query, hit.title)?.ranges ?? []}
                    />
                  </span>
                  <span className="text-muted-foreground text-xs">{hit.subtitle}</span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}
        </Command.List>
      </Command>
    </div>
  );
}
