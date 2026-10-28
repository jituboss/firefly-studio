'use client';

import * as React from 'react';
import { Combobox } from '@/components/ui/combobox';
import {
  acceptsNewName,
  autocompleteTypes,
  kindFromFirefly,
  type AccountKind,
} from '@/lib/account-matrix';

export interface PickedAccount {
  name: string;
  /** Set only when the name was chosen from the list, never when typed. */
  id: string;
  kind: AccountKind | null;
}

export const NO_ACCOUNT: PickedAccount = { name: '', id: '', kind: null };

/**
 * The one account picker every transaction form uses, so the list of accounts
 * a side may hold comes from `lib/account-matrix.ts` and nowhere else.
 *
 * It hands back the id and kind as well as the name. Firefly keeps names
 * unique per account TYPE only, so an asset "Visa" and an expense "Visa" can
 * both exist, and a write that sends the name alone lets Firefly pick.
 */
export function AccountPicker({
  id,
  kinds,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string;
  kinds: AccountKind[];
  value: PickedAccount;
  onChange: (value: PickedAccount) => void;
  placeholder?: string;
  label?: string;
}) {
  const extraQuery = React.useMemo(() => ({ types: autocompleteTypes(kinds) }), [kinds]);
  const freeText = acceptsNewName(kinds);

  return (
    <Combobox
      id={id}
      endpoint="accounts"
      extraQuery={extraQuery}
      value={value.name}
      onChange={(name, option) =>
        // The id only counts when it came from the list. Typing over a chosen
        // option and keeping its id would write to the account just replaced.
        onChange(
          option && option.name === name
            ? { name, id: option.id, kind: kindFromFirefly(option.type) }
            : { name, id: '', kind: null },
        )
      }
      allowFreeText={freeText}
      placeholder={placeholder ?? (freeText ? 'Search or type a new name…' : 'Search accounts…')}
      label={label}
    />
  );
}
