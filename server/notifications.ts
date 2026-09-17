import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { notifications } from '@/server/db/schema';

export type NotificationKind = 'over_budget' | 'unpaid_bill' | 'connection_failing';

export async function listUnreadNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(
  userId: string,
  kind: NotificationKind,
  payload: Record<string, unknown>,
) {
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.kind, kind),
        isNull(notifications.readAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) return existing[0]!.id;

  const inserted = await db
    .insert(notifications)
    .values({ userId, kind, payload })
    .returning({ id: notifications.id });
  return inserted[0]!.id;
}

export async function markNotificationRead(userId: string, id: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.id, id)));
}

export async function dismissAllNotifications(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
