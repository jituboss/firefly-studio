import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button asChild size="sm" variant="outline">
        <Link
          href={
            unauthorised ? `/settings/connections?reauth=${connectionId}` : '/settings/connections'
          }
        >
          {unauthorised ? 'Re-authenticate' : 'Check connection'}
        </Link>
      </Button>
    </div>
  );
}
