'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Plus, Settings2, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { switchConnectionAction } from '@/server/connections/switch-action';

/**
 * E2-23 — the instance switcher.
 *
 * The data model has supported N connections since M1; what was missing was any
 * way to move between them. "Active" is the `is_default` flag, which every read
 * path already resolves through `getDefaultConnection`, so switching is a flag
 * flip rather than a new concept.
 *
 * With a single connection this degrades to a plain status label — a dropdown
 * with one item is noise.
 */

export interface SwitchableConnection {
  id: string;
  label: string;
  status: string | null;
  isDefault: boolean;
}

export function ConnectionSwitcher({ connections }: { connections: SwitchableConnection[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const active = connections.find((entry) => entry.isDefault) ?? connections[0];
  if (!active) return null;

  const dot = (status: string | null) =>
    status === 'ok' ? 'bg-income' : status === null ? 'bg-muted-foreground' : 'bg-warning';

  if (connections.length === 1) {
    return (
      <span className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:inline-flex">
        <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot(active.status))} />
        {active.label}
        <span className="sr-only">
          {active.status === 'ok' ? 'connected' : `status: ${active.status}`}
        </span>
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending} className="max-w-[14rem]">
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot(active.status))} />
          <span className="truncate">{active.label}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>Firefly instance</DropdownMenuLabel>
        {connections.map((connection) => (
          <DropdownMenuItem
            key={connection.id}
            onSelect={() =>
              startTransition(async () => {
                await switchConnectionAction(connection.id);
                // Every cached read is scoped to the old connection, so the
                // whole tree has to re-render against the new one.
                router.refresh();
              })
            }
          >
            <Check
              className={cn('size-4', connection.isDefault ? 'opacity-100' : 'opacity-0')}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{connection.label}</span>
            {connection.status && connection.status !== 'ok' ? (
              <TriangleAlert className="text-warning size-3.5 shrink-0" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/onboarding?add=1')}>
          <Plus className="size-4" aria-hidden="true" />
          Add another instance
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/settings/connections')}>
          <Settings2 className="size-4" aria-hidden="true" />
          Manage connections
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
