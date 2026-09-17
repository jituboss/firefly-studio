import 'server-only';
import { headers } from 'next/headers';

/**
 * IP and user-agent for the current request, as recorded on sessions and audit
 * rows.
 *
 * Lives outside `actions.ts` because that file is `'use server'`: every export
 * from a `'use server'` module becomes a callable Server Action with a public
 * endpoint, so a plain helper cannot be exported from there just to share it.
 */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const headerList = await headers();
  return {
    // x-forwarded-for is a client-controlled header; it is trusted only as far
    // as an audit hint, never for authorisation.
    ip:
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headerList.get('x-real-ip') ??
      null,
    userAgent: headerList.get('user-agent') ?? null,
  };
}
