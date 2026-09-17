'use client';

import * as React from 'react';
import { Bell, Check, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  markNotificationReadAction,
  dismissAllNotificationsAction,
} from '@/server/notifications-actions';
import { Button } from '@/components/ui/button';
import type { notifications } from '@/server/db/schema';

type Notification = typeof notifications.$inferSelect;

export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="bg-expense text-expense-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function NotificationInbox({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.readAt);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((s) => !s)}
        aria-label="Notifications"
      >
        <Bell className="size-5" aria-hidden="true" />
        <NotificationBadge count={unread.length} />
      </Button>

      {open ? (
        <div className="bg-popover absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border p-1 shadow-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread.length > 0 ? (
              <form action={dismissAllNotificationsAction}>
                <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Dismiss all
                </Button>
              </form>
            ) : null}
          </div>

          {unread.length === 0 ? (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              No new notifications.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {unread.map((n) => (
                <li key={n.id} className="hover:bg-accent/50 flex items-start gap-2 rounded-md p-2">
                  <TriangleAlert
                    className="text-expense mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{notificationText(n)}</p>
                    {n.kind === 'over_budget' ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 py-0 text-xs"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/budgets/${n.payload.budgetId}`);
                        }}
                      >
                        View budget
                      </Button>
                    ) : n.kind === 'unpaid_bill' ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 py-0 text-xs"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/bills/${n.payload.billId}`);
                        }}
                      >
                        View bill
                      </Button>
                    ) : null}
                  </div>
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" size="icon" className="size-6">
                      <Check className="size-3.5" aria-hidden="true" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function notificationText(n: Notification): string {
  if (n.kind === 'over_budget') {
    const name = String(n.payload.name ?? 'A budget');
    return `${name} is over budget this period.`;
  }
  if (n.kind === 'unpaid_bill') {
    const name = String(n.payload.name ?? 'A subscription');
    return `${name} is due and has not been paid.`;
  }
  return 'New notification.';
}
