'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Flame, ShieldCheck, AlertTriangle } from 'lucide-react';

const TABS = [
  { href: '/settings/connections', label: 'Connections', icon: Settings },
  { href: '/settings/firefly', label: 'Firefly instance', icon: Flame },
  { href: '/settings/security', label: 'Security', icon: ShieldCheck },
  { href: '/settings/danger', label: 'Danger zone', icon: AlertTriangle },
] as const;

/**
 * One tab bar for all four settings pages.
 *
 * It scrolls rather than wraps on a narrow screen: four tabs plus icons do not
 * fit at 390px, and a wrapped second row reads as a separate control.
 */
export function SettingsTabs() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On a narrow screen the bar is wider than the viewport, and the tab you are
  // actually on can start off-screen — landing on "Danger zone" showed the
  // three tabs you are NOT on and no sign of the one you are. Bring it into
  // view, without scrolling the page itself.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pathname]);

  return (
    <nav aria-label="Settings" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-1 border-b">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeRef : undefined}
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? 'border-primary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
