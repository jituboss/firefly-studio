'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  ChartPie,
  Coins,
  Compass,
  Ellipsis,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Paperclip,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  Settings,
  Shapes,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Tags,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';
import {
  AddSheet,
  type AddSheetAccount,
  type QuickAddPrefill,
} from '@/components/transactions/add-sheet';
import { START_TOUR_EVENT } from '@/components/product-tour';
import {
  NAV_DESTINATIONS,
  destination,
  isActiveHref,
  type MobileNavSlots,
  type NavDestinationId,
} from '@/lib/mobile-nav';
import { saveMobileNavAction } from '@/server/mobile-nav-actions';
import { signOutAction } from '@/server/auth/actions';

/**
 * The phone's bottom navigation: Home · [slot] · Add · [slot] · More.
 *
 * Phones only (`sm:hidden`). Tablets and desktops keep the sidebar and the
 * header exactly as they were; on a phone the header's settings, help, theme
 * and sign-out move into More, and the hamburger drawer is replaced by it.
 *
 * The bar gets out of the way three ways: it slides away while scrolling down
 * and back on scrolling up; it hides while an input has focus, when the
 * on-screen keyboard would otherwise push it into the middle of the form; and
 * it gives way to a selection toolbar — see `useHideMobileNav`.
 */

const HOLD_EVENT = 'fs:mobile-nav-hold';

/**
 * Hide the bar while `active` — for a component that puts its own toolbar at
 * the bottom of a phone screen (the transaction list's bulk-action bar), so
 * the two do not stack. Counted, so two holders cannot release each other.
 */
export function useHideMobileNav(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    window.dispatchEvent(new CustomEvent(HOLD_EVENT, { detail: 1 }));
    return () => {
      window.dispatchEvent(new CustomEvent(HOLD_EVENT, { detail: -1 }));
    };
  }, [active]);
}

const ICONS: Record<NavDestinationId, React.ComponentType<{ className?: string }>> = {
  transactions: ArrowLeftRight,
  budgets: Banknote,
  reports: ChartPie,
  accounts: Wallet,
  categories: Shapes,
  bills: Receipt,
  'piggy-banks': PiggyBank,
};

/** Everything reachable from More — including the two slot destinations, which a user may swap out. */
const MORE_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/budgets', label: 'Budgets', icon: Banknote },
  { href: '/reports', label: 'Reports', icon: ChartPie },
  { href: '/categories', label: 'Categories', icon: Shapes },
  { href: '/bills', label: 'Subscriptions', icon: Receipt },
  { href: '/piggy-banks', label: 'Piggy banks', icon: PiggyBank },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/rules', label: 'Rules', icon: Workflow },
  { href: '/tags', label: 'Tags', icon: Tags },
  { href: '/currencies', label: 'Currencies', icon: Coins },
  { href: '/attachments', label: 'Attachments', icon: Paperclip },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Scroll distance before the bar reacts, so a finger's jitter does not flicker it. */
const SCROLL_SLOP = 8;

export function MobileNav({
  slots,
  today,
  currency,
  isAdmin = false,
  version,
  sourceUrl,
  userName,
}: {
  slots: MobileNavSlots;
  /** Shown at the top of More — the phone header has no room for it. */
  userName?: string;
  /** Today in the user's timezone, for the add panel's date. */
  today: string;
  currency: string;
  isAdmin?: boolean;
  version?: string;
  sourceUrl: string;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = React.useState<'none' | 'add' | 'more'>('none');
  const [prefill, setPrefill] = React.useState<{ key: number; value: QuickAddPrefill } | null>(
    null,
  );
  const [accounts, setAccounts] = React.useState<AddSheetAccount[]>([]);
  const [scrolledAway, setScrolledAway] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [holds, setHolds] = React.useState(0);

  const hidden = scrolledAway || typing || holds > 0;

  // Held locally so a saved change shows at once rather than after the
  // layout re-renders; the prop wins again whenever the server sends one.
  const [current, setCurrent] = React.useState(slots);
  const { second: slotSecond, fourth: slotFourth } = slots;
  React.useEffect(
    () => setCurrent({ second: slotSecond, fourth: slotFourth }),
    [slotSecond, slotFourth],
  );

  // Close every menu on navigation — a More link has done its job once the
  // route changes, and a panel left open over the new page would hide it.
  React.useEffect(() => {
    setMenu('none');
    setScrolledAway(false);
  }, [pathname]);

  React.useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < SCROLL_SLOP) return;
      // Near the top it always shows: there is nothing to make room for.
      setScrolledAway(delta > 0 && y > 64);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const isField = (node: EventTarget | null) =>
      node instanceof HTMLElement &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) || node.isContentEditable) &&
      !(node instanceof HTMLInputElement && /^(checkbox|radio|button|submit)$/.test(node.type));
    const onFocusIn = (event: FocusEvent) => setTyping(isField(event.target));
    const onFocusOut = () => setTyping(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  React.useEffect(() => {
    const onHold = (event: Event) => {
      const delta = (event as CustomEvent<number>).detail;
      setHolds((count) => Math.max(0, count + delta));
    };
    window.addEventListener(HOLD_EVENT, onHold);
    return () => window.removeEventListener(HOLD_EVENT, onHold);
  }, []);

  // Published on <html> so page CSS can follow it: anything sticky to the
  // bottom of a phone screen offsets itself by `--mobile-nav-offset`, which
  // drops to zero while the bar is out of the way (app/globals.css).
  React.useEffect(() => {
    const root = document.documentElement;
    if (hidden) root.dataset.mobileNav = 'hidden';
    else delete root.dataset.mobileNav;
    return () => {
      delete root.dataset.mobileNav;
    };
  }, [hidden]);

  // The accounts for the add panel, fetched the first time Add is opened rather
  // than on every page load for a menu most page views never open.
  const loaded = React.useRef(false);
  React.useEffect(() => {
    if (menu !== 'add' || loaded.current) return;
    loaded.current = true;
    fetch('/api/ff/v1/accounts?type=asset&limit=100')
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          payload: {
            data?: Array<{ id: string; attributes: { name: string; active: boolean } }>;
          } | null,
        ) => {
          setAccounts(
            (payload?.data ?? [])
              .filter((account) => account.attributes.active)
              .map((account) => ({ id: account.id, name: account.attributes.name })),
          );
        },
      )
      .catch(() => {
        // The panel falls back to an account picker when this list is empty.
        loaded.current = false;
      });
  }, [menu]);

  function startAdd(value: QuickAddPrefill) {
    setPrefill({ key: Date.now(), value });
    setMenu('none');
  }

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { ...destination(current.second), icon: ICONS[current.second] },
    null,
    { ...destination(current.fourth), icon: ICONS[current.fourth] },
  ];

  return (
    <>
      <nav
        aria-label="Primary"
        data-tour="bottom-nav"
        data-print="hide"
        className={cn(
          'bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur sm:hidden',
          'transition-transform duration-200 motion-reduce:transition-none',
          hidden && 'translate-y-full',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid h-16 grid-cols-5 items-stretch px-1">
          {tabs.map((tab) =>
            tab === null ? (
              <li key="add" className="flex justify-center">
                <button
                  type="button"
                  data-tour="nav-add"
                  aria-haspopup="dialog"
                  aria-expanded={menu === 'add'}
                  onClick={() => setMenu((current) => (current === 'add' ? 'none' : 'add'))}
                  className="group -mt-5 flex flex-col items-center gap-0.5 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'bg-primary text-primary-foreground border-background flex size-14 items-center justify-center rounded-full border-4 shadow-lg transition-transform',
                      'group-focus-visible:ring-ring group-focus-visible:ring-2 group-active:scale-95',
                    )}
                  >
                    {menu === 'add' ? (
                      <X className="size-6" aria-hidden="true" />
                    ) : (
                      <Plus className="size-6" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium">
                    {menu === 'add' ? 'Close' : 'Add'}
                  </span>
                </button>
              </li>
            ) : (
              <li key={tab.href} className="flex">
                <NavTab
                  href={tab.href}
                  label={tab.label}
                  icon={tab.icon}
                  active={menu === 'none' && isActiveHref(pathname, tab.href)}
                  onNavigate={() => setMenu('none')}
                />
              </li>
            ),
          )}
          <li className="flex">
            <button
              type="button"
              data-tour="nav-more"
              aria-haspopup="dialog"
              aria-expanded={menu === 'more'}
              onClick={() => setMenu((current) => (current === 'more' ? 'none' : 'more'))}
              className={cn(
                'group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:outline-none',
                menu === 'more' ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <TabIcon active={menu === 'more'} icon={Ellipsis} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <AddMenu open={menu === 'add'} onClose={() => setMenu('none')} onChoose={startAdd} />

      {prefill ? (
        <AddSheet
          key={prefill.key}
          open
          onClose={() => setPrefill(null)}
          today={today}
          currency={currency}
          assetAccounts={accounts}
          initial={prefill.value}
        />
      ) : null}

      <MoreMenu
        open={menu === 'more'}
        onClose={() => setMenu('none')}
        slots={current}
        onSaved={setCurrent}
        isAdmin={isAdmin}
        version={version}
        sourceUrl={sourceUrl}
        userName={userName}
      />
    </>
  );
}

function TabIcon({
  active,
  icon: Icon,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={cn(
        'flex h-7 w-14 items-center justify-center rounded-full transition-colors',
        'group-focus-visible:ring-ring group-focus-visible:ring-2',
        active && 'bg-primary/12',
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] focus-visible:outline-none',
        active ? 'text-primary font-semibold' : 'text-muted-foreground font-medium',
      )}
    >
      <TabIcon active={active} icon={icon} />
      <span className="max-w-full truncate px-0.5">{label}</span>
    </Link>
  );
}

interface RecentEntry {
  id: string;
  prefill: QuickAddPrefill;
  title: string;
  subtitle: string;
  amount: string;
  tone: 'expense' | 'income' | 'transfer';
}

/**
 * The Add menu: pick a kind, or repeat one of the last few entries. Most of a
 * ledger is repeats — the same shop, the same bus fare — so a recent entry
 * that fills the whole form is usually the fastest path to a new one.
 */
function AddMenu({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (prefill: QuickAddPrefill) => void;
}) {
  const [recent, setRecent] = React.useState<RecentEntry[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch('/api/ff/v1/transactions?limit=12', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setRecent(toRecent(payload)))
      .catch(() => {
        if (!controller.signal.aborted) setRecent([]);
      });
    return () => controller.abort();
  }, [open]);

  const kinds = [
    {
      type: 'withdrawal' as const,
      label: 'Expense',
      hint: 'Money out',
      icon: ArrowUpRight,
      tone: 'bg-expense-muted text-expense',
    },
    {
      type: 'deposit' as const,
      label: 'Income',
      hint: 'Money in',
      icon: ArrowDownLeft,
      tone: 'bg-income-muted text-income',
    },
    {
      type: 'transfer' as const,
      label: 'Transfer',
      hint: 'Between accounts',
      icon: ArrowLeftRight,
      tone: 'bg-transfer-muted text-transfer',
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} side="bottom" title="Add" contentClassName="px-4 pb-5">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2.5">
          {kinds.map((kind) => (
            <button
              key={kind.type}
              type="button"
              onClick={() => onChoose({ type: kind.type })}
              className="hover:bg-accent/50 focus-visible:ring-ring flex min-h-24 flex-col items-start gap-2.5 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className={cn('flex size-9 items-center justify-center rounded-lg', kind.tone)}>
                <kind.icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{kind.label}</span>
                <span className="text-muted-foreground block text-xs">{kind.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <section aria-labelledby="add-recent" className="space-y-1">
          <div className="flex items-baseline justify-between">
            <h3
              id="add-recent"
              className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
            >
              Repeat a recent one
            </h3>
            <span className="text-muted-foreground text-xs">tap to prefill</span>
          </div>
          {recent === null ? (
            <p className="text-muted-foreground py-3 text-sm">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-muted-foreground py-3 text-sm">Nothing recent to repeat yet.</p>
          ) : (
            <ul className="divide-border divide-y">
              {recent.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(entry.prefill)}
                    className="hover:bg-accent/50 focus-visible:ring-ring -mx-2 flex min-h-13 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{entry.title}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {entry.subtitle}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'tabular shrink-0 text-sm font-semibold',
                        entry.tone === 'expense' && 'text-expense',
                        entry.tone === 'income' && 'text-income',
                        entry.tone === 'transfer' && 'text-transfer',
                      )}
                      data-slot="amount"
                    >
                      {entry.amount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/transactions/new"
          onClick={onClose}
          className="hover:bg-accent/40 flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium">Need splits or a receipt?</span>
            <span className="text-muted-foreground text-xs">Open the full form instead</span>
          </span>
          <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </Sheet>
  );
}

interface TransactionPayload {
  data?: Array<{
    id: string;
    attributes: {
      transactions: Array<{
        type: string;
        description: string;
        amount: string;
        currency_code: string;
        currency_decimal_places?: number;
        source_name: string | null;
        destination_name: string | null;
        category_name: string | null;
      }>;
    };
  }>;
}

/**
 * The last few single-split entries, one per description. A split transaction
 * is left out: the quick panel cannot hold splits, and repeating one as a
 * single line would silently drop all but its first.
 */
function toRecent(payload: TransactionPayload | null): RecentEntry[] {
  const seen = new Set<string>();
  const out: RecentEntry[] = [];
  for (const group of payload?.data ?? []) {
    const splits = group.attributes.transactions;
    const split = splits[0];
    if (!split || splits.length !== 1) continue;
    if (split.type !== 'withdrawal' && split.type !== 'deposit' && split.type !== 'transfer')
      continue;
    const key = split.description.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const yoursIsSource = split.type !== 'deposit';
    const account = (yoursIsSource ? split.source_name : split.destination_name) ?? undefined;
    const counterparty = (yoursIsSource ? split.destination_name : split.source_name) ?? undefined;
    const tone =
      split.type === 'withdrawal' ? 'expense' : split.type === 'deposit' ? 'income' : 'transfer';
    // Firefly sends twelve decimal places; the form wants the currency's own.
    const places = split.currency_decimal_places ?? 2;
    const [whole, fraction = ''] = split.amount.split('.');
    const amount =
      places > 0 ? `${whole}.${fraction.padEnd(places, '0').slice(0, places)}` : whole!;

    out.push({
      id: group.id,
      title: split.description,
      subtitle: [account, counterparty].filter(Boolean).join(' → '),
      amount: `${tone === 'expense' ? '−' : tone === 'income' ? '+' : ''}${amount} ${split.currency_code}`,
      tone,
      prefill: {
        type: split.type,
        account,
        counterparty,
        category: split.category_name ?? undefined,
        amount,
        description: split.description,
      },
    });
    if (out.length === 3) break;
  }
  return out;
}

const THEMES = [
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

/**
 * More: every section, plus what the phone header no longer carries —
 * settings, theme, help and sign-out — and the source link the AGPL requires
 * the running app to offer (it lives in the sidebar everywhere else).
 */
function MoreMenu({
  open,
  onClose,
  slots,
  onSaved,
  isAdmin,
  version,
  sourceUrl,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  slots: MobileNavSlots;
  onSaved: (slots: MobileNavSlots) => void;
  isAdmin: boolean;
  version?: string;
  sourceUrl: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [second, setSecond] = React.useState<NavDestinationId>(slots.second);
  const [fourth, setFourth] = React.useState<NavDestinationId>(slots.fourth);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) setEditing(false);
    setSecond(slots.second);
    setFourth(slots.fourth);
  }, [open, slots.second, slots.fourth]);

  const links = isAdmin
    ? [...MORE_LINKS, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
    : MORE_LINKS;

  async function saveSlots() {
    setSaving(true);
    try {
      onSaved(await saveMobileNavAction({ second, fourth }));
      setEditing(false);
      router.refresh();
      toast.success('Bottom bar updated');
    } catch {
      toast.error('Could not save the bar. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} side="bottom" title="More" contentClassName="px-4 pb-5">
      <div className="space-y-5">
        {/* Who is signed in. The desktop header shows the name; a phone header
            has no room, so it lives here, one tap from account security. */}
        {userName ? (
          <Link
            href="/settings/security"
            onClick={onClose}
            className="hover:bg-accent/50 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2"
          >
            <span
              aria-hidden="true"
              className="bg-primary/12 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase"
            >
              {userName.trim().charAt(0) || '?'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground block text-xs">Signed in as</span>
              <span className="block truncate text-sm font-medium">{userName}</span>
            </span>
            <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : null}

        <ul className="grid grid-cols-4 gap-2">
          {links.map((link) => {
            const active = isActiveHref(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-visible:ring-ring flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-xl px-1 text-center text-[11px] font-medium focus-visible:ring-2 focus-visible:outline-none',
                    active ? 'bg-primary/12 text-primary' : 'bg-muted/60 hover:bg-accent',
                  )}
                >
                  <link.icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="divide-border divide-y border-y">
          <div className="flex min-h-12 items-center gap-3">
            <Sun className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="flex-1 text-sm">Theme</span>
            <div role="group" aria-label="Theme" className="flex rounded-lg border p-0.5">
              {THEMES.map((option) => {
                const on = mounted && theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'focus-visible:ring-ring flex min-h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none',
                      on ? 'bg-muted text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <option.icon className="size-3.5" aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new Event(START_TOUR_EVENT));
            }}
            className="flex min-h-12 w-full items-center gap-3 text-left text-sm"
          >
            <Compass className="text-muted-foreground size-4" aria-hidden="true" />
            Help and product tour
          </button>

          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((value) => !value)}
            className="flex min-h-12 w-full items-center gap-3 text-left text-sm"
          >
            <SlidersHorizontal className="text-muted-foreground size-4" aria-hidden="true" />
            Customize this bar
          </button>

          {editing ? (
            <div className="space-y-3 py-3">
              <p className="text-muted-foreground text-xs">
                Home, Add and More stay put. Choose the other two tabs.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SlotPicker
                  id="slot-second"
                  label="Second tab"
                  value={second}
                  other={fourth}
                  onChange={setSecond}
                />
                <SlotPicker
                  id="slot-fourth"
                  label="Fourth tab"
                  value={fourth}
                  other={second}
                  onChange={setFourth}
                />
              </div>
              <Button size="sm" onClick={saveSlots} disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save bar'}
              </Button>
            </div>
          ) : null}

          <form
            action={signOutAction}
            onSubmit={() => {
              navigator.serviceWorker?.controller?.postMessage('clear-cache');
            }}
          >
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 text-left text-sm"
            >
              <LogOut className="text-muted-foreground size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>

        {version ? (
          <p className="text-muted-foreground text-center text-[0.6875rem] tabular-nums">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground"
            >
              Firefly Studio v{version} · source
            </a>
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

function SlotPicker({
  id,
  label,
  value,
  other,
  onChange,
}: {
  id: string;
  label: string;
  value: NavDestinationId;
  /** The other slot's choice — offered, but not selectable, so the bar never repeats a tab. */
  other: NavDestinationId;
  onChange: (value: NavDestinationId) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as NavDestinationId)}
      >
        {NAV_DESTINATIONS.map((entry) => (
          <option key={entry.id} value={entry.id} disabled={entry.id === other}>
            {entry.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
