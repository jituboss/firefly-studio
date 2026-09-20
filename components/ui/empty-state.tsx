import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * E21-04 — the empty state.
 *
 * Twenty-odd lists each had their own centred sentence, most of them a bare
 * "No budgets yet." with nothing to do about it. An empty list is the first
 * thing a new user sees on most of these pages, so it is the worst place to
 * say only that there is nothing there.
 *
 * Three parts, and the third is the point: a mark, a sentence that says why it
 * is empty rather than that it is empty, and the one action that fills it.
 *
 * The icon is decorative — `aria-hidden`, with the meaning carried by the
 * heading, because an illustration that a screen reader has to announce is
 * just a longer way of saying nothing.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        {Icon ? (
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
            <Icon className="size-6" aria-hidden="true" />
          </div>
        ) : null}

        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          {description ? (
            <p className="text-muted-foreground mx-auto max-w-prose text-sm">{description}</p>
          ) : null}
        </div>

        {action || secondaryAction ? (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {action ? (
              <Button asChild size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button asChild size="sm" variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** The same shape, for a list that is empty because a filter excluded everything. */
export function NoResults({
  icon: Icon,
  title = 'Nothing matches those filters',
  description,
  clearHref,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  clearHref: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={
        description ??
        'There is data here, just none in this period or matching these filters. Widening the range is usually the fix.'
      }
      action={{ label: 'Clear filters', href: clearHref }}
      className={cn(className)}
    />
  );
}
