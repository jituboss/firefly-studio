'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Banknote,
  ChartPie,
  Coins,
  Flame,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Paperclip,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Shapes,
  Tags,
  Wallet,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandPalette } from '@/components/command-palette';
import { NotificationInbox } from '@/components/notifications/inbox';
import { ConnectionSwitcher, type SwitchableConnection } from '@/components/connection-switcher';
import { ConnectionBanner } from '@/components/connection-banner';
import { signOutAction } from '@/server/auth/actions';
import { DEMO_BANNER } from '@/lib/demo';
import type { notifications as notificationsSchema } from '@/server/db/schema';

type NotificationRow = typeof notificationsSchema.$inferSelect;

/**
 * M0 application shell. The information architecture is docs/PROJECT_PLAN.md §5.3;
 * E3-01 replaces this with the full collapsible sidebar, breadcrumb trail and
 * command palette.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Set until the milestone that implements the route lands. */
  milestone?: string;
}

const NAV_SECTIONS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'Accounts', icon: Wallet },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ],
  },
  {
    heading: 'Plan',
    items: [
      { href: '/budgets', label: 'Budgets', icon: Banknote },
      { href: '/categories', label: 'Categories', icon: Shapes },
      { href: '/bills', label: 'Subscriptions', icon: Receipt },
      { href: '/piggy-banks', label: 'Piggy banks', icon: PiggyBank },
      { href: '/attachments', label: 'Attachments', icon: Paperclip },
    ],
  },
  {
    heading: 'Analyse',
    items: [{ href: '/reports', label: 'Reports', icon: ChartPie }],
  },
  {
    heading: 'Automate',
    items: [
      { href: '/recurring', label: 'Recurring', icon: Repeat },
      { href: '/rules', label: 'Rules', icon: Workflow },
      { href: '/tags', label: 'Tags', icon: Tags },
      { href: '/currencies', label: 'Currencies', icon: Coins },
    ],
  },
];

/**
 * Where this app's source lives, for the AGPL §13 offer rendered in the nav.
 * A fork that changes the code has to change this to point at itself.
 */
const SOURCE_URL = 'https://github.com/jituboss/firefly-studio';

function SidebarNav({ onNavigate, version }: { onNavigate?: () => void; version?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-6 p-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.heading}>
          <p className="text-muted-foreground px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-wider uppercase">
            {section.heading}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
              const pending = Boolean(item.milestone);
              return (
                <li key={item.href}>
                  <Link
                    href={pending ? '/dashboard' : item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={pending || undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      pending && 'opacity-55',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.milestone ? (
                      <span className="text-muted-foreground border-border rounded border px-1 text-[0.625rem] font-medium">
                        {item.milestone}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/*
        Pinned to the bottom of the nav rather than sitting under the last
        item, so it does not read as another destination. `mt-auto` needs the
        nav to be a flex column that grows, which is why it is `flex-1`.
      */}
      {version ? (
        <p className="text-muted-foreground mt-auto px-3 pt-4 text-[0.6875rem] tabular-nums">
          {/*
            The link is not decoration. Firefly Studio is AGPL-3.0, and §13
            requires anyone running a modified copy for other people over a
            network to offer those users its source — an offer nobody can act
            on unless the running app itself points at it.
          */}
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            title={`Firefly Studio ${version} — source (AGPL-3.0)`}
          >
            v{version} · source
          </a>
        </p>
      ) : null}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  connections = [],
  notifications,
  version,
  isDemo = false,
}: {
  children: React.ReactNode;
  userName?: string;
  /** E2-26 — shows the banner, so nobody mistakes invented figures for theirs. */
  isDemo?: boolean;
  /** E2-23 — every Firefly instance this user has attached. */
  connections?: SwitchableConnection[];
  notifications?: NotificationRow[];
  /** The running build, from server/version.ts. */
  version?: string;
}): React.JSX.Element {
  const active = connections.find((entry) => entry.isDefault) ?? connections[0] ?? null;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const settingsActive = pathname.startsWith('/settings');

  // Without this the page behind the drawer keeps scrolling — including
  // sideways, which is what clipped the content off the left edge.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Escape closes the drawer.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    /*
     * `overflow-x-clip`, NOT `overflow-x-hidden`.
     *
     * CSS computes a `visible` axis to `auto` when the other axis is `hidden`,
     * so `overflow-x: hidden` here silently made this element a scroll
     * container for the whole app — and every `position: sticky` inside it was
     * measured against a scrollport that never moves. The app header declared
     * `sticky top-0` and scrolled straight off the screen; measured at
     * top=-900px after a 900px scroll, on every page.
     *
     * `clip` is the exception to that rule: paired with `overflow-y: visible`
     * the y axis stays visible, so no scroll container is created and sticky
     * works, while horizontal overflow is clipped exactly as before.
     */
    <div className="bg-background min-h-svh overflow-x-clip">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 px-5">
          <Flame className="text-primary size-5" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Firefly Studio</span>
        </div>
        <SidebarNav version={version} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            aria-label="Main navigation"
            className="bg-sidebar border-sidebar-border absolute inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto overscroll-contain border-r"
          >
            <div className="flex h-14 items-center gap-2 px-5">
              <Flame className="text-primary size-5" aria-hidden="true" />
              <span className="font-semibold tracking-tight">Firefly Studio</span>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} version={version} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-60">
        <header className="bg-background/80 border-border sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <ConnectionSwitcher connections={connections} />
          </div>

          {userName ? (
            <span className="text-muted-foreground hidden max-w-[16ch] truncate text-sm md:inline">
              {userName}
            </span>
          ) : null}

          <NotificationInbox notifications={notifications ?? []} />

          {/* Settings lives here rather than in the sidebar: it is a place you
              visit occasionally and leave, not one of the ledger views you move
              between. /settings redirects to the connections page. */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Settings"
            className={cn(settingsActive && 'bg-accent text-accent-foreground')}
          >
            <Link href="/settings">
              <Settings className="size-4" />
            </Link>
          </Button>

          <ThemeToggle />

          {/*
            E22-07 — tell the service worker to empty its cache on the way out.
            Nothing user-specific is stored in it by design, but "sign out" on a
            shared machine should not leave that promise resting on whether the
            reader trusts the worker's fetch handler. Fire-and-forget: the sign
            out must not wait on it, or fail with it.
          */}
          <form
            action={signOutAction}
            onSubmit={() => {
              navigator.serviceWorker?.controller?.postMessage('clear-cache');
            }}
          >
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>

        {/* E2-25 — a broken connection must announce itself. Without this a
            revoked token looks exactly like a quiet month: every page renders,
            every figure is just stale. */}
        {active && active.status && active.status !== 'ok' ? (
          <ConnectionBanner label={active.label} status={active.status} connectionId={active.id} />
        ) : null}

        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {isDemo ? (
            <div
              role="status"
              className="border-warning/40 bg-warning-muted text-warning mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm"
            >
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0">{DEMO_BANNER}</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
