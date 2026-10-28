'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Shuffle } from 'lucide-react';
import {
  AccountPicker,
  NO_ACCOUNT,
  type PickedAccount,
} from '@/components/transactions/account-picker';
import { convertTransactionAction } from '@/server/firefly/transaction-actions';
import {
  CONVERTIBLE_TYPES,
  TYPE_LABELS,
  describeConversion,
  planConversion,
  type SplitLike,
  type TransactionType,
} from '@/lib/transaction-convert';
import {
  KIND_LABELS,
  destinationKinds,
  pairProblem,
  sourceKinds,
  type AccountKind,
} from '@/lib/account-matrix';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
 *
 * Both sides are editable. The plan pre-fills whatever can survive — the
 * account you own, or both accounts reversed — but a conversion out of a loan
 * payment, say, may legitimately need both sides replaced, and a dialog that
 * only ever asked for one side could not express it.
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
  const first = splits[0]!;
  const plan = planConversion(first, target);
  const initial = plan && !('error' in plan) ? plan : null;

  const [source, setSource] = React.useState<PickedAccount>(initial?.source ?? NO_ACCOUNT);
  const [destination, setDestination] = React.useState<PickedAccount>(
    initial?.destination ?? NO_ACCOUNT,
  );

  if (!initial) return null;

  const narrowedSource = sourceKinds(target, destination.kind);
  const narrowedDestination = destinationKinds(target, source.kind);
  const sourceOptions = narrowedSource.length > 0 ? narrowedSource : sourceKinds(target);
  const destinationOptions =
    narrowedDestination.length > 0 ? narrowedDestination : destinationKinds(target);
  const problem =
    source.kind && destination.kind ? pairProblem(target, source.kind, destination.kind) : null;
  const ready = Boolean(source.name.trim() && destination.name.trim()) && !problem;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Change to ${TYPE_LABELS[target].toLowerCase()}`}
      description={describeConversion(target, source.name, destination.name)}
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="to" value={target} />
        <input type="hidden" name="sourceId" value={source.id} />
        <input type="hidden" name="sourceName" value={source.name} />
        <input type="hidden" name="sourceKind" value={source.kind ?? ''} />
        <input type="hidden" name="destinationId" value={destination.id} />
        <input type="hidden" name="destinationName" value={destination.name} />
        <input type="hidden" name="destinationKind" value={destination.kind ?? ''} />

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

        {initial.swapped ? (
          <p className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            The two accounts swap sides: the money now flows the other way between them.
          </p>
        ) : null}

        <SideField
          id="convert-source"
          label="From"
          kinds={sourceOptions}
          value={source}
          onChange={setSource}
        />
        <SideField
          id="convert-destination"
          label="To"
          kinds={destinationOptions}
          value={destination}
          onChange={setDestination}
        />

        {problem ? <p className="text-warning text-sm">{problem.message}</p> : null}

        {splits.length > 1 ? (
          <p className="text-warning text-xs">
            This transaction has {splits.length} splits. All of them change together — Firefly has
            no way to convert one split on its own. A side you leave as it is keeps each
            split&apos;s own account.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton disabled={!ready} target={target} />
        </div>
      </form>
    </Dialog>
  );
}

function SideField({
  id,
  label,
  kinds,
  value,
  onChange,
}: {
  id: string;
  label: string;
  kinds: AccountKind[];
  value: PickedAccount;
  onChange: (value: PickedAccount) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <AccountPicker id={id} kinds={kinds} value={value} onChange={onChange} placeholder={label} />
      <p className="text-muted-foreground text-xs">
        {kinds.map((kind) => KIND_LABELS[kind].toLowerCase()).join(', ')}
        {kinds.includes('expense') || kinds.includes('revenue')
          ? ' · a new name creates the payee or payer'
          : ''}
      </p>
    </div>
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
