'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * E14-01 — moving between reports must not reset the period you chose. Each
 * tab carries the whole current query string across, which is why this is a
 * client component rather than a plain list of `<Link>`s in the layout.
 */

export const REPORT_TABS = [
  { href: '/reports', label: 'Overview' },
  { href: '/reports/net-worth', label: 'Net worth' },
  { href: '/reports/income-expense', label: 'Income vs expense' },
  { href: '/reports/categories', label: 'Categories' },
  { href: '/reports/budgets', label: 'Budgets' },
  { href: '/reports/accounts', label: 'Accounts' },
  { href: '/reports/tags', label: 'Tags' },
  { href: '/reports/bills', label: 'Subscriptions' },
  { href: '/reports/cash-flow', label: 'Cash flow' },
  { href: '/reports/custom', label: 'Custom' },
] as const;

export function ReportTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  return (
    <nav
      aria-label="Reports"
      data-print="hide"
      className="border-border -mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-1">
        {REPORT_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={query ? `${tab.href}?${query}` : tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
