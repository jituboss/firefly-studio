'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { RANGE_PRESETS } from '@/lib/date-range';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** E3-02 — writes the choice to the URL; every page reads it from there. */
export function DateRangePicker({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set('range', value);
    next.delete('start');
    next.delete('end');
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <CalendarDays className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {RANGE_PRESETS.map((preset) => (
          <DropdownMenuItem key={preset.value} onSelect={() => select(preset.value)}>
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
