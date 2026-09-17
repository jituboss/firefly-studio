import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { savedReports } from '@/server/db/schema';

/** E14-10 — persisted custom-report definitions. */

export interface SavedReportInput {
  name: string;
  type: string;
  config: Record<string, unknown>;
  isPinned?: boolean;
}

export async function listSavedReports(userId: string) {
  return db
    .select()
    .from(savedReports)
    .where(eq(savedReports.userId, userId))
    .orderBy(desc(savedReports.isPinned), desc(savedReports.createdAt));
}

export async function createSavedReport(userId: string, input: SavedReportInput) {
  const [row] = await db
    .insert(savedReports)
    .values({
      userId,
      name: input.name,
      type: input.type,
      config: input.config,
      isPinned: input.isPinned ?? false,
    })
    .returning();
  return row;
}

/** Every mutation is scoped by `userId` as well as `id`, so a guessed report
 *  id belonging to another account matches no row rather than being edited. */
export async function setSavedReportPinned(userId: string, id: string, isPinned: boolean) {
  const [row] = await db
    .update(savedReports)
    .set({ isPinned, updatedAt: new Date() })
    .where(and(eq(savedReports.id, id), eq(savedReports.userId, userId)))
    .returning();
  return row;
}

export async function deleteSavedReport(userId: string, id: string) {
  await db
    .delete(savedReports)
    .where(and(eq(savedReports.id, id), eq(savedReports.userId, userId)));
}
