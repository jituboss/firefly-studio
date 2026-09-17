'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Banknote,
  CalendarClock,
  ChartPie,
  Coins,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Shapes,
  Tags,
  Wallet,
  Webhook,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandPalette } from '@/components/command-palette';
import { NotificationInbox } from '@/components/notifications/inbox';
import { signOutAction } from '@/server/auth/actions';
import type { notifications as notificationsSchema } from '@/server/db/schema';

type NotificationRow = typeof notificationsSchema.$inferSelect;

/**
 * M0 application shell. The information architecture is PROJECT_PLAN.md §5.3;
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
    ],
  },
  {
    heading: 'Analyse',
    items: [{ href: '/reports', label: 'Reports', icon: ChartPie }],
  },
  {
    heading: 'Automate',
    items: [
      { href: '/recurring', label: 'Recurring', icon: Repeat, milestone: 'M6' },
      { href: '/rules', label: 'Rules', icon: Workflow, milestone: 'M6' },
      { href: '/tags', label: 'Tags', icon: Tags, milestone: 'M6' },
      { href: '/currencies', label: 'Currencies', icon: Coins, milestone: 'M6' },
      { href: '/webhooks', label: 'Webhooks', icon: Webhook, milestone: 'M6' },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { href: '/settings/connections', label: 'Connections', icon: Settings },
      { href: '/reports-scheduled', label: 'Scheduled', icon: CalendarClock, milestone: 'M5' },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-6 p-3">
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
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  connectionLabel,
  connectionStatus,
  notifications,
}: {
  children: React.ReactNode;
  userName?: string;
  connectionLabel?: string | null;
  connectionStatus?: string | null;
  notifications?: NotificationRow[];
}): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
    <div className="bg-background min-h-svh overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 px-5">
          <Flame className="text-primary size-5" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Firefly Studio</span>
        </div>
        <SidebarNav />
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
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
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
          <div className="flex-1">
            {connectionLabel ? (
              <span className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:inline-flex">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 rounded-full',
                    connectionStatus === 'ok' ? 'bg-income' : 'bg-warning',
                  )}
                />
                {connectionLabel}
                <span className="sr-only">
                  {connectionStatus === 'ok' ? 'connected' : `status: ${connectionStatus}`}
                </span>
              </span>
            ) : null}
          </div>

          {userName ? (
            <span className="text-muted-foreground hidden max-w-[16ch] truncate text-sm md:inline">
              {userName}
            </span>
          ) : null}

          <NotificationInbox notifications={notifications ?? []} />

          <ThemeToggle />

          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>

        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
