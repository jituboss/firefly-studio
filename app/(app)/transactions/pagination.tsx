'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** E5-03 — pagination over Firefly's `meta.pagination` contract. */
export function Pagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function goTo(next: number) {
    const search = new URLSearchParams(params.toString());
    search.set('page', String(next));
    startTransition(() => router.push(`${pathname}?${search.toString()}`));
  }

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} · {total.toLocaleString()} transactions
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || pending}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || pending}
          onClick={() => goTo(page + 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
