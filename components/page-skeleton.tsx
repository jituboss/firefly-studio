import { Skeleton } from '@/components/ui/skeleton';

/**
 * E22-04 / E21-04 — the shape a page wears while its data is in flight.
 *
 * This is not only a loading state. Every page in this app is dynamic — it
 * reads cookies and then calls the user's Firefly instance — and Next's `auto`
 * prefetch will fetch a dynamic route only as far as its nearest `loading`
 * boundary. With no boundary anywhere in the app, hovering or even looking at
 * a nav link prefetched nothing at all, and every navigation started from
 * cold. A `loading.tsx` gives the router something static and cheap to fetch
 * ahead of time, so the skeleton is already in the client when the link is
 * clicked.
 *
 * Cheap is the operative word: what gets prefetched is this markup, not the
 * page's data. A prefetch that reached Firefly would multiply load on somebody
 * else's self-hosted instance for a page they might never open.
 *
 * `aria-busy` rather than a live region: a screen reader should not announce a
 * wall of placeholder boxes, and the real heading arrives moments later.
 */
export function PageSkeleton({
  rows = 6,
  chart = false,
  tiles = 0,
}: {
  rows?: number;
  chart?: boolean;
  /** KPI cards above the content, as on the dashboard and the reports. */
  tiles?: number;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {tiles > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: tiles }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}

      {chart ? <Skeleton className="h-64 rounded-xl" /> : null}

      <div className="space-y-px overflow-hidden rounded-xl border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-4 max-w-[16rem] flex-1" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
