import { PageSkeleton } from '@/components/page-skeleton';

/**
 * E22-04 — the prefetchable shell for this route. See `PageSkeleton`:
 * without a loading boundary, Next prefetches a dynamic route not at all.
 */
export default function Loading() {
  return <PageSkeleton tiles={4} chart rows={4} />;
}
