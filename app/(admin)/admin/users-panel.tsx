'use client';

import * as React from 'react';
import {
  MailCheck,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { ConfirmButton } from '@/components/ui/confirm';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import {
  refuseDeletion,
  refuseRoleChange,
  refuseStatusChange,
  type AdminTarget,
} from '@/lib/roles';
import { manageUserAction } from '@/server/admin-actions';
import type { AdminUserRow } from '@/server/admin';

/**
 * Every account on this deployment, and what can be done to each.
 *
 * **The refusals in `lib/roles.ts` are consulted here as well as on the
 * server.** Not as a security measure — the server decides, and this file is
 * shipped to the browser where anyone can edit it — but because a menu that
 * offers "Remove administrator" on the only administrator is a menu that lies.
 * Disabling it with the reason attached answers the question before it is
 * asked. The server re-checks regardless, which is what makes it safe.
 *
 * **The result is a toast, and that is not a style choice.**
 *
 * It was a `useActionState` banner above the table, and the banner never
 * appeared. Every one of these operations ends in `revalidatePath('/admin')`,
 * which re-renders the route; the hook's state does not survive that, so the
 * write landed, the audit row was written, and the panel said nothing at all —
 * which reads exactly like a button that does nothing. Two rewrites chased it
 * as a form-lifecycle problem (the row menu closes on select, so the `<form>`
 * unmounted mid-submit) and neither fixed it, because the revalidation was the
 * cause both times. Confirmed by looking for `[role=status]` anywhere in the
 * document after an action that the audit log proved had run: there was none.
 *
 * `Toaster` is mounted in the ROOT layout, above every route segment, and
 * `toast()` is an imperative global call. So the confirmation is fired from the
 * click handler's own promise callback and cannot be taken down by anything
 * re-rendering underneath it.
 */
export function UsersPanel({
  users,
  currentUserId,
  adminCount,
  timezone,
  locale,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  adminCount: number;
  timezone: string;
  locale: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const context = { actorId: currentUserId, adminCount };

  /**
   * Post one operation and say what happened.
   *
   * `startTransition` keeps the revalidation that follows from blocking the
   * menu closing. The toast is raised inside the transition's own async body,
   * so it does not matter what has re-rendered by the time the server answers.
   */
  const send = React.useCallback((fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);

    startTransition(async () => {
      const result = await manageUserAction(formData);
      if (result.error) toast.error(result.error);
      else if (result.notice) toast.success(result.notice);
    });
  }, []);

  return (
    <div className="space-y-3" aria-busy={pending}>
      <Card className="min-w-0">
        <CardContent className="min-w-0 p-0">
          {/*
            A real table, and NO scroll container around it.

            It used to be `overflow-x-auto` with a `min-w-[46rem]` table inside,
            which broke the row menu: `overflow-x: auto` computes the other axis
            to `auto` too — a `visible` axis cannot pair with a clipped one — so
            the wrapper became a VERTICAL scroll container as well. The ⋯ menu
            is absolutely positioned inside it, so on the lower rows it was
            clipped and had to be scrolled into view inside the table. Measured
            on the last row: the panel ran to y=954 against a wrapper ending at
            y=843, leaving 4px of a 115px menu visible. That is rule 7 in
            LEARNING.md, met from the other direction — the earlier note is
            about `overflow-x-hidden` breaking sticky, and this is the same
            single-axis-clipping rule breaking a popover.

            Narrow screens drop columns instead of scrolling, which also fixes
            something that was wrong before the menu ever opened: on a phone the
            actions column sat ~400px off-screen, so reaching any of these
            operations meant scrolling a table sideways first. The facts that
            leave the header at each breakpoint are folded under the account
            name, so nothing is actually lost — only the column alignment, which
            is what you give up when there is no room for columns.
          */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Account
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Role
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium xl:table-cell">
                  Connections
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Last seen
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  context={context}
                  timezone={timezone}
                  locale={locale}
                  send={send}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Deleting an account here removes its sessions and its stored Firefly credentials. It does
        not touch the Firefly III instance those credentials pointed at, or anything recorded in it.
      </p>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  context,
  timezone,
  locale,
  send,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  context: { actorId: string; adminCount: number };
  timezone: string;
  locale: string;
  send: (fields: Record<string, string>) => void;
}) {
  const target: AdminTarget = {
    id: user.id,
    role: user.role,
    status: user.status,
    isDemo: user.isDemo,
  };

  const nextRole = user.role === 'admin' ? 'user' : 'admin';
  const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';

  const roleRefusal = refuseRoleChange(target, nextRole, context);
  const statusRefusal = refuseStatusChange(target, nextStatus, context);
  const deleteRefusal = refuseDeletion(target, context);

  return (
    <tr className="border-b last:border-b-0">
      <td className="min-w-0 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            <span className="truncate">{user.displayName ?? user.email}</span>
            {isSelf ? (
              <span className="text-muted-foreground shrink-0 text-xs font-normal">(you)</span>
            ) : null}
            {user.isDemo ? <Badge variant="outline">Demo</Badge> : null}
          </span>
          {user.displayName ? (
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          ) : null}

          {/*
            Everything the header drops at this width, folded under the name.

            A column that disappears without its value reappearing somewhere is
            a fact quietly withheld, and "is this person an administrator" is
            not a fact to withhold on a phone. Each line here is hidden again at
            exactly the breakpoint where its own column comes back.
          */}
          <span className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
            <RoleTag role={user.role} />
            <StatusCell user={user} />
          </span>
          <span className="text-muted-foreground mt-1 text-xs lg:hidden">
            <span className="xl:hidden">
              {user.connections} connection{user.connections === 1 ? '' : 's'}
              {user.activeSessions > 0 ? ` · ${user.activeSessions} signed in` : ''}
              {' · '}
            </span>
            {user.lastLoginAt ? when(user.lastLoginAt, timezone, locale) : 'Never signed in'}
          </span>
        </div>
      </td>

      <td className="hidden px-4 py-3 sm:table-cell">
        <RoleTag role={user.role} />
      </td>

      <td className="hidden px-4 py-3 sm:table-cell">
        <StatusCell user={user} />
      </td>

      <td className="tabular hidden px-4 py-3 xl:table-cell">
        {user.connections}
        {user.activeSessions > 0 ? (
          <span className="text-muted-foreground ml-1.5 text-xs">
            · {user.activeSessions} signed in
          </span>
        ) : null}
      </td>

      <td className="text-muted-foreground hidden px-4 py-3 text-xs lg:table-cell">
        {user.lastLoginAt ? when(user.lastLoginAt, timezone, locale) : 'Never'}
      </td>

      <td className="px-4 py-3 text-right">
        <Popover
          align="end"
          label={`Manage ${user.email}`}
          contentClassName="w-64"
          trigger={(props) => (
            <Button
              {...props}
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Manage ${user.email}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          )}
        >
          {(close) => (
            <div className="p-1">
              <MenuItem
                icon={nextRole === 'admin' ? Shield : ShieldOff}
                refusal={roleRefusal}
                label={nextRole === 'admin' ? 'Make administrator' : 'Remove administrator'}
                onSelect={() => {
                  send({ intent: 'role', userId: user.id, role: nextRole });
                  close();
                }}
              />

              <MenuItem
                icon={nextStatus === 'suspended' ? UserX : UserCheck}
                refusal={statusRefusal}
                label={nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
                onSelect={() => {
                  send({ intent: 'status', userId: user.id, status: nextStatus });
                  close();
                }}
              />

              {user.emailVerifiedAt ? null : (
                <MenuItem
                  icon={MailCheck}
                  refusal={null}
                  label="Confirm email address"
                  onSelect={() => {
                    send({ intent: 'verify-email', userId: user.id });
                    close();
                  }}
                />
              )}

              <div className="-mx-1 my-1 border-t" />

              <div className="px-1">
                <ConfirmButton
                  variant="ghost"
                  size="sm"
                  className="text-expense hover:bg-expense-muted h-8 w-full justify-start"
                  disabled={Boolean(deleteRefusal)}
                  title="Delete this account"
                  confirmLabel="Delete"
                  message={`Delete ${user.email}? Their sessions and stored Firefly credentials are removed. Nothing in their Firefly III instance is touched. This cannot be undone.`}
                  onConfirm={() => {
                    send({ intent: 'delete', userId: user.id });
                    close();
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete account
                </ConfirmButton>
                {deleteRefusal ? (
                  <p className="text-muted-foreground px-2 pb-1 text-xs">{deleteRefusal}</p>
                ) : null}
              </div>
            </div>
          )}
        </Popover>
      </td>
    </tr>
  );
}

function RoleTag({ role }: { role: AdminUserRow['role'] }) {
  return role === 'admin' ? (
    <Badge variant="secondary">
      <Shield className="size-3" aria-hidden="true" />
      Admin
    </Badge>
  ) : (
    <span className="text-muted-foreground text-xs">User</span>
  );
}

function StatusCell({ user }: { user: AdminUserRow }) {
  if (user.status === 'suspended') return <Badge variant="expense">Suspended</Badge>;
  if (!user.emailVerifiedAt) return <Badge variant="warning">Unconfirmed</Badge>;
  if (!user.onboardingCompletedAt) return <Badge variant="outline">Onboarding</Badge>;
  return <Badge variant="income">Active</Badge>;
}

function MenuItem({
  icon: Icon,
  label,
  refusal,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  refusal: string | null;
  onSelect: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        disabled={Boolean(refusal)}
        className={cn(
          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
          refusal ? 'text-muted-foreground cursor-not-allowed opacity-60' : 'hover:bg-accent',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </button>
      {/* The reason, not just a greyed-out control. "Remove administrator" that
          does nothing when pressed is indistinguishable from a bug. */}
      {refusal ? <p className="text-muted-foreground px-2 pb-1.5 text-xs">{refusal}</p> : null}
    </>
  );
}

/** The exact instant, not "2 days ago" — this is an audit surface. */
function when(value: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(value);
}
