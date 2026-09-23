import type { Metadata } from 'next';
import { Activity, ServerCog, Users } from 'lucide-react';
import { requireAdmin, adminCount } from '@/server/auth/roles';
import {
  adminStats,
  listAdminAuditActions,
  listAdminAuditLog,
  listAdminUsers,
  systemInfo,
} from '@/server/admin';
import { Tabs } from '@/components/ui/tabs';
import { OverviewPanel } from './overview-panel';
import { UsersPanel } from './users-panel';
import { ActivityPanel } from './activity-panel';

export const metadata: Metadata = { title: 'Admin' };

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'activity', label: 'Activity' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ICONS = { overview: ServerCog, users: Users, activity: Activity } as const;

/**
 * The administrator's page.
 *
 * `requireAdmin()` runs in the group's layout AND here. That is not
 * belt-and-braces theatre: a page is the thing an attacker requests, and a
 * guard that lives only one level up is a guard that a future refactor of the
 * layout can remove without anything going red. The nav link is hidden from a
 * non-admin as a courtesy; these two are what make it true. A non-admin gets a
 * 404 rather than a redirect, because "this route exists and is not for you" is
 * information.
 *
 * **Only the visible tab is queried.** The three panels want different, mostly
 * unrelated data — a users-with-counts join, a whole-instance audit trail, an
 * environment probe — and fetching all three on every visit would triple the
 * page's work to render a third of it. `?tab=` rather than client state, for
 * the reason in `components/ui/tabs.tsx`: it is a navigation, and it should
 * survive a reload and a shared link.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();

  const params = await searchParams;
  const requested = typeof params.tab === 'string' ? params.tab : 'overview';
  const tab: TabId = TABS.some((entry) => entry.id === requested)
    ? (requested as TabId)
    : 'overview';
  const action = typeof params.action === 'string' ? params.action : undefined;

  const Icon = ICONS[tab];

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
          Admin
        </h1>
        <p className="text-muted-foreground text-sm">
          Accounts on this deployment, and what it is running. Nobody&rsquo;s ledger is visible here
          — Firefly III holds the financial records, and this app only ever reaches them with the
          account holder&rsquo;s own token.
        </p>
      </header>

      <Tabs label="Admin sections" basePath="/admin" active={tab} tabs={TABS} />

      {tab === 'overview' ? (
        <OverviewPanel stats={await adminStats()} system={await systemInfo()} />
      ) : null}

      {tab === 'users' ? (
        <UsersPanel
          users={await listAdminUsers()}
          currentUserId={session.user.id}
          adminCount={await adminCount()}
          timezone={session.user.timezone}
          locale={session.user.locale}
        />
      ) : null}

      {tab === 'activity' ? (
        <ActivityPanel
          entries={await listAdminAuditLog({ limit: 150, action })}
          actions={await listAdminAuditActions()}
          activeAction={action}
          timezone={session.user.timezone}
          locale={session.user.locale}
        />
      ) : null}
    </div>
  );
}
