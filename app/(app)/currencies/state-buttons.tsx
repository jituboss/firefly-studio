'use client';

import { useFormStatus } from 'react-dom';
import { Star, Check, X } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { setCurrencyStateAction, deleteCurrencyAction } from '@/server/firefly/currency-actions';
import { Button } from '@/components/ui/button';

function Pending({ label, icon }: { label: string; icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="ghost" disabled={pending} title={label}>
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

/** E13-01 — enable, disable and set-primary are three separate endpoints. */
export function CurrencyStateButtons({
  code,
  enabled,
  primary,
}: {
  code: string;
  enabled: boolean;
  primary: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {primary ? (
        <span className="text-muted-foreground inline-flex items-center gap-1 px-2 text-xs">
          <Star className="fill-primary text-primary size-3.5" aria-hidden="true" />
          primary
        </span>
      ) : (
        <form action={setCurrencyStateAction}>
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="state" value="primary" />
          <Pending
            label={`Make ${code} the primary currency`}
            icon={<Star className="size-4" aria-hidden="true" />}
          />
        </form>
      )}

      {/* Firefly will not let the primary currency be switched off, so the
          control is simply not offered for it. */}
      {primary ? null : (
        <form action={setCurrencyStateAction}>
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="state" value={enabled ? 'disable' : 'enable'} />
          <Pending
            label={enabled ? `Disable ${code}` : `Enable ${code}`}
            icon={
              enabled ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )
            }
          />
        </form>
      )}
    </div>
  );
}

export function DeleteCurrencyButton({ code }: { code: string }) {
  return (
    <form action={deleteCurrencyAction}>
      <input type="hidden" name="code" value={code} />
      <ConfirmButton
        message={`Delete ${code}? Anything recorded in it keeps its amounts.`}
        confirmLabel="Delete currency"
        pendingLabel="Deleting…"
      >
        Delete currency
      </ConfirmButton>
    </form>
  );
}
