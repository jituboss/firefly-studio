'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/auth/form-shell';

export interface BulkAssignState {
  error?: string;
  ok?: boolean;
}

function Submit({ count, applyLabel }: { count: number; applyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || count === 0}>
      {pending ? 'Applying…' : `${applyLabel} ${count}`}
    </Button>
  );
}

/**
 * E7-04 — sticky bulk-action bar: pick a value and apply it to every
 * selected transaction group. Shared by the uncategorised inbox and the
 * transactions-without-budget page.
 */
export function BulkAssignToolbar({
  action,
  endpoint,
  valueName,
  applyLabel,
  placeholder,
  selectedIds,
  onSuccess,
}: {
  action: (state: BulkAssignState, formData: FormData) => Promise<BulkAssignState>;
  endpoint: string;
  valueName: string;
  applyLabel: string;
  placeholder: string;
  selectedIds: string[];
  onSuccess?: () => void;
}) {
  const [value, setValue] = React.useState('');
  const [state, dispatch] = useActionState<BulkAssignState, FormData>(action, {});

  const onSuccessRef = React.useRef(onSuccess);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  React.useEffect(() => {
    if (state.ok) {
      setValue('');
      onSuccessRef.current?.();
    }
  }, [state]);

  const formAction = (formData: FormData) => {
    formData.set(valueName, value);
    dispatch(formData);
  };

  const count = selectedIds.length;

  return (
    <form action={formAction} className="bg-muted/50 sticky top-14 z-10 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[12rem] flex-1">
          <Combobox
            id={`bulk-${endpoint}-picker`}
            endpoint={endpoint}
            value={value}
            onChange={setValue}
            placeholder={placeholder}
            allowFreeText
          />
        </div>
        <Submit count={count} applyLabel={applyLabel} />
        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      </div>
      <input type="hidden" name={valueName} value={value} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
    </form>
  );
}
