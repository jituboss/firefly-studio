import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * E21-01 — the underlined section switcher.
 *
 * **These are links, not ARIA tabs, and that is the deliberate part.**
 *
 * `role="tablist"` promises a specific contract: the panels live in the same
 * document, arrow keys move between tabs, Tab moves out to the panel, and
 * switching costs nothing. Every tab in this app instead sets `?tab=` and
 * navigates — the panel is fetched, the URL is shareable, the back button
 * works. Announcing that as a tablist tells a screen-reader user to press the
 * right arrow and expect an instant switch; they would get a page load, or
 * nothing at all. A navigation landmark with `aria-current="page"` describes
 * what actually happens, and browsers already know how to operate links.
 *
 * No 'use client': this renders in Server Components, which is all eight of
 * the detail pages. `ReportTabs` wraps it from a client component to carry the
 * period query string across, which works because nothing here is stateful.
 *
 * It exists because that markup had been copy-pasted into eight detail pages
 * plus the reports layout, and the copies had already drifted — one had lost
 * its `aria-label`, one its `aria-current`, and none of them scrolled on a
 * narrow screen, so the later tabs on `/rules/[id]` were simply unreachable at
 * 390px.
 */

export interface TabItem {
  id: string;
  label: string;
  /** Overrides `basePath`-derived hrefs — used by the reports layout. */
  href?: string;
  /** A count or status shown after the label. */
  badge?: React.ReactNode;
}

export function Tabs({
  tabs,
  active,
  basePath,
  query,
  label,
  className,
  ...rest
}: {
  tabs: readonly TabItem[];
  /**
   * The `id` of the current tab. Always compared against `id`, never `href`:
   * the reports strip sets `id` to the route and `href` to that route plus the
   * live period query, and matching on `href` would mark nothing active the
   * moment a period was chosen.
   */
  active: string;
  /** Tab hrefs become `${basePath}?tab=${id}` unless the item supplies one. */
  basePath?: string;
  /**
   * Extra query params carried across every tab — the selected period, almost
   * always. Dropping it is the bug this prop exists to prevent: switching from
   * Transactions to Limits silently reset the range to the default, so the two
   * tabs reported different months and looked like they disagreed.
   */
  query?: Record<string, string | number | undefined>;
  /** Names the navigation landmark: "Subscription sections", "Reports". */
  label: string;
  className?: string;
} & Omit<React.ComponentProps<'nav'>, 'className' | 'aria-label'>) {
  return (
    <nav
      aria-label={label}
      /*
       * Bleed to the screen edges on mobile so a scrolled tab strip does not
       * look like it ends at the card's padding, and scroll rather than wrap:
       * a wrapped strip moves the content below it by a row height whenever the
       * window is resized past a tab boundary.
       */
      className={cn('border-border -mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0', className)}
      {...rest}
    >
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const href = tab.href ?? `${basePath ?? ''}?${buildQuery(tab.id, query)}`;
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  // The focus ring has to sit inside the strip: an outline on an
                  // element flush against an `overflow-x-auto` edge is clipped
                  // by the very scroll container that makes the strip work.
                  'focus-visible:ring-ring rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-inset',
                  isActive
                    ? 'border-primary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {tab.label}
                {tab.badge != null ? (
                  <span className="text-muted-foreground text-xs tabular-nums">{tab.badge}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function buildQuery(tab: string, extra?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams({ tab });
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}
