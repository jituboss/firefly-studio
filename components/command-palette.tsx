'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useTheme } from 'next-themes';
import {
  ArrowLeftRight,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Wallet,
} from 'lucide-react';

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** E3-03 — ⌘K palette: navigation plus live transaction search. */
export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
      // `/` opens search, but not while typing in a field.
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        label="Command palette"
        shouldFilter={false}
        onClick={(event) => event.stopPropagation()}
        className="bg-popover w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search transactions, or jump to a page…"
            className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-hidden"
          />
          <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 py-0.5 text-[10px] sm:block">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
            {loading ? 'Searching…' : query.length >= 2 ? 'No matches.' : 'Type to search.'}
          </Command.Empty>

          {hits.length > 0 ? (
            <Command.Group
              heading="Transactions"
              className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
            >
              {hits.map((hit) => (
                <Command.Item
                  key={hit.id}
                  value={hit.id}
                  onSelect={() => go(hit.href)}
                  className="data-[selected=true]:bg-accent text-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm"
                >
                  <ArrowLeftRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                  <span className="flex-1 truncate">{hit.title}</span>
                  <span className="text-muted-foreground text-xs">{hit.subtitle}</span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group
            heading="Go to"
            className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
          >
            {[
              { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
              { label: 'Accounts', href: '/accounts', icon: Wallet },
              { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
              { label: 'New transaction', href: '/transactions/new', icon: Plus },
              { label: 'Connections', href: '/settings/connections', icon: Settings },
            ].map((item) => (
              <Command.Item
                key={item.href}
                value={`nav ${item.label}`}
                onSelect={() => go(item.href)}
                className="data-[selected=true]:bg-accent text-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm"
              >
                <item.icon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Theme"
            className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
          >
            <Command.Item
              value="theme light"
              onSelect={() => {
                setTheme('light');
                setOpen(false);
              }}
              className="data-[selected=true]:bg-accent text-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm"
            >
              <Sun className="size-4 shrink-0 opacity-60" aria-hidden="true" /> Light
            </Command.Item>
            <Command.Item
              value="theme dark"
              onSelect={() => {
                setTheme('dark');
                setOpen(false);
              }}
              className="data-[selected=true]:bg-accent text-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm"
            >
              <Moon className="size-4 shrink-0 opacity-60" aria-hidden="true" /> Dark
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
