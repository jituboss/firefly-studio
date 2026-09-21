'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The pending half of the banner's "Try again".
 *
 * A client component for one reason: the probe is a round trip to someone
 * else's server, and on the unreachable path it runs to a timeout. A button
 * that looks untouched for ten seconds reads as broken, and the user clicks it
 * again — queueing a second probe behind the first.
 */
export function RecheckButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <RotateCw className="size-3.5" aria-hidden="true" />
      )}
      {pending ? 'Checking…' : 'Try again'}
    </Button>
  );
}
