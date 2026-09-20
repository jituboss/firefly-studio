import Link from 'next/link';
import {
  AlertTriangle,
  KeyRound,
  Timer,
  WifiOff,
  SearchX,
  ServerCrash,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { presentError, presentErrorKind, type ErrorKind } from '@/lib/error-taxonomy';

/**
 * E21-05 — the error state, one per kind in the taxonomy.
 *
 * Deliberately NOT a client component. A page rendering this needs no
 * interactivity — every action is a link — and marking it `use client` cost
 * the piggy-banks route 14 kB gzipped for a card it renders only when Firefly
 * is down. The bundle budget caught that (+11%). The route error boundary is
 * already a client component, so importing this from there pulls it into that
 * graph and `onRetry` works; server pages simply do not pass one.
 *
 * The icon differs per kind on purpose: a revoked token and an unreachable
 * server are different problems with different fixes, and a single red
 * triangle for both trains people to read neither.
 */
const ICONS: Record<ErrorKind, typeof AlertTriangle> = {
  network: WifiOff,
  auth: KeyRound,
  forbidden: KeyRound,
  'rate-limit': Timer,
  validation: AlertTriangle,
  'not-found': SearchX,
  'firefly-down': ServerCrash,
  config: Settings2,
  unknown: AlertTriangle,
};

export function ErrorState({
  error,
  kind,
  onRetry,
  digest,
  className,
}: {
  /** Pass the thrown thing, or a `kind` when it is already known. */
  error?: unknown;
  kind?: ErrorKind;
  onRetry?: () => void;
  digest?: string;
  className?: string;
}) {
  const presentation = kind ? presentErrorKind(kind) : presentError(error);
  const Icon = ICONS[presentation.kind];

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div
          className={
            presentation.kind === 'rate-limit'
              ? 'bg-warning-muted text-warning flex size-12 items-center justify-center rounded-full'
              : 'bg-expense-muted text-expense flex size-12 items-center justify-center rounded-full'
          }
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          {/* role=alert: this replaced content the user was waiting for, so it
              has to be announced rather than merely present. */}
          <p className="font-medium" role="alert">
            {presentation.title}
          </p>
          <p className="text-muted-foreground mx-auto max-w-prose text-sm">
            {presentation.description}
          </p>
          {digest ? (
            <p className="text-muted-foreground pt-1 font-mono text-xs">Reference: {digest}</p>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {presentation.action.href ? (
            <Button asChild size="sm">
              <Link href={presentation.action.href}>{presentation.action.label}</Link>
            </Button>
          ) : null}
          {presentation.action.retry && onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {presentation.action.label}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
