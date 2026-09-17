import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { savedViews } from '@/server/db/schema';

/** E5-04 — persisted filter presets for list pages. */

export interface SavedViewInput {
  name: string;
  entity: string;
  query: Record<string, unknown>;
  isPinned?: boolean;
  sortOrder?: number;
}

export async function listSavedViews(userId: string, entity: string) {
  return db
    .select()
    .from(savedViews)
    .where(and(eq(savedViews.userId, userId), eq(savedViews.entity, entity)))
    .orderBy(savedViews.sortOrder, savedViews.createdAt);
}

export async function createSavedView(userId: string, input: SavedViewInput) {
  const [row] = await db
    .insert(savedViews)
    .values({
      userId,
      name: input.name,
      entity: input.entity,
      query: input.query,
      isPinned: input.isPinned ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateSavedView(userId: string, id: string, input: Partial<SavedViewInput>) {
  const [row] = await db
    .update(savedViews)
    .set({
      name: input.name,
      query: input.query,
      isPinned: input.isPinned,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
    .returning();
  return row;
}

export async function deleteSavedView(userId: string, id: string) {
  await db.delete(savedViews).where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)));
}
