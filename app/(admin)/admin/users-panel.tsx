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
            A real table, and it scrolls on a narrow screen rather than
            collapsing to cards. Six columns of short facts about one person is
            the shape a table is for, and an operator comparing rows — who is an
            admin, who never confirmed their address — is doing the thing that
            only works when the columns line up.
          */}
          {/*
            `relative` is load-bearing, not decoration.

            The last header cell holds a `sr-only` label for the actions column,
            and `sr-only` is `position: absolute`. With no positioned ancestor
            its containing block resolves all the way up to the initial one, so
            it is NOT clipped by this scroll container — it lands at the far
            right edge of the 46rem table, in viewport coordinates, and drags
            the page with it. Measured on a 390px screen: `body.scrollWidth`
            stayed 390 and every element tested as "inside a scroller", while
            the viewport scrolled sideways by 362px. The offender was a 1px
            span. Making this the containing block clips it here, where
            everything else in the table already is.
          */}
          <div className="relative min-w-0 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Connections
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
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
          </div>
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
      <td className="px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{user.displayName ?? user.email}</span>
            {isSelf ? (
              <span className="text-muted-foreground text-xs font-normal">(you)</span>
            ) : null}
            {user.isDemo ? <Badge variant="outline">Demo</Badge> : null}
          </span>
          {user.displayName ? (
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3">
        {user.role === 'admin' ? (
          <Badge variant="secondary">
            <Shield className="size-3" aria-hidden="true" />
            Admin
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">User</span>
        )}
      </td>

      <td className="px-4 py-3">
        <StatusCell user={user} />
      </td>

      <td className="tabular px-4 py-3">
        {user.connections}
        {user.activeSessions > 0 ? (
          <span className="text-muted-foreground ml-1.5 text-xs">
            · {user.activeSessions} signed in
          </span>
        ) : null}
      </td>

      <td className="text-muted-foreground px-4 py-3 text-xs">
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
