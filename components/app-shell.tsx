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
      { href: '/accounts', label: 'Accounts', icon: Wallet, milestone: 'M2' },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight, milestone: 'M2' },
    ],
  },
  {
    heading: 'Plan',
    items: [
      { href: '/budgets', label: 'Budgets', icon: Banknote, milestone: 'M4' },
      { href: '/categories', label: 'Categories', icon: Shapes, milestone: 'M4' },
      { href: '/bills', label: 'Subscriptions', icon: Receipt, milestone: 'M4' },
      { href: '/piggy-banks', label: 'Piggy banks', icon: PiggyBank, milestone: 'M4' },
    ],
  },
  {
    heading: 'Analyse',
    items: [{ href: '/reports', label: 'Reports', icon: ChartPie, milestone: 'M5' }],
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
      { href: '/recurring-jobs', label: 'Settings', icon: Settings, milestone: 'M1' },
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
              const active = pathname === item.href;
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-svh">
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
          <aside className="bg-sidebar border-sidebar-border absolute inset-y-0 left-0 w-64 overflow-y-auto border-r">
            <div className="flex h-14 items-center gap-2 px-5">
              <Flame className="text-primary size-5" aria-hidden="true" />
              <span className="font-semibold tracking-tight">Firefly Studio</span>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
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
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
