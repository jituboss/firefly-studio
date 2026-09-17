'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { describeAuditAction } from '@/lib/audit-labels';

/** E2-09 — narrow the trail to one event type. URL-synced like every other
 *  filter in the app, so a view of it is linkable. */
export function AuditFilter({ actions, selected }: { actions: string[]; selected?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <label className="sr-only" htmlFor="audit-action">
        Filter activity by type
      </label>
      <select
        id="audit-action"
        value={selected ?? ''}
        disabled={pending}
        className="border-input bg-background h-8 rounded-md border px-2 text-xs disabled:opacity-60"
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value) next.set('action', event.target.value);
          else next.delete('action');
          startTransition(() => router.push(`${pathname}?${next.toString()}`));
        }}
      >
        <option value="">All events</option>
        {actions.map((action) => (
          <option key={action} value={action}>
            {describeAuditAction(action)}
          </option>
        ))}
      </select>
    </>
  );
}
