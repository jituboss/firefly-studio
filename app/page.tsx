import { redirect } from 'next/navigation';
import { getPreferences } from '@/server/preferences';

/** Middleware sends signed-out visitors to /sign-in before this renders. */
export default async function Home() {
  // E18-02 — the one place that resolves "where does this account start?".
  // Middleware cannot: it runs on the edge and has no database.
  redirect((await getPreferences()).defaultLandingPage);
}
