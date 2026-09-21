import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecheckButton } from '@/components/connection-recheck';
import { recheckConnectionAction } from '@/server/connections/actions';

/**
 * E2-25 — the global "this connection is broken" banner.
 *
 * Without it, a revoked token looks exactly like a quiet month: every page
 * renders, every figure is just stale. The banner names the cause and links to
 * the one action that fixes it, because "unauthorised" and "unreachable" need
 * completely different responses from the user.
 */
export function ConnectionBanner({
  label,
  status,
  connectionId,
}: {
  label: string;
  status: string;
  connectionId: string;
}) {
  if (status === 'ok') return null;

  const unauthorised = status === 'unauthorised';
  const outdated = status === 'version_unsupported';

  const message = unauthorised
    ? `${label} rejected its access token. Anything shown below may be out of date.`
    : outdated
      ? `${label} is running a Firefly III version this app does not support.`
      : `${label} could not be reached. Anything shown below may be out of date.`;

  return (
    <div
      role="status"
      data-print="hide"
      className="bg-warning/15 border-warning/40 flex flex-wrap items-center gap-3 border-b px-4 py-2 sm:px-6"
    >
      <TriangleAlert className="text-warning size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">{message}</p>

      {/*
        Two actions, and the order is the point: the primary one is whatever
        actually fixes THIS cause. A rejected token needs a new token and no
        amount of retrying will help, so "Try again" is offered second there —
        but still offered, because a token can also be rejected by an instance
        that was mid-restart. An unreachable host is the opposite: retrying is
        the first thing worth doing, and it is what a user reaches for before
        they will believe a settings page.
      */}
      <div className="flex shrink-0 items-center gap-2">
        {unauthorised ? (
          <>
            <Button asChild size="sm" variant="outline">
              <Link href={`/settings/connections?reauth=${connectionId}`}>Re-authenticate</Link>
            </Button>
            <form action={recheckConnectionAction}>
              <input type="hidden" name="connectionId" value={connectionId} />
              <RecheckButton />
            </form>
          </>
        ) : (
          <>
            <form action={recheckConnectionAction}>
              <input type="hidden" name="connectionId" value={connectionId} />
              <RecheckButton />
            </form>
            <Button asChild size="sm" variant="ghost">
              <Link href="/settings/connections">Check settings</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
