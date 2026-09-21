'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Shuffle } from 'lucide-react';
import { convertTransactionAction } from '@/server/firefly/transaction-actions';
import {
  CONVERTIBLE_TYPES,
  SIDE_LABELS,
  TYPE_LABELS,
  planConversion,
  type SplitLike,
  type TransactionType,
} from '@/lib/transaction-convert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/input';
import { FormMessage } from '@/components/auth/form-shell';

const ICONS: Record<TransactionType, typeof ArrowUpRight> = {
  withdrawal: ArrowUpRight,
  deposit: ArrowDownLeft,
  transfer: ArrowLeftRight,
};

/**
 * E5-19 — "this was an expense, actually it was a transfer between my own
 * accounts".
 *
 * Firefly's stock UI has this and ours did not, so the only way to fix a
 * mistyped transaction was to delete it and re-enter it — losing its
 * attachments, its tags and its id.
 *
 * The dialog exists rather than a bare menu item because a conversion cannot be
 * done blind: every type needs a different kind of account on the far side, and
 * the old one cannot carry over. So the flow is: pick the new type, see in
 * plain words what that will mean, name the other side, confirm.
 */
export function ConvertDialog({ id, splits }: { id: string; splits: SplitLike[] }) {
  const [target, setTarget] = React.useState<TransactionType | null>(null);
  const first = splits[0];
  const current = (first?.type.toLowerCase() ?? '') as TransactionType;

  const options = CONVERTIBLE_TYPES.filter((type) => type !== current);
  if (!first || !CONVERTIBLE_TYPES.includes(current)) return null;

  return (
    <>
      {/*
        A menu rather than two buttons in the row. There are only ever two
        targets, but "Change to transfer" and "Change to income" sitting beside
        Edit and Duplicate make the primary actions harder to find — and this is
        a correction, not something anyone does daily.
      */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Shuffle className="size-4" aria-hidden="true" />
            Change type
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-muted-foreground">
            Currently {TYPE_LABELS[current].toLowerCase()}
          </DropdownMenuLabel>
          {options.map((type) => {
            const Icon = ICONS[type];
            return (
              <DropdownMenuItem key={type} onSelect={() => setTarget(type)}>
                <Icon className="size-4" aria-hidden="true" />
                {TYPE_LABELS[type]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {target ? (
        <ConvertForm id={id} splits={splits} target={target} onClose={() => setTarget(null)} />
      ) : null}
    </>
  );
}

/*
 * The group title is deliberately NOT passed in. The action re-reads the whole
 * group server-side before writing, because the payload has to carry every
 * split — omitting one deletes it — and the browser only ever held the splits
 * that were on screen when the page rendered. Anything sent from here is a
 * stale copy of data whose loss is silent.
 */
function ConvertForm({
  id,
  splits,
  target,
  onClose,
}: {
  id: string;
  splits: SplitLike[];
  target: TransactionType;
  onClose: () => void;
}) {
  const [state, action] = useActionState(convertTransactionAction, {});
  const [accountName, setAccountName] = React.useState('');
  const [accountId, setAccountId] = React.useState('');

  const first = splits[0]!;
  const plan = planConversion(first, target);
  if (!plan || 'error' in plan) return null;

  const side = SIDE_LABELS[plan.askForKind];

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Change to ${TYPE_LABELS[target].toLowerCase()}`}
      description={plan.summary}
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="to" value={target} />
        <input type="hidden" name="accountId" value={accountId} />
        <input type="hidden" name="accountName" value={accountName} />

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

        <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
          <span className="text-muted-foreground">Stays as it is: </span>
          <span className="font-medium">{plan.keep.name}</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="convert-account">{side.label}</Label>
          <Combobox
            id="convert-account"
            endpoint="accounts"
            extraQuery={{ types: plan.askForFireflyType }}
            value={accountName}
            onChange={(value, option) => {
              setAccountName(value);
              // The id only counts when it came from the list. Typing over a
              // chosen option and keeping its id would silently convert to the
              // account the user just replaced.
              setAccountId(option && option.name === value ? option.id : '');
            }}
            placeholder={side.label}
            // Asset accounts must already exist; payees and payers do not,
            // and Firefly creates them from a name the way the entry form does.
            allowFreeText={plan.askForKind !== 'asset'}
          />
          <p className="text-muted-foreground text-xs">{side.hint}</p>
        </div>

        {splits.length > 1 ? (
          <p className="text-warning text-xs">
            This transaction has {splits.length} splits. All of them change together — Firefly has
            no way to convert one split on its own.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton disabled={!accountName.trim()} target={target} />
        </div>
      </form>
    </Dialog>
  );
}

function SubmitButton({ disabled, target }: { disabled: boolean; target: TransactionType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? 'Converting…' : `Change to ${TYPE_LABELS[target].toLowerCase()}`}
    </Button>
  );
}
