'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';

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
    <Tabs
      label="Reports"
      active={pathname}
      data-print="hide"
      tabs={REPORT_TABS.map((tab) => ({
        id: tab.href,
        label: tab.label,
        href: query ? `${tab.href}?${query}` : tab.href,
      }))}
    />
  );
}
