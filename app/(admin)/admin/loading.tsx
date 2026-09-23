import { PageSkeleton } from '@/components/page-skeleton';

/* A loading boundary is not only a loading state: Next's `auto` prefetch
   follows a dynamic route only as far as its nearest one, so a route without
   it is never prefetched at all. See LEARNING.md §7a. */
export default function Loading() {
  return <PageSkeleton tiles={4} rows={8} />;
}
