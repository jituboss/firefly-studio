'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { savePreferenceAction, type PreferenceState } from '@/server/firefly/link-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  );
}

/** E18-01 — one editable Firefly preference. */
export function PreferenceRow({
  name,
  value,
  hint,
}: {
  name: string;
  value: string;
  hint?: string;
}) {
  const [state, action] = useActionState<PreferenceState, FormData>(savePreferenceAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 px-4 py-3">
      <input type="hidden" name="name" value={name} />
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate font-mono text-sm">{name}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        {state.error ? <p className="text-expense text-xs">{state.error}</p> : null}
        {state.ok ? <p className="text-income text-xs">Saved.</p> : null}
      </div>
      <Input name="value" defaultValue={value} className="w-40" aria-label={`Value for ${name}`} />
      <Submit />
    </form>
  );
}
