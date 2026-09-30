'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/server/auth/session';
import { saveMobileNav } from '@/server/mobile-nav';
import { parseMobileNav, type MobileNavSlots } from '@/lib/mobile-nav';

/**
 * Save the bottom bar's two slots. The argument comes from the browser, so it
 * is parsed like anything else read from outside. The layout renders the bar,
 * hence the layout-wide revalidation.
 */
export async function saveMobileNavAction(raw: unknown): Promise<MobileNavSlots> {
  const session = await requireSession();
  const slots = parseMobileNav(raw);
  await saveMobileNav(session.user.id, slots);
  revalidatePath('/', 'layout');
  return slots;
}
